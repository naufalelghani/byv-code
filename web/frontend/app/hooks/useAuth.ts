import { useEffect, useState } from 'react'

type AuthStatus = {
  authenticated: boolean
  authSource: string | null
  subscriptionType: string | null
  provider: string
  isInternal: boolean
  inScope: boolean
}

export function useAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authData, setAuthData] = useState<AuthStatus | null>(null)

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data: AuthStatus) => {
        setAuthData(data)
        setAuthenticated(data.authenticated && data.inScope)
        if (!data.authenticated) {
          setAuthError('No API token found. Please configure your Claude Code authentication.')
        } else if (!data.inScope) {
          setAuthError('Your subscription type (1P/firstParty) is not in scope for the web version. Web version supports internal subscribers and 3P providers only.')
        }
      })
      .catch((e) => {
        setAuthError(e.message)
      })
      .finally(() => setLoading(false))
  }, [])

  return { authenticated, loading, authError, authData }
}
