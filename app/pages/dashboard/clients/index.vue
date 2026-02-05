<script setup lang="ts">
interface OAuthClient {
  id: string
  name: string
  websiteUrl: string
  previewUrlPattern: string | null
  callbackUrl: string
  isActive: boolean
  createdAt: string
}

definePageMeta({
  middleware: 'auth',
})

const { user, clear } = useUserSession()

// Redirect non-admins to dashboard
if (!user.value?.isAdmin) {
  await navigateTo('/dashboard')
}

const { data: clients, refresh } = await useFetch<OAuthClient[]>('/api/clients')

const showCreateModal = ref(false)
const newClient = ref({
  name: '',
  websiteUrl: '',
  previewUrlPattern: '',
})
const createdSecret = ref<string | null>(null)
const createdClientId = ref<string | null>(null)
const creating = ref(false)
const copied = ref(false)

async function logout() {
  await clear()
  navigateTo('/login')
}

async function createClient() {
  creating.value = true
  try {
    const result = await $fetch<OAuthClient & { secret: string }>('/api/clients', {
      method: 'POST',
      body: {
        name: newClient.value.name,
        websiteUrl: newClient.value.websiteUrl,
        previewUrlPattern: newClient.value.previewUrlPattern || undefined,
      },
    })

    createdSecret.value = result.secret
    createdClientId.value = result.id
    await refresh()

    newClient.value = {
      name: '',
      websiteUrl: '',
      previewUrlPattern: '',
    }
  }
  catch (error) {
    console.error('Failed to create client:', error)
  }
  finally {
    creating.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  createdSecret.value = null
  createdClientId.value = null
  copied.value = false
}

async function copySecret() {
  if (createdSecret.value) {
    await navigator.clipboard.writeText(createdSecret.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

async function deleteClient(id: string) {
  if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
    return
  }

  try {
    await $fetch(`/api/clients/${id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (error) {
    console.error('Failed to delete client:', error)
  }
}
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
            <UIcon name="i-heroicons-chevron-right" class="size-4 text-gray-400" />
            <span class="text-gray-600 dark:text-gray-400">Clients</span>
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
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div class="flex items-center gap-4">
          <UButton to="/dashboard" color="neutral" variant="ghost" icon="i-heroicons-arrow-left" size="sm" />
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              OAuth Clients
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your registered OAuth client applications
            </p>
          </div>
        </div>
        <UButton icon="i-heroicons-plus" @click="showCreateModal = true">
          New Client
        </UButton>
      </div>

      <!-- Empty state -->
      <div v-if="clients?.length === 0" class="text-center py-16">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-key" class="size-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No clients yet
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Create your first OAuth client to enable authentication for your Nuxt Studio sites.
        </p>
        <UButton @click="showCreateModal = true">
          <template #leading>
            <UIcon name="i-heroicons-plus" />
          </template>
          Create Your First Client
        </UButton>
      </div>

      <!-- Client list -->
      <div v-else class="grid gap-4">
        <UCard v-for="client in clients" :key="client.id" class="hover:shadow-md transition-shadow">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-primary/10 rounded-lg shrink-0">
                  <UIcon name="i-heroicons-key" class="size-5 text-primary" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                      {{ client.name }}
                    </h3>
                    <UBadge v-if="client.isActive" color="success" variant="subtle" size="xs">
                      Active
                    </UBadge>
                    <UBadge v-else color="error" variant="subtle" size="xs">
                      Inactive
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {{ client.id }}
                  </p>
                </div>
              </div>

              <div class="ml-11 space-y-1">
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ client.websiteUrl }}
                </p>
                <p v-if="client.previewUrlPattern" class="text-xs text-gray-400 dark:text-gray-500 truncate">
                  Preview: {{ client.previewUrlPattern }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 ml-11 lg:ml-0">
              <UButton
                :to="`/dashboard/clients/${client.id}`"
                color="neutral"
                variant="soft"
                size="sm"
              >
                <template #leading>
                  <UIcon name="i-heroicons-pencil" />
                </template>
                Edit
              </UButton>
              <UButton
                color="error"
                variant="ghost"
                size="sm"
                icon="i-heroicons-trash"
                @click="deleteClient(client.id)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </main>

    <!-- Create Modal -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="p-2 inline-flex bg-primary/10 rounded-lg">
                  <UIcon name="i-heroicons-plus" class="size-5 text-primary" />
                </div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ createdSecret ? 'Client Created Successfully' : 'Create New Client' }}
                </h2>
              </div>
              <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="closeModal" />
            </div>
          </template>

          <!-- Success state -->
          <div v-if="createdSecret" class="space-y-4">
            <UAlert
              color="warning"
              icon="i-heroicons-exclamation-triangle"
              title="Save your client secret"
              description="This secret will only be shown once. Make sure to copy and store it securely."
            />

            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Client ID</label>
                <UInput :model-value="createdClientId" readonly class="font-mono" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Client Secret</label>
                <div class="flex gap-2">
                  <UInput :model-value="createdSecret" readonly class="font-mono flex-1" type="password" />
                  <UButton
                    :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
                    :color="copied ? 'success' : 'neutral'"
                    variant="soft"
                    @click="copySecret"
                  />
                </div>
              </div>
            </div>

            <UButton block @click="closeModal">
              Done
            </UButton>
          </div>

          <!-- Create form -->
          <form v-else class="space-y-4" @submit.prevent="createClient">
            <UFormField label="Client Name" required>
              <UInput v-model="newClient.name" placeholder="My Nuxt Studio Site" />
            </UFormField>

            <UFormField label="Website URL" hint="Main production URL (callback path added automatically)" required>
              <UInput
                v-model="newClient.websiteUrl"
                placeholder="https://docs.example.com"
                type="url"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Preview URL Pattern" hint="Optional. Use * as wildcard for preview deployments">
              <UInput
                v-model="newClient.previewUrlPattern"
                placeholder="https://my-docs-*.vercel.app"
                type="url"
                class="w-full"
              />
            </UFormField>

            <div class="flex gap-2 justify-end pt-2">
              <UButton color="neutral" variant="outline" @click="closeModal">
                Cancel
              </UButton>
              <UButton type="submit" :loading="creating">
                Create Client
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
