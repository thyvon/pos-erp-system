<template>
  <div class="erp-forgot-page relative min-h-screen overflow-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
    <div class="erp-forgot-backdrop erp-forgot-backdrop-a" aria-hidden="true"></div>
    <div class="erp-forgot-backdrop erp-forgot-backdrop-b" aria-hidden="true"></div>
    <div class="erp-forgot-grid" aria-hidden="true"></div>

    <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

    <div class="absolute right-3 top-3 z-10 sm:right-5 sm:top-5 lg:right-6 lg:top-6">
      <button type="button" class="erp-topbar-button" :title="t('common.language')" @click="toggleLocale">
        <i class="fa-solid fa-language"></i>
        <span>{{ currentLocaleLabel }}</span>
      </button>
    </div>

    <div class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center py-8 sm:min-h-[calc(100vh-2.5rem)]">
      <div class="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] xl:gap-8">
        <section class="order-2 lg:order-1">
          <div class="erp-forgot-side-card">
            <div class="erp-glass-band inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-200">
              <i class="fa-solid fa-envelope-open-text text-[10px]"></i>
              Recovery
            </div>

            <h1 class="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              {{ t('auth.forgotTitle') }}
            </h1>
            <p class="mt-5 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
              {{ t('auth.forgotBody') }}
            </p>

            <div class="mt-8 space-y-3">
              <article class="erp-forgot-info-card">
                <div class="erp-forgot-info-icon">
                  <i class="fa-solid fa-paper-plane"></i>
                </div>
                <div>
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">Email delivery</div>
                  <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    We will send a secure reset link to the email address linked to your account.
                  </p>
                </div>
              </article>

              <article class="erp-forgot-info-card">
                <div class="erp-forgot-info-icon">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">Security first</div>
                  <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    If the email is valid, the reset request will be handled safely without exposing account details.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="order-1 mx-auto flex w-full max-w-xl items-center lg:order-2 lg:max-w-none">
          <div class="erp-forgot-panel w-full">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                  Account access
                </div>
                <h2 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Reset your password
                </h2>
                <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Enter your login email and we will send reset instructions.
                </p>
              </div>

              <div class="erp-forgot-pill">
                <i class="fa-solid fa-arrow-rotate-left"></i>
                <span>Reset</span>
              </div>
            </div>

            <div class="mt-6">
              <RouterLink to="/login" class="erp-forgot-back-link">
                <i class="fa-solid fa-arrow-left"></i>
                <span>{{ t('auth.backToSignIn') }}</span>
              </RouterLink>
            </div>

            <Form class="mt-6 space-y-4" :validation-schema="schema" @submit="submit">
              <div>
                <label class="erp-label" for="fp-email">{{ t('login.email') }}</label>
                <div class="erp-forgot-field-shell">
                  <span class="erp-forgot-field-icon">
                    <i class="fa-solid fa-envelope"></i>
                  </span>
                  <Field
                    id="fp-email"
                    name="email"
                    type="email"
                    class="erp-input erp-forgot-input"
                    autocomplete="email"
                    placeholder="admin@example.com"
                  />
                </div>
                <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>

              <button type="submit" class="erp-button-primary erp-forgot-submit w-full" :disabled="loading">
                <span
                  v-if="loading"
                  class="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                ></span>
                {{ t('auth.sendResetLink') }}
              </button>
            </Form>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import * as authApi from '@api/auth'
import { applyLocale } from '@/i18n'

const { t, locale } = useI18n()
const loading = ref(false)
const currentLocaleLabel = computed(() => (locale.value === 'km' ? 'KM' : 'EN'))
const alert = reactive({
  show: false,
  type: 'success',
  title: '',
  message: '',
})

const schema = yup.object({
  email: yup.string().email().required(),
})

const toggleLocale = () => {
  applyLocale(locale.value === 'en' ? 'km' : 'en')
}

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

<style scoped>
.erp-forgot-page {
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 26%),
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 24%),
    radial-gradient(circle at bottom center, rgba(59, 130, 246, 0.1), transparent 28%);
}

.erp-forgot-backdrop {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.76;
  pointer-events: none;
}

.erp-forgot-backdrop-a {
  left: -8rem;
  top: 6rem;
  width: 20rem;
  height: 20rem;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(59, 130, 246, 0.08) 56%, transparent 74%);
}

.erp-forgot-backdrop-b {
  right: -7rem;
  bottom: 4rem;
  width: 22rem;
  height: 22rem;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, rgba(251, 146, 60, 0.12) 56%, transparent 76%);
}

.erp-forgot-grid {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 2.8rem 2.8rem;
  mask-image: radial-gradient(circle at center, black 44%, transparent 88%);
}

.erp-forgot-side-card,
.erp-forgot-panel {
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.3));
  box-shadow:
    0 24px 56px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(1.08);
  -webkit-backdrop-filter: blur(24px) saturate(1.08);
}

.erp-forgot-side-card {
  padding: 1.5rem;
}

.erp-forgot-info-card {
  display: flex;
  gap: 0.95rem;
  padding: 1rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.46);
}

.erp-forgot-info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 5px;
  background: linear-gradient(145deg, rgba(14, 165, 233, 0.18), rgba(56, 189, 248, 0.08));
  color: rgb(3 105 161);
  flex-shrink: 0;
}

.erp-forgot-panel {
  padding: 1.4rem;
}

.erp-forgot-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.8rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.56);
  color: rgb(14 116 144);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.erp-forgot-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: rgb(14 116 144);
  font-size: 0.92rem;
  font-weight: 600;
  transition: color 0.18s ease, transform 0.18s ease;
}

.erp-forgot-back-link:hover {
  color: rgb(2 132 199);
  transform: translateX(-1px);
}

.erp-forgot-field-shell {
  position: relative;
}

.erp-forgot-field-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(100 116 139);
  pointer-events: none;
}

.erp-forgot-input {
  padding-left: 2.7rem;
}

.erp-forgot-submit {
  min-height: 3.2rem;
}

.dark .erp-forgot-grid {
  opacity: 0.18;
}

.dark .erp-forgot-side-card,
.dark .erp-forgot-panel {
  border-color: rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(160deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.44)),
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 36%);
  box-shadow:
    0 24px 64px rgba(2, 6, 23, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.dark .erp-forgot-info-card {
  border-color: rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.42);
}

.dark .erp-forgot-info-icon {
  background: linear-gradient(145deg, rgba(14, 165, 233, 0.2), rgba(56, 189, 248, 0.08));
  color: rgb(103 232 249);
}

.dark .erp-forgot-pill {
  background: rgba(15, 23, 42, 0.44);
}

@media (max-width: 1023px) {
  .erp-forgot-side-card {
    padding: 1.2rem;
  }
}

@media (max-width: 639px) {
  .erp-forgot-side-card,
  .erp-forgot-panel {
    padding: 1rem;
  }
}
</style>
