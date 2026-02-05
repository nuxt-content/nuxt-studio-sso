<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { user, clear } = useUserSession()

const isAdmin = computed(() => user.value?.isAdmin === true)

async function logout() {
  await clear()
  navigateTo('/login')
}

const navItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [{
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard',
    active: route.path === '/dashboard'
  }]

  if (isAdmin.value) {
    items.push({
      label: 'Clients',
      icon: 'i-heroicons-key',
      to: '/dashboard/clients',
      active: route.path.startsWith('/dashboard/clients')
    })
  }

  return items
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />

    <UHeader title="Nuxt Studio SSO" to="/">
      <template #title>
        <UIcon name="i-heroicons-shield-check" class="size-7 text-primary" />
        <span class="font-bold">Nuxt Studio SSO</span>
      </template>

      <UNavigationMenu v-if="user" :items="navItems" />

      <template #right>
        <UColorModeButton />

        <UDropdownMenu
          v-if="user"
          :items="[[
            { label: 'Sign out', icon: 'i-heroicons-arrow-right-on-rectangle', onSelect: logout }
          ]]"
        >
          <UButton color="neutral" variant="ghost" class="gap-2">
            <UAvatar :src="user?.avatar ?? undefined" :alt="user?.name" size="2xs" />
            <span class="hidden sm:block text-sm">{{ user?.name }}</span>
            <UIcon name="i-heroicons-chevron-down" class="size-4" />
          </UButton>
        </UDropdownMenu>
        <UButton v-else to="/login">
          Sign In
        </UButton>
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <UContainer>
        <NuxtPage />
      </UContainer>
    </UMain>
    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Built with Nuxt, NuxtHub, and Nuxt UI
        </p>
      </template>

      <template #right>
        <UButton
          to="/.well-known/openid-configuration"
          external
          variant="link"
          color="neutral"
          size="sm"
        >
          OpenID Configuration
        </UButton>
        <UButton
          to="/.well-known/jwks.json"
          external
          variant="link"
          color="neutral"
          size="sm"
        >
          JWKS
        </UButton>
      </template>
    </UFooter>
  </UApp>
</template>
