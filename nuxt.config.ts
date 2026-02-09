// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@nuxt/ui',
    '@nuxt/eslint'
  ],
  ssr: false,
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // JWT keys for RS256
    jwtPrivateKey: '',
    jwtPublicKey: '',
    // GitHub OAuth (for login to auth server)
    oauth: {
      github: {
        clientId: '',
        clientSecret: ''
      }
    }
  },

  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2025-07-15',

  hub: {
    db: 'sqlite'
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
