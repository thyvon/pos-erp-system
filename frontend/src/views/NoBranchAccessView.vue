<template>
  <div class="relative min-h-screen overflow-hidden px-3 py-10 sm:px-5">
    <div class="erp-glass-orb left-[-6rem] top-[8rem] h-64 w-64 bg-amber-200/35"></div>
    <div class="erp-glass-orb right-[-5rem] top-[4rem] h-72 w-72 bg-sky-300/30" style="animation-delay: -5s"></div>

    <div class="relative z-10 mx-auto max-w-lg">
      <div class="erp-card rounded-[5px] p-6 text-slate-900 dark:text-white sm:p-8">
        <div class="flex items-start gap-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[5px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
          >
            <i class="fa-solid fa-code-branch text-xl" aria-hidden="true"></i>
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-semibold tracking-tight">{{ t('branchAccess.title') }}</h1>
            <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {{ t('branchAccess.body') }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" class="erp-button-primary w-full sm:w-auto" @click="signOut">
            <i class="fa-solid fa-arrow-right-from-bracket me-2"></i>
            {{ t('layout.logout') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const signOut = async () => {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>
