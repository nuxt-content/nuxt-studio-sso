declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    avatar?: string | null
  }

  interface UserSession {
    oauthRequest?: {
      clientId: string
      redirectUri: string
      scope: string
      state?: string
      codeChallenge?: string
      codeChallengeMethod?: string
      clientName?: string
    }
  }
}

export {}
