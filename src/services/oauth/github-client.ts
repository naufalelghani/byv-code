// GitHub OAuth service for internal Anthropic team members
import axios from 'axios'
import { getOauthConfig } from '../../constants/oauth.js'
import { logError } from '../../utils/log.js'
import { logForDebugging } from '../../utils/debug.js'

const GITHUB_OAUTH_BASE_URL = 'https://github.com'
const GITHUB_API_BASE_URL = 'https://api.github.com'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

// GitHub OAuth scopes needed for organization membership verification
const GITHUB_OAUTH_SCOPES = ['read:user', 'read:org'].join(' ')

// Internal organization GitHub - only members of this org can use GitHub login
const INTERNAL_ORG = 'BYV-Dev-Unorganization'

// OAuth client config for GitHub
interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

// Get GitHub OAuth config from environment or settings
export function getGitHubOAuthConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || process.env.CLAUDE_CODE_GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || process.env.CLAUDE_CODE_GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getOauthConfig().MANUAL_REDIRECT_URL
  }
}

/**
 * Build the GitHub OAuth authorization URL
 */
export function buildGitHubAuthUrl(codeChallenge: string, state: string): string {
  const config = getGitHubOAuthConfig()
  if (!config) {
    throw new Error('GitHub OAuth not configured')
  }

  const url = new URL(`${GITHUB_OAUTH_BASE_URL}/login/oauth/authorize`)
  url.searchParams.append('client_id', config.clientId)
  url.searchParams.append('redirect_uri', config.redirectUri)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', GITHUB_OAUTH_SCOPES)
  url.searchParams.append('state', state)
  url.searchParams.append('code_challenge', codeChallenge)
  url.searchParams.append('code_challenge_method', 'S256')

  return url.toString()
}

/**
 * Exchange authorization code for GitHub access token
 */
export async function exchangeGitHubCodeForToken(
  authorizationCode: string,
  codeVerifier: string,
): Promise<{
  accessToken: string
  scope: string[]
  tokenType: string
} | null> {
  const config = getGitHubOAuthConfig()
  if (!config) {
    throw new Error('GitHub OAuth not configured')
  }

  try {
    const response = await axios.post(
      GITHUB_TOKEN_URL,
      {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code: authorizationCode,
        code_verifier: codeVerifier,
        state: codeVerifier, // Using codeVerifier as state for PKCE
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    )

    if (response.status !== 200 || response.data.error) {
      throw new Error(response.data.error_description || 'Token exchange failed')
    }

    return {
      accessToken: response.data.access_token,
      scope: response.data.scope?.split(' ') ?? GITHUB_OAUTH_SCOPES.split(' '),
      tokenType: response.data.token_type,
    }
  } catch (error) {
    logError(error as Error, 'GitHub OAuth token exchange failed')
    return null
  }
}

/**
 * Verify that the user is a member of the Anthropic GitHub organization
 */
export async function verifyGitHubOrgMembership(
  accessToken: string,
): Promise<boolean> {
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE_URL}/orgs/${INTERNAL_ORG}/memberships`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      },
    )

    if (response.status === 200 && response.data.state === 'active') {
      return true
    }

    logForDebugging('GitHub org membership check', {
      status: response.status,
      state: response.data?.state,
    })

    return false
  } catch (error) {
    logError(error as Error, 'GitHub org membership verification failed')
    return false
  }
}

/**
 * Get user info from GitHub API
 */
export async function getGitHubUserInfo(accessToken: string): Promise<{
  login: string
  name: string
  email: string
  avatarUrl: string
} | null> {
  try {
    const response = await axios.get(`${GITHUB_API_BASE_URL}/user`, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    })

    return {
      login: response.data.login,
      name: response.data.name ?? response.data.login,
      email: response.data.email ?? response.data.email,
      avatarUrl: response.data.avatar_url,
    }
  } catch (error) {
    logError(error as Error, 'Failed to fetch GitHub user info')
    return null
  }
}

/**
 * Verify GitHub OAuth token and exchange for internal CLAUDE_CODE_OAUTH_TOKEN
 * This function handles the full GitHub OAuth flow and returns an OAuth token
 * that can be used like any other Claude Code OAuth token
 */
export async function githubOAuthFlow(
  authorizationCode: string,
  codeVerifier: string,
): Promise<{
  accessToken: string
  user: {
    login: string
    name: string
    email: string
    avatarUrl: string
  }
  subscriptionType: 'internal'
} | null> {
  // Exchange code for GitHub token
  const tokenResponse = await exchangeGitHubCodeForToken(
    authorizationCode,
    codeVerifier,
  )

  if (!tokenResponse) {
    return null
  }

  // Verify organization membership
  const isOrgMember = await verifyGitHubOrgMembership(tokenResponse.accessToken)

  if (!isOrgMember) {
    throw new Error(
      'You must be a member of the Anthropic GitHub organization to use this login method.',
    )
  }

  // Get user info
  const userInfo = await getGitHubUserInfo(tokenResponse.accessToken)

  if (!userInfo) {
    throw new Error('Failed to retrieve GitHub user information')
  }

  // Exchange GitHub token for internal Anthropic OAuth token
  const anthropicTokenResponse = await axios.post(
    `${getOauthConfig().BASE_API_URL}/api/oauth/github/exchange`,
    {
      github_access_token: tokenResponse.accessToken,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  )

  if (anthropicTokenResponse.status !== 200) {
    throw new Error(
      `Failed to exchange GitHub token: ${anthropicTokenResponse.statusText}`,
    )
  }

  return {
    accessToken: anthropicTokenResponse.data.access_token,
    user: userInfo,
    subscriptionType: 'internal',
  }
}

/**
 * Exchange GitHub OAuth code and get Anthropic internal token
 * Public API for GitHub OAuth flow initiation
 */
export async function githubOAuthExchangeCode(
  authorizationCode: string,
  codeVerifier: string,
): Promise<{
  accessToken: string
  user: {
    login: string
    name: string
    email: string
    avatarUrl: string
  } | null
  subscriptionType: 'internal'
} | null> {
  return githubOAuthFlow(authorizationCode, codeVerifier)
}
