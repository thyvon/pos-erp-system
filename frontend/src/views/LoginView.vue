<template>
  <div class="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
    <AppAlert v-model:show="showToast" type="danger" title="Login failed" :message="toastMessage" />

    <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section class="hidden lg:block">
        <div class="max-w-xl">
          <div class="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            ERP platform
          </div>
          <h1 class="mt-6 text-5xl font-semibold tracking-tight text-white">
            Standalone Vue frontend for the ERP.
          </h1>
          <p class="mt-6 text-lg leading-8 text-slate-300">
            This frontend runs separately from Laravel and consumes the backend only through the API layer.
          </p>
        </div>
      </section>

      <section class="mx-auto w-full max-w-lg">
        <div class="rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-glow backdrop-blur sm:p-8 dark:bg-slate-900/95 dark:text-white">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Welcome back</div>
              <h2 class="mt-3 text-3xl font-semibold tracking-tight">{{ appName }}</h2>
              <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Sign in to continue building and testing the ERP modules.
              </p>
            </div>

            <div class="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-cyan-400 dark:text-slate-950">
              SPA
            </div>
          </div>

          <Form class="mt-8 space-y-5" :validation-schema="schema" @submit="submit">
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

          <div class="mt-6 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
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
