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

// Redirect non-admins to dashboard
const { user } = useUserSession()
if (!user.value?.isAdmin) {
  await navigateTo('/dashboard')
}

const route = useRoute()
const clientId = route.params.id as string

const { data: client, refresh } = await useFetch<OAuthClient>(`/api/clients/${clientId}`)

const editForm = ref({
  name: '',
  websiteUrl: '',
  previewUrlPattern: '',
  isActive: true,
})

const saving = ref(false)
const showSecretModal = ref(false)
const newSecret = ref<string | null>(null)
const regenerating = ref(false)

// Initialize form when client loads
watch(client, (value) => {
  if (value) {
    editForm.value = {
      name: value.name,
      websiteUrl: value.websiteUrl,
      previewUrlPattern: value.previewUrlPattern || '',
      isActive: value.isActive,
    }
  }
}, { immediate: true })

async function saveClient() {
  saving.value = true
  try {
    await $fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      body: {
        name: editForm.value.name,
        websiteUrl: editForm.value.websiteUrl,
        previewUrlPattern: editForm.value.previewUrlPattern || null,
        isActive: editForm.value.isActive,
      },
    })

    await refresh()
  }
  catch (error) {
    console.error('Failed to save client:', error)
  }
  finally {
    saving.value = false
  }
}

async function regenerateSecret() {
  if (!confirm('Are you sure you want to regenerate the client secret? The old secret will no longer work.')) {
    return
  }

  regenerating.value = true
  try {
    const result = await $fetch<{ secret: string }>(`/api/clients/${clientId}/secret`, {
      method: 'POST',
    })
    newSecret.value = result.secret
    showSecretModal.value = true
  }
  catch (error) {
    console.error('Failed to regenerate secret:', error)
  }
  finally {
    regenerating.value = false
  }
}

function closeSecretModal() {
  showSecretModal.value = false
  newSecret.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center gap-4">
          <UButton to="/dashboard/clients" color="neutral" variant="ghost" icon="i-heroicons-arrow-left" />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Client
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="!client" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">
          Client not found
        </p>
        <UButton to="/dashboard/clients" class="mt-4">
          Back to Clients
        </UButton>
      </div>

      <div v-else class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="font-semibold">Client Details</h2>
          </template>

          <form class="space-y-4" @submit.prevent="saveClient">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Client ID</label>
              <div class="mt-1 flex gap-2">
                <UInput :model-value="client.id" readonly class="font-mono flex-1" />
                <UButton
                  icon="i-heroicons-clipboard-document"
                  color="neutral"
                  variant="outline"
                  @click="navigator.clipboard.writeText(client.id)"
                />
              </div>
            </div>

            <UFormField label="Client Name" required>
              <UInput v-model="editForm.name" />
            </UFormField>

            <UFormField label="Website URL" hint="Main production URL (callback path added automatically)" required>
              <UInput v-model="editForm.websiteUrl" />
            </UFormField>

            <UFormField label="Preview URL Pattern" hint="Optional. Use * as wildcard for preview deployments">
              <UInput
                v-model="editForm.previewUrlPattern"
                placeholder="https://*.vercel.app"
              />
            </UFormField>

            <div v-if="client" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Callback URL</p>
              <p class="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{{ client.callbackUrl }}</p>
            </div>

            <UFormField label="Status">
              <USwitch v-model="editForm.isActive" />
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {{ editForm.isActive ? 'Active' : 'Inactive' }}
              </span>
            </UFormField>

            <div class="flex justify-end">
              <UButton type="submit" :loading="saving">
                Save Changes
              </UButton>
            </div>
          </form>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">Client Secret</h2>
          </template>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The client secret is only shown when the client is created or regenerated.
            If you've lost the secret, you can regenerate it below.
          </p>

          <UButton
            color="warning"
            :loading="regenerating"
            @click="regenerateSecret"
          >
            Regenerate Secret
          </UButton>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-error-600 dark:text-error-400">
              Danger Zone
            </h2>
          </template>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Deleting this client will revoke all tokens and break any sites using it.
          </p>

          <UButton
            color="error"
            variant="outline"
            to="/dashboard/clients"
            @click.prevent="async () => {
              if (confirm('Are you sure you want to delete this client?')) {
                await $fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
                navigateTo('/dashboard/clients')
              }
            }"
          >
            Delete Client
          </UButton>
        </UCard>
      </div>
    </main>

    <UModal v-model:open="showSecretModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">
                New Client Secret
              </h2>
              <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="closeSecretModal" />
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              color="warning"
              title="Save your client secret"
              description="This secret will only be shown once. Make sure to copy it now."
            />
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Client Secret</label>
              <div class="mt-1 flex gap-2">
                <UInput :model-value="newSecret" readonly class="font-mono flex-1" />
                <UButton
                  icon="i-heroicons-clipboard-document"
                  @click="navigator.clipboard.writeText(newSecret!)"
                />
              </div>
            </div>
            <UButton block @click="closeSecretModal">
              Done
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
