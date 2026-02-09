<script setup lang="ts">
const { loggedIn } = useUserSession()

useSeoMeta({
  title: 'Nuxt Studio SSO',
  description: 'Sign in once to access all your connected Nuxt Studio websites.'
})
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <UIcon name="i-heroicons-shield-check" class="size-12 text-primary mb-6" />
      <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
        Nuxt Studio SSO
      </h1>
      <p class="text-neutral-600 dark:text-neutral-400 mt-3 text-lg">
        Sign in once, access all your connected websites.
      </p>

      <div class="mt-8 flex flex-col gap-3">
        <UButton
          v-if="loggedIn"
          to="/dashboard"
          block
          size="xl"
          class="justify-center"
          trailing-icon="i-heroicons-arrow-right"
        >
          Go to Dashboard
        </UButton>
        <template v-else>
          <UButton
            to="/login"
            block
            size="xl"
            class="justify-center"
            trailing-icon="i-heroicons-arrow-right"
          >
            Sign In
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>
