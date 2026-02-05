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

useSeoMeta({
  title: 'OAuth Clients - Nuxt Studio SSO',
  description: 'Manage your registered OAuth client applications.'
})

definePageMeta({
  middleware: 'auth'
})

const { user } = useUserSession()

// Redirect non-admins to dashboard
if (!user.value?.isAdmin) {
  await navigateTo('/dashboard')
}

const { data: clients, refresh } = await useFetch<OAuthClient[]>('/api/clients')

const showCreateModal = ref(false)
const newClient = ref({
  name: '',
  websiteUrl: '',
  previewUrlPattern: ''
})
const createdSecret = ref<string | null>(null)
const createdClientId = ref<string | null>(null)
const creating = ref(false)
const copied = ref(false)

async function createClient() {
  creating.value = true
  try {
    const result = await $fetch<OAuthClient & { secret: string }>('/api/clients', {
      method: 'POST',
      body: {
        name: newClient.value.name,
        websiteUrl: newClient.value.websiteUrl,
        previewUrlPattern: newClient.value.previewUrlPattern || undefined
      }
    })

    createdSecret.value = result.secret
    createdClientId.value = result.id
    await refresh()

    newClient.value = {
      name: '',
      websiteUrl: '',
      previewUrlPattern: ''
    }
  } catch (error) {
    console.error('Failed to create client:', error)
  } finally {
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
  } catch (error) {
    console.error('Failed to delete client:', error)
  }
}
</script>

<template>
  <div class="py-8">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          OAuth Clients
        </h1>
        <p class="text-sm text-muted mt-1">
          Manage your registered OAuth client applications
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="showCreateModal = true">
        New Client
      </UButton>
    </div>

    <!-- Empty state -->
    <UEmpty
      v-if="clients?.length === 0"
      icon="i-heroicons-key"
      title="No clients yet"
      description="Create your first OAuth client to enable authentication for your Nuxt Studio sites."
      :actions="[{ label: 'Create Your First Client', icon: 'i-heroicons-plus', onClick: () => { showCreateModal = true } }]"
    />

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
                  <UBadge
                    v-if="client.isActive"
                    color="success"
                    variant="subtle"
                    size="xs"
                  >
                    Active
                  </UBadge>
                  <UBadge
                    v-else
                    color="error"
                    variant="subtle"
                    size="xs"
                  >
                    Inactive
                  </UBadge>
                </div>
                <p class="text-xs text-muted font-mono truncate">
                  {{ client.id }}
                </p>
              </div>
            </div>

            <div class="ml-11 space-y-1">
              <p class="text-xs text-muted truncate">
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
              leading-icon="i-heroicons-pencil"
            >
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
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="closeModal"
              />
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

            <UFormField label="STUDIO_SSO_CLIENT_ID">
              <UInput :model-value="createdClientId" readonly class="font-mono" />
            </UFormField>

            <UFormField label="STUDIO_SSO_CLIENT_SECRET">
              <div class="flex gap-2">
                <UInput
                  :model-value="createdSecret"
                  readonly
                  class="font-mono flex-1"
                  type="password"
                />
                <UButton
                  :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
                  :color="copied ? 'success' : 'neutral'"
                  variant="soft"
                  @click="copySecret"
                />
              </div>
            </UFormField>

            <UButton block @click="closeModal">
              Done
            </UButton>
          </div>

          <!-- Create form -->
          <form v-else class="space-y-4" @submit.prevent="createClient">
            <UFormField label="Client Name" required>
              <UInput v-model="newClient.name" placeholder="My Nuxt Studio Site" class="w-full" />
            </UFormField>

            <UFormField label="Website URL" description="The callback path will be added automatically." required>
              <UInput
                v-model="newClient.websiteUrl"
                placeholder="https://docs.example.com"
                type="url"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Preview URL Pattern" description="Use * as wildcard for preview deployments." hint="Optional">
              <UInput
                v-model="newClient.previewUrlPattern"
                placeholder="https://my-docs-*.vercel.app"
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
