<template>
  <div class="relative min-h-screen overflow-hidden px-3 py-6 sm:px-5 lg:px-6">
    <div class="erp-glass-orb left-[-6rem] top-[8rem] h-64 w-64 bg-sky-300/30"></div>
    <div class="erp-glass-orb right-[-5rem] top-[4rem] h-72 w-72 bg-orange-200/30" style="animation-delay: -5s"></div>
    <div class="erp-glass-orb bottom-[4rem] left-[22%] h-52 w-52 bg-blue-200/20" style="animation-delay: -9s"></div>

    <AppAlert v-model:show="showToast" type="danger" title="Login failed" :message="toastMessage" />

    <div class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section class="hidden lg:block">
        <div class="max-w-xl">
          <div class="erp-glass-band inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-200">
            ERP platform
          </div>
          <h1 class="mt-6 text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">
            A softer sign-in screen for the ERP control center.
          </h1>
          <p class="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
            The visual direction uses frosted panels, layered light, and calmer spacing so the first impression feels more like a product and less like a starter template.
          </p>

          <div class="mt-8 grid grid-cols-2 gap-3">
            <div class="erp-card p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Mode</div>
              <div class="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">API first</div>
              <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Vue talks to Laravel only through the backend endpoints.</p>
            </div>
            <div class="erp-card p-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Style</div>
              <div class="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Glass UI</div>
              <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Reusable frosted surfaces for future ERP pages.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto w-full max-w-lg">
        <div class="erp-card rounded-[5px] p-5 text-slate-900 sm:p-6 dark:text-white">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Welcome back</div>
              <h2 class="mt-3 text-3xl font-semibold tracking-tight">{{ appName }}</h2>
              <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Sign in to continue building and testing the ERP modules.
              </p>
            </div>

            <div class="erp-glass-band px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-cyan-100">
              SPA
            </div>
          </div>

          <Form class="mt-6 space-y-4" :validation-schema="schema" @submit="submit">
            <div>
              <label class="erp-label" for="email">Email</label>
              <Field id="email" name="email" type="email" class="erp-input" placeholder="admin@example.com" />
              <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="password">Password</label>
              <Field id="password" name="password" type="password" class="erp-input" placeholder="Enter your password" />
              <ErrorMessage name="password" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <button type="submit" class="erp-button-primary w-full" :disabled="auth.loading">
              <span
                v-if="auth.loading"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              Sign in
            </button>
          </Form>

          <div class="mt-5 rounded-[5px] border border-white/50 bg-white/55 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Local test credentials
            </div>
            <div class="mt-2 text-sm font-medium text-slate-900 dark:text-white">admin@example.com</div>
            <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">password</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import { useAuthStore } from '@stores/auth'

const auth = useAuthStore()
const router = useRouter()
const showToast = ref(false)
const toastMessage = ref('')

const appName = computed(() => import.meta.env.VITE_APP_NAME || 'ERP System')

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

const submit = async (values) => {
  try {
    await auth.login(values)
    await router.push('/dashboard')
  } catch (error) {
    toastMessage.value =
      error.response?.data?.message || 'Unable to sign in with the provided credentials.'
    showToast.value = true
  }
}
</script>
