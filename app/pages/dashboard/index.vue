<script setup lang="ts">
interface Website {
  name: string
  websiteUrl: string
}

const { user, clear } = useUserSession()

definePageMeta({
  middleware: 'auth',
})

async function logout() {
  await clear()
  navigateTo('/login')
}

const isAdmin = computed(() => user.value?.isAdmin === true)

// Fetch websites for all users
const { data: websites } = await useFetch<Website[]>('/api/websites')

// Fetch clients for admins only
const { data: clients } = await useFetch('/api/clients', {
  immediate: isAdmin.value,
})

const clientCount = computed(() => clients.value?.length || 0)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="flex items-center gap-2">
              <UIcon name="i-heroicons-shield-check" class="size-7 text-primary" />
              <span class="font-bold text-gray-900 dark:text-white hidden sm:block">Nuxt Studio SSO</span>
            </NuxtLink>
            <UBadge color="primary" variant="subtle" size="sm">
              Dashboard
            </UBadge>
          </div>

          <div class="flex items-center gap-3">
            <UDropdownMenu
              :items="[[
                { label: 'Sign out', icon: 'i-heroicons-arrow-right-on-rectangle', onSelect: logout }
              ]]"
            >
              <UButton color="neutral" variant="ghost" class="gap-2">
                <UAvatar :src="user?.avatar" :alt="user?.name" size="xs" />
                <span class="hidden sm:block">{{ user?.name }}</span>
                <UIcon name="i-heroicons-chevron-down" class="size-4" />
              </UButton>
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome section -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {{ user?.name?.split(' ')[0] }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          <template v-if="isAdmin">
            Manage your OAuth clients and monitor authentication activity.
          </template>
          <template v-else>
            View websites where you can sign in with your account.
          </template>
        </p>
      </div>

      <!-- Admin Stats -->
      <div v-if="isAdmin" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-primary/10 rounded-xl">
              <UIcon name="i-heroicons-key" class="size-6 text-primary" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ clientCount }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">OAuth Clients</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-500/10 rounded-xl">
              <UIcon name="i-heroicons-check-circle" class="size-6 text-green-500" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Server Status</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-500/10 rounded-xl">
              <UIcon name="i-heroicons-globe-alt" class="size-6 text-blue-500" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">OIDC</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Protocol</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Connected Websites for non-admins -->
      <div v-if="!isAdmin && websites?.length" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connected Websites
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          You can use your account to log in to these websites:
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            v-for="website in websites"
            :key="website.websiteUrl"
            :href="website.websiteUrl"
            target="_blank"
            class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary hover:shadow-md transition-all"
          >
            <div class="p-2 bg-primary/10 rounded-lg shrink-0">
              <UIcon name="i-heroicons-globe-alt" class="size-5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900 dark:text-white truncate">{{ website.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ website.websiteUrl }}</p>
            </div>
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4 text-gray-400 shrink-0" />
          </a>
        </div>
      </div>

      <!-- No websites message for non-admins -->
      <UAlert
        v-if="!isAdmin && !websites?.length"
        class="mb-8"
        color="info"
        icon="i-heroicons-information-circle"
        title="No Connected Websites"
        description="There are no websites configured yet. Contact an administrator to set up OAuth clients."
      />

      <!-- Quick actions -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- OAuth Clients - Admin only -->
        <UCard v-if="isAdmin">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <UIcon name="i-heroicons-key" class="size-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">OAuth Clients</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Manage registered applications</p>
                </div>
              </div>
            </div>
          </template>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Register and manage OAuth client applications for your Nuxt Studio sites. Each client gets unique credentials for secure authentication.
          </p>
          <UButton to="/dashboard/clients" trailing-icon="i-heroicons-arrow-right">
            Manage Clients
          </UButton>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-gray-500/10 rounded-lg">
                  <UIcon name="i-heroicons-user-circle" class="size-5 text-gray-500" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Your Account</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Profile information</p>
                </div>
              </div>
            </div>
          </template>
          <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <UAvatar :src="user?.avatar" :alt="user?.name" size="lg" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white truncate">{{ user?.name }}</p>
                <UBadge v-if="isAdmin" color="primary" variant="subtle" size="xs">Admin</UBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 font-mono truncate mt-1">{{ user?.id }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick links - Admin only -->
      <div v-if="isAdmin" class="mt-8 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Links</h3>
        <div class="flex flex-wrap gap-2">
          <UButton to="/.well-known/openid-configuration" external variant="soft" color="neutral" size="sm">
            <template #leading>
              <UIcon name="i-heroicons-document-text" />
            </template>
            OpenID Configuration
          </UButton>
          <UButton to="/.well-known/jwks.json" variant="soft" external color="neutral" size="sm">
            <template #leading>
              <UIcon name="i-heroicons-key" />
            </template>
            JWKS
          </UButton>
          <UButton to="https://github.com/nuxt-content/nuxt-studio-sso" target="_blank" variant="soft" color="neutral" size="sm">
            <template #leading>
              <UIcon name="i-simple-icons-github" />
            </template>
            Documentation
          </UButton>
        </div>
      </div>
    </main>
  </div>
</template>
