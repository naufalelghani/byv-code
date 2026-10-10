// OAuth type definitions
// This file defines the types used across the OAuth service for Claude Code authentication.

/**
 * Subscription type determined from the OAuth profile's organization_type field.
 * Maps organization types to subscription tiers that control feature access.
 */
export type SubscriptionType = 'max' | 'pro' | 'enterprise' | 'team' | 'internal'

/**
 * Rate limit tier for Claude API requests.
 * Controls usage limits based on subscription tier.
 */
export type RateLimitTier =
  | 'default_claude_max_5x'
  | 'default_claude_max_20x'
  | 'default_claude_team_5x'
  | 'default_claude_enterprise'
  | (string & {}) // Allow for additional tiers returned by the API

/**
 * Billing type for the subscription.
 * Indicates how the user is billed (subscription platform).
 */
export type BillingType =
  | 'stripe_subscription'
  | 'stripe_subscription_contracted'
  | 'apple_subscription'
  | 'google_play_subscription'
  | 'no_billing'
  | 'free'
  | (string & {})

/**
 * OAuth token exchange response from the token endpoint.
 * Returned when exchanging an authorization code or refresh token.
 */
export interface OAuthTokenExchangeResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type?: string
  account?: {
    uuid: string
    email_address: string
    email?: string
  }
  organization?: {
    uuid: string
  }
}

/**
 * Full OAuth profile response from the /api/oauth/profile endpoint.
 * Contains account, organization, and subscription information.
 */
export interface OAuthProfileResponse {
  account: {
    uuid: string
    email: string
    display_name?: string
    created_at?: string
  }
  organization: {
    uuid: string
    name?: string
    organization_type?: string
    rate_limit_tier?: RateLimitTier
    has_extra_usage_enabled?: boolean
    billing_type?: BillingType
    subscription_created_at?: string
    display_name?: string
  }
  plan?: {
    type?: string
    name?: string
  }
  roles?: {
    organization_role?: string
    workspace_role?: string
  }
}

/**
 * OAuth tokens stored in secure storage.
 * Contains the active session tokens and associated metadata.
 */
export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scopes: string[]
  subscriptionType: SubscriptionType | null
  rateLimitTier: RateLimitTier | null
  profile?: OAuthProfileResponse
  tokenAccount?: {
    uuid: string
    emailAddress: string
    organizationUuid: string
  }
}

/**
 * User roles response from the /api/oauth/roles endpoint.
 * Used to determine organizational and workspace-level permissions.
 */
export interface UserRolesResponse {
  organization_role: string
  workspace_role: string
  organization_name: string
}

/**
 * Account info stored in global config for billing and analytics purposes.
 */
export interface AccountInfo {
  accountUuid: string
  emailAddress: string
  organizationUuid: string
  displayName?: string
  hasExtraUsageEnabled?: boolean
  billingType?: BillingType
  accountCreatedAt?: string
  subscriptionCreatedAt?: string
}

/**
 * Login method to force during OAuth flow.
 */
export type LoginMethod = 'sso' | 'magic_link' | 'google' | 'github' | 'github_organization'
