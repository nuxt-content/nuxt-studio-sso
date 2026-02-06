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
  title: 'Edit Client - Nuxt Studio SSO',
  description: 'Edit OAuth client settings.'
})

definePageMeta({
  middleware: 'auth'
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
  isActive: true
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
      isActive: value.isActive
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
        isActive: editForm.value.isActive
      }
    })

    await refresh()
  } catch (error) {
    console.error('Failed to save client:', error)
  } finally {
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
      method: 'POST'
    })
    newSecret.value = result.secret
    showSecretModal.value = true
  } catch (error) {
    console.error('Failed to regenerate secret:', error)
  } finally {
    regenerating.value = false
  }
}

function closeSecretModal() {
  showSecretModal.value = false
  newSecret.value = null
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

async function deleteClient() {
  if (!confirm('Are you sure you want to delete this client?')) {
    return
  }
  await $fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
  navigateTo('/dashboard/clients')
}
</script>

<template>
  <div class="py-8">
    <!-- Page header -->
    <div class="flex items-center gap-4 mb-8">
      <UButton
        to="/dashboard/clients"
        color="neutral"
        variant="ghost"
        icon="i-heroicons-arrow-left"
      />
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
        Edit Client
      </h1>
    </div>

    <div v-if="!client" class="text-center py-12">
      <UEmpty
        icon="i-heroicons-exclamation-triangle"
        title="Client not found"
        :actions="[{ label: 'Back to Clients', to: '/dashboard/clients' }]"
      />
    </div>

    <div v-else class="max-w-3xl space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Client Details
          </h2>
        </template>

        <form class="space-y-4" @submit.prevent="saveClient">
          <UFormField label="Client ID">
            <div class="flex gap-2">
              <UInput :model-value="client.id" readonly class="font-mono flex-1" />
              <UButton
                icon="i-heroicons-clipboard-document"
                color="neutral"
                variant="outline"
                @click="copyToClipboard(client.id)"
              />
            </div>
          </UFormField>

          <UFormField label="Client Name" required>
            <UInput v-model="editForm.name" class="w-full" />
          </UFormField>

          <UFormField label="Website URL" description="The callback path will be added automatically." required>
            <UInput v-model="editForm.websiteUrl" class="w-full" />
          </UFormField>

          <UFormField label="Preview URL Pattern" description="Use * as wildcard for preview deployments." hint="Optional">
            <UInput
              v-model="editForm.previewUrlPattern"
              placeholder="https://*.vercel.app"
              class="w-full"
            />
          </UFormField>

          <UFormField v-if="client" label="Callback URL" help="This is automatically generated from the website URL.">
            <UInput
              :model-value="client.callbackUrl"
              readonly
              disabled
              class="font-mono w-full"
            />
          </UFormField>

          <UFormField label="Status">
            <USwitch v-model="editForm.isActive">
              {{ editForm.isActive ? 'Active' : 'Inactive' }}
            </USwitch>
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
          <h2 class="font-semibold">
            Client Secret
          </h2>
        </template>

        <p class="text-sm text-muted mb-4">
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

        <p class="text-sm text-muted mb-4">
          Deleting this client will revoke all tokens and break any sites using it.
        </p>

        <UButton
          color="error"
          variant="outline"
          @click="deleteClient"
        >
          Delete Client
        </UButton>
      </UCard>
    </div>

    <UModal v-model:open="showSecretModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-lg font-semibold">
                New Client Secret
              </h2>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="closeSecretModal"
              />
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              color="warning"
              title="Save your client secret"
              description="This secret will only be shown once. Make sure to copy it now."
            />
            <UFormField label="STUDIO_SSO_CLIENT_SECRET">
              <div class="flex gap-2">
                <UInput :model-value="newSecret" readonly class="font-mono flex-1" />
                <UButton
                  icon="i-heroicons-clipboard-document"
                  @click="copyToClipboard(newSecret!)"
                />
              </div>
            </UFormField>
            <UButton block @click="closeSecretModal">
              Done
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
