// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@nuxt/ui',
  ],

  css: ['~/assets/css/main.css'],

  hub: {
    db: 'sqlite',
  },

  runtimeConfig: {
    // JWT keys for RS256
    jwtPrivateKey: '',
    jwtPublicKey: '',
    // GitHub OAuth (for login to auth server)
    oauth: {
      github: {
        clientId: '',
        clientSecret: '',
      },
    },
  },

  future: {
    compatibilityVersion: 4,
  },
})
