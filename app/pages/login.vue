<script setup lang="ts">
const route = useRoute()
const error = computed(() => route.query.error as string | undefined)

useSeoMeta({
  title: 'Sign In - Nuxt Studio SSO',
  description: 'Sign in to manage your OAuth clients and access connected Nuxt Studio sites.'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2 mb-6">
          <UIcon name="i-heroicons-shield-check" class="size-10 text-primary" />
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Sign in to manage your OAuth clients
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

      <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        <NuxtLink to="/" class="hover:text-primary">
          Back to home
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
