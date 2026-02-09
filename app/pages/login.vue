<script setup lang="ts">
const route = useRoute()
const error = computed(() => route.query.error as string | undefined)

useSeoMeta({
  title: 'Sign In - Nuxt Studio SSO',
  description: 'Sign in to access all your connected Nuxt Studio sites with a single account.'
})
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2 mb-6">
          <UIcon name="i-heroicons-shield-check" class="size-10 text-primary" />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          Sign in to Nuxt Studio
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          Access all your connected websites with a single account
        </p>
      </div>

      <UCard class="shadow-xl" variant="subtle">
        <UAlert
          v-if="error"
          color="error"
          icon="i-heroicons-exclamation-triangle"
          title="Authentication Failed"
          description="GitHub authentication failed. Please try again."
          class="mb-6"
        />

        <UButton
          to="/auth/github"
          external
          block
          size="xl"
          color="neutral"
          variant="solid"
          class="justify-center"
        >
          <template #leading>
            <UIcon name="i-simple-icons-github" class="size-5" />
          </template>
          Continue with GitHub
        </UButton>
      </UCard>

      <p class="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-6">
        Powered by <NuxtLink
          to="https://github.com/nuxt-content/nuxt-studio-sso"
          class="underline underline-offset-2 hover:text-primary"
          external
          target="_blank"
        >Nuxt Studio SSO</NuxtLink>
      </p>
    </div>
  </div>
</template>
