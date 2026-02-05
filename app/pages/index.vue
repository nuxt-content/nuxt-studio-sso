<script setup lang="ts">
const { loggedIn } = useUserSession()

definePageMeta({
  layout: false,
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
    <div class="container mx-auto px-4">
      <!-- Header -->
      <header class="py-6 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-shield-check" class="size-8 text-primary" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">Nuxt Studio SSO</span>
        </div>
        <UButton v-if="loggedIn" to="/dashboard" variant="solid">
          Dashboard
        </UButton>
        <UButton v-else to="/login" variant="ghost">
          Sign In
        </UButton>
      </header>

      <!-- Hero -->
      <main class="py-24 md:py-32">
        <div class="max-w-3xl mx-auto text-center">
          <UBadge color="primary" variant="subtle" class="mb-4">
            OAuth 2.0 + OpenID Connect
          </UBadge>

          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Single Sign-On for
            <span class="text-primary">Nuxt Studio</span>
          </h1>

          <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            A centralized OAuth server that enables seamless authentication across all your Nuxt Studio-powered websites. Log in once, access everywhere.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton v-if="loggedIn" to="/dashboard" size="xl">
              Go to Dashboard
              <template #trailing>
                <UIcon name="i-heroicons-arrow-right" />
              </template>
            </UButton>
            <UButton v-else to="/login" size="xl">
              Get Started
              <template #trailing>
                <UIcon name="i-heroicons-arrow-right" />
              </template>
            </UButton>
            <UButton
              to="https://github.com/nuxt-content/nuxt-studio-sso"
              target="_blank"
              variant="outline"
              color="neutral"
              size="xl"
            >
              <template #leading>
                <UIcon name="i-simple-icons-github" />
              </template>
              View on GitHub
            </UButton>
          </div>
        </div>

        <!-- Features -->
        <div class="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div class="text-center p-6">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-globe-alt" class="size-6 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Single Sign-On
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Log in once to access all your connected Nuxt Studio sites without re-authenticating.
            </p>
          </div>

          <div class="text-center p-6">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-shield-check" class="size-6 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Secure by Design
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Industry-standard OAuth 2.0 with PKCE support and RS256 JWT tokens for maximum security.
            </p>
          </div>

          <div class="text-center p-6">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-server-stack" class="size-6 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Deploy Anywhere
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Deploy to any platform suppported by Nuxt, from Vercel to your own VPS server.
            </p>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-8 border-t border-gray-200 dark:border-gray-800">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Nuxt, NuxtHub, and Nuxt UI</p>
          <div class="flex items-center gap-6">
            <a href="/.well-known/openid-configuration" class="hover:text-primary">
              OpenID Configuration
            </a>
            <a href="/.well-known/jwks.json" class="hover:text-primary">
              JWKS
            </a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
