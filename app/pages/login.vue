<script setup lang="ts">
const route = useRoute()
const error = computed(() => route.query.error as string | undefined)

definePageMeta({
  layout: false,
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
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

      <UCard class="shadow-xl">
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
          variant="soft"
          class="justify-center"
        >
          <template #leading>
            <UIcon name="i-simple-icons-github" class="size-5" />
          </template>
          Continue with GitHub
        </UButton>

        <template #footer>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </template>
      </UCard>

      <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        <NuxtLink to="/" class="hover:text-primary">
          Back to home
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
