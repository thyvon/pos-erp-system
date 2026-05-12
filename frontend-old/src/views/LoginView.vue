<template>
  <div class="erp-login-page relative min-h-screen overflow-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
    <div class="erp-login-backdrop erp-login-backdrop-a" aria-hidden="true"></div>
    <div class="erp-login-backdrop erp-login-backdrop-b" aria-hidden="true"></div>
    <div class="erp-login-grid" aria-hidden="true"></div>

    <AppAlert v-model:show="showToast" type="danger" :title="t('login.failedTitle')" :message="toastMessage" />

    <div class="absolute right-3 top-3 z-10 sm:right-5 sm:top-5 lg:right-6 lg:top-6">
      <button type="button" class="erp-topbar-button" :title="t('common.language')" @click="toggleLocale">
        <i class="fa-solid fa-language"></i>
        <span>{{ currentLocaleLabel }}</span>
      </button>
    </div>

    <div class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center py-8 sm:min-h-[calc(100vh-2.5rem)]">
      <div class="grid w-full gap-6 lg:grid-cols-[1.12fr_0.88fr] xl:gap-8">
        <section class="erp-login-hero order-2 lg:order-1">
          <div class="erp-login-hero-card">
            <div class="erp-glass-band inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-200">
              <i class="fa-solid fa-sparkles text-[10px]"></i>
              {{ t('login.badge') }}
            </div>

            <div class="mt-6 max-w-2xl">
              <h1 class="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
                {{ t('login.heroTitle') }}
              </h1>
              <p class="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                {{ t('login.heroBody') }}
              </p>
            </div>

            <div class="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <article class="erp-login-info-card sm:col-span-2 xl:col-span-1">
                <div class="erp-login-info-icon">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {{ t('login.mode') }}
                  </div>
                  <div class="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{{ t('login.modeValue') }}</div>
                  <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ t('login.modeBody') }}</p>
                </div>
              </article>

              <article class="erp-login-info-card">
                <div class="erp-login-info-icon">
                  <i class="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {{ t('login.style') }}
                  </div>
                  <div class="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{{ t('login.styleValue') }}</div>
                  <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ t('login.styleBody') }}</p>
                </div>
              </article>

              <article class="erp-login-status-card">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Workspace
                    </div>
                    <div class="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{{ appName }}</div>
                  </div>
                  <div class="erp-login-status-indicator">
                    <span></span>
                    <span>Ready</span>
                  </div>
                </div>
                <div class="mt-5 grid gap-3 sm:grid-cols-3">
                  <div v-for="highlight in loginHighlights" :key="highlight.label" class="erp-login-mini-stat">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {{ highlight.label }}
                    </div>
                    <div class="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{{ highlight.value }}</div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="order-1 mx-auto flex w-full max-w-xl items-center lg:order-2 lg:max-w-none">
          <div class="erp-login-panel w-full">
            <div class="erp-login-panel-top">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                  {{ t('login.welcomeBack') }}
                </div>
                <h2 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ appName }}</h2>
                <p class="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {{ t('login.continueMessage') }}
                </p>
              </div>

              <div class="erp-login-panel-pill">
                <i class="fa-solid fa-bolt"></i>
                <span>SPA</span>
              </div>
            </div>

            <div class="mt-6 rounded-[5px] border border-white/55 bg-white/48 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div class="flex items-start gap-3">
                <div class="erp-login-credential-icon">
                  <i class="fa-solid fa-key"></i>
                </div>
                <div>
                  <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {{ t('login.localCredentials') }}
                  </div>
                  <div class="mt-2 text-sm font-medium text-slate-900 dark:text-white">admin@example.com</div>
                  <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">password</div>
                </div>
              </div>
            </div>

            <Form class="mt-6 space-y-4" :validation-schema="schema" @submit="submit">
              <div>
                <label class="erp-label" for="email">{{ t('login.email') }}</label>
                <div class="erp-login-field-shell">
                  <span class="erp-login-field-icon">
                    <i class="fa-solid fa-envelope"></i>
                  </span>
                  <Field id="email" name="email" type="email" class="erp-input erp-login-input" placeholder="admin@example.com" />
                </div>
                <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <label class="erp-label mb-0" for="password">{{ t('login.password') }}</label>
                  <RouterLink
                    class="text-sm font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-400"
                    :to="{ name: 'forgot-password' }"
                  >
                    {{ t('auth.forgotLink') }}
                  </RouterLink>
                </div>

                <div class="erp-login-field-shell">
                  <span class="erp-login-field-icon">
                    <i class="fa-solid fa-lock"></i>
                  </span>
                  <Field
                    id="password"
                    name="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="erp-input erp-login-input erp-login-input-password"
                    :placeholder="t('login.passwordPlaceholder')"
                  />
                  <button
                    type="button"
                    class="erp-login-visibility"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  >
                    <i class="fa-solid" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                  </button>
                </div>
                <ErrorMessage name="password" class="erp-helper text-rose-500 dark:text-rose-400" />
              </div>

              <button type="submit" class="erp-button-primary erp-login-submit w-full" :disabled="auth.loading">
                <span
                  v-if="auth.loading"
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                ></span>
                {{ t('login.signIn') }}
              </button>
            </Form>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import { useAuthStore } from '@stores/auth'
import { applyLocale } from '@/i18n'

const auth = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n()
const showToast = ref(false)
const toastMessage = ref('')
const showPassword = ref(false)

const appName = computed(() => import.meta.env.VITE_APP_NAME || 'ERP System')
const currentLocaleLabel = computed(() => (locale.value === 'km' ? 'KM' : 'EN'))
const loginHighlights = computed(() => [
  { label: 'Access', value: 'Secure' },
  { label: 'Session', value: 'Fast' },
  { label: 'Status', value: 'Online' },
])

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

const toggleLocale = () => {
  applyLocale(locale.value === 'en' ? 'km' : 'en')
}

const submit = async (values) => {
  try {
    await auth.login(values)
    await router.push('/dashboard')
  } catch (error) {
    toastMessage.value = error.response?.data?.message || t('login.failedMessage')
    showToast.value = true
  }
}
</script>

<style scoped>
.erp-login-page {
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 26%),
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 24%),
    radial-gradient(circle at bottom center, rgba(59, 130, 246, 0.12), transparent 28%);
}

.erp-login-backdrop {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.78;
  pointer-events: none;
}

.erp-login-backdrop-a {
  left: -8rem;
  top: 5rem;
  width: 22rem;
  height: 22rem;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.32) 0%, rgba(59, 130, 246, 0.08) 56%, transparent 74%);
}

.erp-login-backdrop-b {
  right: -8rem;
  bottom: 4rem;
  width: 24rem;
  height: 24rem;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.24) 0%, rgba(251, 146, 60, 0.12) 54%, transparent 76%);
}

.erp-login-grid {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 2.8rem 2.8rem;
  mask-image: radial-gradient(circle at center, black 44%, transparent 88%);
}

.erp-login-hero {
  position: relative;
}

.erp-login-hero-card {
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.48);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.24)),
    radial-gradient(circle at top left, rgba(125, 211, 252, 0.24), transparent 38%),
    radial-gradient(circle at bottom right, rgba(251, 146, 60, 0.14), transparent 34%);
  box-shadow:
    0 28px 80px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(26px) saturate(1.08);
  -webkit-backdrop-filter: blur(26px) saturate(1.08);
  padding: 1.6rem;
}

.erp-login-info-card,
.erp-login-status-card,
.erp-login-panel {
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.28));
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(1.08);
  -webkit-backdrop-filter: blur(24px) saturate(1.08);
}

.erp-login-info-card {
  display: flex;
  gap: 0.95rem;
  padding: 1rem;
}

.erp-login-info-icon,
.erp-login-credential-icon {
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

.erp-login-status-card {
  padding: 1rem;
}

.erp-login-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.58);
  color: rgb(15 118 110);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.erp-login-status-indicator span:first-child {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 9999px;
  background: rgb(16 185 129);
  box-shadow: 0 0 0 0.3rem rgba(16, 185, 129, 0.12);
}

.erp-login-mini-stat {
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.42);
  padding: 0.85rem;
}

.erp-login-panel {
  padding: 1.4rem;
}

.erp-login-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.erp-login-panel-pill {
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

.erp-login-field-shell {
  position: relative;
}

.erp-login-field-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(100 116 139);
  pointer-events: none;
}

.erp-login-input {
  padding-left: 2.7rem;
}

.erp-login-input-password {
  padding-right: 2.8rem;
}

.erp-login-visibility {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  color: rgb(100 116 139);
  transition: color 0.18s ease, background-color 0.18s ease;
}

.erp-login-visibility:hover {
  background: rgba(148, 163, 184, 0.12);
  color: rgb(15 23 42);
}

.erp-login-submit {
  min-height: 3.2rem;
}

.dark .erp-login-grid {
  opacity: 0.18;
}

.dark .erp-login-hero-card,
.dark .erp-login-info-card,
.dark .erp-login-status-card,
.dark .erp-login-panel {
  border-color: rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(160deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.44)),
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 36%);
  box-shadow:
    0 24px 64px rgba(2, 6, 23, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.dark .erp-login-info-icon,
.dark .erp-login-credential-icon {
  background: linear-gradient(145deg, rgba(14, 165, 233, 0.2), rgba(56, 189, 248, 0.08));
  color: rgb(103 232 249);
}

.dark .erp-login-status-indicator,
.dark .erp-login-panel-pill,
.dark .erp-login-mini-stat {
  background: rgba(15, 23, 42, 0.44);
}

.dark .erp-login-visibility:hover {
  background: rgba(148, 163, 184, 0.12);
  color: rgb(241 245 249);
}

@media (max-width: 1023px) {
  .erp-login-hero-card {
    padding: 1.2rem;
  }
}

@media (max-width: 639px) {
  .erp-login-panel,
  .erp-login-hero-card {
    padding: 1rem;
  }

  .erp-login-panel-top {
    flex-direction: column;
  }
}
</style>
