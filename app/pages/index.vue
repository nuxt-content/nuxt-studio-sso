<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const { loggedIn } = useUserSession()

useSeoMeta({
  title: 'Nuxt Studio SSO',
  description: 'A centralized OAuth server that enables seamless single sign-on across all your Nuxt Studio-powered websites.'
})

const heroLinks = computed<ButtonProps[]>(() => {
  if (loggedIn.value) {
    return [{
      label: 'Go to Dashboard',
      to: '/dashboard',
      trailingIcon: 'i-heroicons-arrow-right',
      size: 'xl' as const
    }]
  }
  return [{
    label: 'Get Started',
    to: '/login',
    trailingIcon: 'i-heroicons-arrow-right',
    size: 'xl' as const
  }, {
    label: 'View on GitHub',
    to: 'https://github.com/nuxt-content/nuxt-studio-sso',
    target: '_blank',
    leadingIcon: 'i-simple-icons-github',
    variant: 'outline' as const,
    color: 'neutral' as const,
    size: 'xl' as const
  }]
})
</script>

<template>
  <UPageHero
    headline="OAuth 2.0 + OpenID Connect"
    :links="heroLinks"
  >
    <template #title>
      Single Sign-On for <span class="text-primary">Nuxt Studio</span>
    </template>
    <template #description>
      A centralized OAuth server that enables seamless authentication across all your Nuxt Studio-powered websites. Log in once, access everywhere.
    </template>
  </UPageHero>

  <!-- Features -->
  <UPageGrid>
    <div class="text-center p-6">
      <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-globe-alt" class="size-6 text-primary" />
      </div>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        Single Sign-On
      </h3>
      <p class="text-neutral-600 dark:text-neutral-400">
        Log in once to access all your connected Nuxt Studio sites without re-authenticating.
      </p>
    </div>

    <div class="text-center p-6">
      <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-shield-check" class="size-6 text-primary" />
      </div>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        Secure by Design
      </h3>
      <p class="text-neutral-600 dark:text-neutral-400">
        Industry-standard OAuth 2.0 with PKCE support and RS256 JWT tokens for maximum security.
      </p>
    </div>

    <div class="text-center p-6">
      <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-server-stack" class="size-6 text-primary" />
      </div>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        Deploy Anywhere
      </h3>
      <p class="text-neutral-600 dark:text-neutral-400">
        Deploy to any platform supported by Nuxt, from Vercel to your own VPS server.
      </p>
    </div>
  </UPageGrid>
</template>
