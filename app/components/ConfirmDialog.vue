<script lang="ts" setup>
interface ConfirmDialogProps {
  title?: string
  description?: string
  confirmLabel?: string
  confirmColor?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral'
  icon?: string
}

withDefaults(defineProps<ConfirmDialogProps>(), {
  title: 'Are you sure?',
  description: undefined,
  confirmLabel: 'Confirm',
  confirmColor: 'error',
  icon: 'i-lucide-alert-triangle'
})

const emits = defineEmits<{
  close: [value: boolean]
}>()
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :icon="icon"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        @click="emits('close', false)"
      />
      <UButton :label="confirmLabel" :color="confirmColor" @click="emits('close', true)" />
    </template>
  </UModal>
</template>
