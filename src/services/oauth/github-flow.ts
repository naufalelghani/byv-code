// GitHub OAuth flow for ConsoleOAuthFlow integration
// This module provides GitHub Organization login support for Internal team members
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js'
import { installOAuthTokens } from '../../cli/handlers/auth.js'
import { type OAuthStatus } from '../../components/ConsoleOAuthFlow.js'
import { buildGitHubAuthUrl, githubOAuthExchangeCode } from './github-client.js'
import { logError } from '../../utils/log.js'
import { logForDebugging } from '../../utils/debug.js'
import { openBrowser } from '../../utils/browser.js'
import crypto from 'crypto'

// PKCE utilities for GitHub OAuth flow
function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32))
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64url')
}

function generateState(): string {
  return base64URLEncode(crypto.randomBytes(16))
}

/**
 * Start the GitHub OAuth flow for internal team members.
 * This function handles:
 * 1. Building the GitHub auth URL with PKCE
 * 2. Opening the browser for authentication
 * 3. Handling the callback (manual code entry)
 * 4. Exchanging the GitHub token for an internal Anthropic OAuth token
 * 5. Installing the tokens
 *
 * @param onStatusUpdate Callback to update OAuthStatus during the flow
 * @param onDone Callback when login completes successfully
 * @param state The state parameter for OAuth flow (used for CSRF protection)
 */
export async function startGitHubOAuthFlow(
  onStatusUpdate: (status: OAuthStatus) => void,
  onDone: () => void,
  state: string,
  codeVerifier: string,
): Promise<void> {
  try {
    logEvent('tengu_oauth_github_flow_start', {})

    const authUrl = buildGitHubAuthUrl(codeVerifier, state)

    // Auto-open browser for GitHub OAuth flow (same behavior as Claude.ai login)
    try {
      await openBrowser(authUrl)
    } catch (e) {
      logForDebugging('GitHub OAuth: Failed to open browser automatically', {
        error: (e as Error)?.message ?? 'unknown',
      })
    }

    onStatusUpdate({
      state: 'waiting_for_login',
      url: authUrl,
    })

    // The code exchange happens in ConsoleOAuthFlow via handleManualAuthCodeInput
    // This is handled by the callback function
  } catch (error) {
    logError(error as Error, 'GitHub OAuth flow failed')
    logEvent('tengu_oauth_github_error', {
      error: (error as Error).message as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    })
    onStatusUpdate({
      state: 'error',
      message: (error as Error).message,
      toRetry: { state: 'idle' }
    })
  }
}

/**
 * Handle manual GitHub OAuth code submission
 * This is called when the user pastes their GitHub OAuth code
 */
export async function handleGitHubManualCode(
  authorizationCode: string,
  state: string,
  codeVerifier: string,
  onStatusUpdate: (status: OAuthStatus) => void,
  onLoginSuccess: () => void,
): Promise<void> {
  try {
    logEvent('tengu_oauth_github_manual_entry', {})

    // Exchange GitHub code for Anthropic OAuth token
    onStatusUpdate({ state: 'creating_api_key' })

    const result = await githubOAuthExchangeCode(authorizationCode, codeVerifier)

    if (!result) {
      throw new Error('Failed to exchange GitHub code for Anthropic token')
    }

    // Install the OAuth tokens
    await installOAuthTokens({
      accessToken: result.accessToken,
      refreshToken: '', // GitHub OAuth doesn't provide refresh token for internal flows
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      scopes: ['user:inference', 'user:profile', 'user:sessions:claude_code', 'user:mcp_servers', 'user:file_upload'],
      subscriptionType: 'internal',
      rateLimitTier: null, // Internal users have unlimited access
      profile: undefined,
      tokenAccount: result.user ? {
        uuid: '',
        emailAddress: result.user.email,
        organizationUuid: '',
      } : undefined,
    })

    logEvent('tengu_oauth_github_success', {
      loginMethod: 'github'
    })

    onStatusUpdate({
      state: 'success',
      token: result.accessToken
    })

    onLoginSuccess()
  } catch (error) {
    logError(error as Error)
    logEvent('tengu_oauth_github_token_exchange_error', {
      error: (error as Error).message as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    })
    onStatusUpdate({
      state: 'error',
      message: (error as Error).message,
      toRetry: { state: 'idle' }
    })
  }
}

// Re-export OAuthStatus for type compatibility
export type { OAuthStatus }
