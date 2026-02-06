<script setup lang="ts">
const { user, session } = useUserSession()
const pending = ref(false)

const oauthRequest = computed(() => session.value?.oauthRequest)

useSeoMeta({
  title: 'Authorize - Nuxt Studio SSO',
  description: 'Authorize an application to access your account.'
})

definePageMeta({
  middleware: 'auth'
})

async function handleAuthorize(approved: boolean) {
  pending.value = true

  try {
    const response = await $fetch<{ redirectUrl: string }>('/oauth/authorize', {
      method: 'POST',
      body: { approved }
    })

    // Navigate to the redirect URL (back to the client application)
    if (response.redirectUrl) {
      window.location.href = response.redirectUrl
    }
  } catch (error) {
    console.error('Authorization error:', error)
    pending.value = false
  }
}

// Redirect if no OAuth request
if (!oauthRequest.value) {
  navigateTo('/dashboard')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-6">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <UIcon name="i-heroicons-shield-check" class="size-10 text-primary" />
        </NuxtLink>
      </div>

      <UCard v-if="oauthRequest" class="shadow-xl">
        <div class="space-y-6">
          <!-- App requesting access -->
          <div class="text-center">
            <div class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-globe-alt" class="size-8 text-neutral-500" />
            </div>
            <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
              {{ oauthRequest.clientName || 'An application' }}
            </h1>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              wants to access your account
            </p>
          </div>

          <!-- User card -->
          <div class="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <UUser
              :name="user?.name"
              :description="user?.email"
              :avatar="{ src: user?.avatar ?? undefined, alt: user?.name }"
              size="lg"
              class="flex-1 min-w-0"
            />
            <UIcon name="i-heroicons-check-badge" class="size-6 text-green-500 shrink-0" />
          </div>

          <!-- Permissions -->
          <div class="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              This will allow the application to:
            </p>
            <ul class="space-y-2">
              <UPageFeature icon="i-heroicons-finger-print" description="Verify your identity" />
              <UPageFeature icon="i-heroicons-user" description="Access your profile information" />
              <UPageFeature icon="i-heroicons-envelope" description="Access your email address" />
              <UPageFeature icon="i-simple-icons-github" description="Use your GitHub account to push commits" :ui="{ leadingIcon: 'text-neutral' }" />
            </ul>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <UButton
              block
              color="neutral"
              variant="outline"
              size="lg"
              :disabled="pending"
              @click="handleAuthorize(false)"
            >
              Deny
            </UButton>
            <UButton
              block
              size="lg"
              :loading="pending"
              @click="handleAuthorize(true)"
            >
              Authorize
            </UButton>
          </div>
        </div>

        <template #footer>
          <p class="text-xs text-center text-neutral-500 dark:text-neutral-400">
            Make sure you trust this application before authorizing access.
          </p>
        </template>
      </UCard>

      <!-- No request state -->
      <UCard v-else class="shadow-xl">
        <div class="text-center py-4">
          <div class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-question-mark-circle" class="size-8 text-neutral-400" />
          </div>
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            No Authorization Request
          </h2>
          <p class="text-neutral-500 dark:text-neutral-400 mb-6">
            There's no pending authorization request.
          </p>
          <UButton to="/dashboard">
            Go to Dashboard
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
