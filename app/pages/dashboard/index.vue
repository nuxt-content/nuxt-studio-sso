<script setup lang="ts">
interface Website {
  name: string
  websiteUrl: string
}

const { user } = useUserSession()

useSeoMeta({
  title: 'Dashboard - Nuxt Studio SSO',
  description: 'Manage your OAuth clients and view connected websites.'
})

definePageMeta({
  middleware: 'auth'
})

const isAdmin = computed(() => user.value?.isAdmin === true)

// Fetch websites for all users
const { data: websites } = await useFetch<Website[]>('/api/websites')

// Fetch clients for admins only
const { data: clients } = await useFetch('/api/clients', {
  immediate: isAdmin.value
})

const clientCount = computed(() => clients.value?.length || 0)
</script>

<template>
  <div class="py-8">
    <!-- Welcome section -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
        Welcome back, {{ user?.name?.split(' ')[0] }}
      </h1>
      <p class="text-muted mt-1">
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
            <p class="text-2xl font-bold text-neutral-900 dark:text-white">
              {{ clientCount }}
            </p>
            <p class="text-sm text-muted">
              OAuth Clients
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-500/10 rounded-xl">
            <UIcon name="i-heroicons-check-circle" class="size-6 text-green-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-neutral-900 dark:text-white">
              Active
            </p>
            <p class="text-sm text-muted">
              Server Status
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-500/10 rounded-xl">
            <UIcon name="i-heroicons-globe-alt" class="size-6 text-blue-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-neutral-900 dark:text-white">
              OIDC
            </p>
            <p class="text-sm text-muted">
              Protocol
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Connected Websites for non-admins -->
    <div v-if="!isAdmin && websites?.length" class="mb-8">
      <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Connected Websites
      </h2>
      <p class="text-muted mb-4">
        You can use your account to log in to these websites:
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          v-for="website in websites"
          :key="website.websiteUrl"
          :href="website.websiteUrl"
          target="_blank"
          class="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary hover:shadow-md transition-all"
        >
          <div class="p-2 bg-primary/10 rounded-lg shrink-0">
            <UIcon name="i-heroicons-globe-alt" class="size-5 text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-neutral-900 dark:text-white truncate">{{ website.name }}</p>
            <p class="text-sm text-muted truncate">{{ website.websiteUrl }}</p>
          </div>
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-4 text-neutral-400 shrink-0" />
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
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary/10 rounded-lg">
              <UIcon name="i-heroicons-key" class="size-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white">
                OAuth Clients
              </h3>
              <p class="text-sm text-muted">
                Manage registered applications
              </p>
            </div>
          </div>
        </template>
        <p class="text-muted mb-4">
          Register and manage OAuth client applications for your Nuxt Studio sites. Each client gets unique credentials for secure authentication.
        </p>
        <UButton to="/dashboard/clients" trailing-icon="i-heroicons-arrow-right">
          Manage Clients
        </UButton>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-neutral-500/10 rounded-lg">
              <UIcon name="i-heroicons-user-circle" class="size-5 text-neutral-500" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white">
                Your Account
              </h3>
              <p class="text-sm text-muted">
                Profile information
              </p>
            </div>
          </div>
        </template>
        <div class="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <UUser
            :name="user?.name"
            :description="user?.email"
            :avatar="{ src: user?.avatar ?? undefined, alt: user?.name }"
            size="lg"
          />
          <UBadge
            v-if="isAdmin"
            color="primary"
            variant="subtle"
            size="xs"
          >
            Admin
          </UBadge>
        </div>
      </UCard>
    </div>

    <!-- Quick links - Admin only -->
    <div v-if="isAdmin" class="mt-8 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <h3 class="text-sm font-medium text-muted mb-3">
        Quick Links
      </h3>
      <div class="flex flex-wrap gap-2">
        <UButton
          to="/.well-known/openid-configuration"
          external
          variant="soft"
          color="neutral"
          size="sm"
          leading-icon="i-heroicons-document-text"
        >
          OpenID Configuration
        </UButton>
        <UButton
          to="/.well-known/jwks.json"
          variant="soft"
          external
          color="neutral"
          size="sm"
          leading-icon="i-heroicons-key"
        >
          JWKS
        </UButton>
        <UButton
          to="https://github.com/nuxt-content/nuxt-studio-sso"
          target="_blank"
          variant="soft"
          color="neutral"
          size="sm"
          leading-icon="i-simple-icons-github"
        >
          Documentation
        </UButton>
      </div>
    </div>
  </div>
</template>
