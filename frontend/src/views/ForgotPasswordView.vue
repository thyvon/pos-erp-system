<template>
  <div class="relative min-h-screen overflow-hidden px-3 py-6 sm:px-5 lg:px-6">
    <div class="erp-glass-orb left-[-6rem] top-[8rem] h-64 w-64 bg-sky-300/30"></div>
    <div class="erp-glass-orb right-[-5rem] top-[4rem] h-72 w-72 bg-orange-200/30" style="animation-delay: -5s"></div>

    <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

    <div class="relative z-10 mx-auto max-w-lg pt-8">
      <div class="mb-6">
        <RouterLink to="/login" class="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">
          ← {{ t('auth.backToSignIn') }}
        </RouterLink>
      </div>

      <div class="erp-card rounded-[5px] p-6 dark:text-white sm:p-8">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {{ t('auth.forgotTitle') }}
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {{ t('auth.forgotBody') }}
        </p>

        <Form class="mt-6 space-y-4" :validation-schema="schema" @submit="submit">
          <div>
            <label class="erp-label" for="fp-email">{{ t('login.email') }}</label>
            <Field id="fp-email" name="email" type="email" class="erp-input" autocomplete="email" />
            <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <button type="submit" class="erp-button-primary w-full" :disabled="loading">
            <span
              v-if="loading"
              class="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
            ></span>
            {{ t('auth.sendResetLink') }}
          </button>
        </Form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import * as authApi from '@api/auth'

const { t } = useI18n()
const loading = ref(false)
const alert = reactive({
  show: false,
  type: 'success',
  title: '',
  message: '',
})

const schema = yup.object({
  email: yup.string().email().required(),
})

const submit = async ({ email }) => {
  loading.value = true
  alert.show = false

  try {
    await authApi.forgotPassword({ email })
    alert.type = 'success'
    alert.title = t('auth.forgotSuccessTitle')
    alert.message = t('auth.forgotSuccessBody')
    alert.show = true
  } catch (error) {
    alert.type = 'danger'
    alert.title = t('auth.forgotErrorTitle')
    alert.message = error.response?.data?.message || t('auth.forgotErrorBody')
    alert.show = true
  } finally {
    loading.value = false
  }
}
</script>
