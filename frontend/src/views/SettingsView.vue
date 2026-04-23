<template>
  <AppLayout
    :title="t('foundation.settingsPage.title')"
    :subtitle="t('foundation.settingsPage.subtitle')"
    :breadcrumbs="[
      { label: t('dashboard.breadcrumb'), to: '/dashboard' },
      { label: t('foundation.settingsPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <div class="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <article class="erp-card p-4">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{{ t('foundation.settingsPage.groupsLabel') }}</div>
          <div class="mt-4 space-y-2">
            <button
              v-for="group in availableGroups"
              :key="group.key"
              type="button"
              class="w-full rounded-[5px] border px-4 py-3 text-left transition"
              :class="activeGroup === group.key
                ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-500/70 dark:bg-cyan-950/40 dark:text-cyan-200'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700'"
              @click="selectGroup(group.key)"
            >
              <div class="text-sm font-semibold">{{ group.label }}</div>
              <div class="mt-1 text-xs opacity-70">{{ group.description }}</div>
            </button>
          </div>
        </article>

        <article class="erp-card p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {{ activeGroupMeta.label }}
              </div>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {{ activeGroupMeta.heading }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {{ activeGroupMeta.description }}
              </p>
            </div>
            <div class="rounded-[5px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              {{ activeGroupAccessLabel }}
            </div>
          </div>

          <div class="relative mt-6 min-h-[20rem]">
            <PageBlurSkeleton v-if="currentLoading" variant="settings" />

            <div v-else-if="isBusinessGroup" class="space-y-6">
              <section v-if="canViewBusiness" class="space-y-6">
                <Form
                  v-slot="{ values, setFieldValue }"
                  v-if="businessStore.item"
                  :key="`business-${businessFormKey}`"
                  :validation-schema="businessSchema"
                  :initial-values="businessFormValues"
                  class="space-y-6"
                  @submit="submitBusiness"
                >
                  <fieldset :disabled="!canEditBusiness || businessStore.saving" class="space-y-6">
                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <label class="erp-label" for="name">{{ t('foundation.settingsPage.business.fields.businessName') }}</label>
                        <Field id="name" name="name" class="erp-input" />
                        <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="legal_name">{{ t('foundation.settingsPage.business.fields.legalName') }}</label>
                        <Field id="legal_name" name="legal_name" class="erp-input" />
                        <ErrorMessage name="legal_name" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <label class="erp-label" for="email">{{ t('foundation.settingsPage.business.fields.email') }}</label>
                        <Field id="email" name="email" type="email" class="erp-input" />
                        <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="phone">{{ t('foundation.settingsPage.business.fields.phone') }}</label>
                        <Field id="phone" name="phone" class="erp-input" />
                        <ErrorMessage name="phone" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label class="erp-label" for="tax_id">{{ t('foundation.settingsPage.business.fields.taxId') }}</label>
                        <Field id="tax_id" name="tax_id" class="erp-input" />
                        <ErrorMessage name="tax_id" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="currency">{{ t('foundation.settingsPage.business.fields.currency') }}</label>
                        <Field id="currency" name="currency" class="erp-input uppercase" maxlength="3" />
                        <ErrorMessage name="currency" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="country">{{ t('foundation.settingsPage.business.fields.country') }}</label>
                        <Field id="country" name="country" class="erp-input uppercase" maxlength="2" />
                        <ErrorMessage name="country" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="locale">{{ t('foundation.settingsPage.business.fields.locale') }}</label>
                        <AppSelect
                          :model-value="values.locale || null"
                          :options="localeOptions"
                          :placeholder="t('foundation.settingsPage.business.placeholders.selectLocale')"
                          @update:model-value="setFieldValue('locale', $event || '')"
                        />
                        <ErrorMessage name="locale" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <label class="erp-label" for="timezone">{{ t('foundation.settingsPage.business.fields.timezone') }}</label>
                        <AppSelect
                          :model-value="values.timezone || null"
                          :options="timezoneOptions"
                          :placeholder="t('foundation.settingsPage.business.placeholders.selectTimezone')"
                          @update:model-value="setFieldValue('timezone', $event || '')"
                        />
                        <ErrorMessage name="timezone" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="logo_url">{{ t('foundation.settingsPage.business.fields.logoUrl') }}</label>
                        <Field id="logo_url" name="logo_url" class="erp-input" />
                        <ErrorMessage name="logo_url" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div class="md:col-span-2">
                        <label class="erp-label" for="address_line1">{{ t('foundation.settingsPage.business.fields.addressLine1') }}</label>
                        <Field id="address_line1" name="address.line1" class="erp-input" />
                        <ErrorMessage name="address.line1" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div class="md:col-span-2">
                        <label class="erp-label" for="address_line2">{{ t('foundation.settingsPage.business.fields.addressLine2') }}</label>
                        <Field id="address_line2" name="address.line2" class="erp-input" />
                        <ErrorMessage name="address.line2" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="address_city">{{ t('foundation.settingsPage.business.fields.city') }}</label>
                        <Field id="address_city" name="address.city" class="erp-input" />
                        <ErrorMessage name="address.city" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="address_state">{{ t('foundation.settingsPage.business.fields.state') }}</label>
                        <Field id="address_state" name="address.state" class="erp-input" />
                        <ErrorMessage name="address.state" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="address_postal_code">{{ t('foundation.settingsPage.business.fields.postalCode') }}</label>
                        <Field id="address_postal_code" name="address.postal_code" class="erp-input" />
                        <ErrorMessage name="address.postal_code" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>

                      <div>
                        <label class="erp-label" for="financial_year_start_month">{{ t('foundation.settingsPage.business.fields.financialYearStartMonth') }}</label>
                        <Field
                          id="financial_year_start_month"
                          name="financial_year.start_month"
                          type="number"
                          min="1"
                          max="12"
                          class="erp-input"
                        />
                        <ErrorMessage name="financial_year.start_month" class="erp-helper text-rose-500 dark:text-rose-400" />
                      </div>
                    </div>

                    <div v-if="canEditBusiness" class="erp-form-actions">
                      <button type="submit" class="erp-button-primary" :disabled="businessStore.saving">
                        <span
                          v-if="businessStore.saving"
                          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                        ></span>
                        {{ t('foundation.settingsPage.buttons.saveBusinessProfile') }}
                      </button>
                    </div>
                  </fieldset>
                </Form>

                <div
                  v-else
                  class="rounded-[5px] border border-dashed border-slate-300/80 bg-white/35 px-5 py-8 text-sm text-slate-600 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/25 dark:text-slate-300"
                >
                  {{ t('foundation.settingsPage.business.emptyState') }}
                </div>
              </section>

              <section v-if="canViewSettings" class="grid gap-4 xl:grid-cols-[1fr_22rem]">
                <article class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {{ t('foundation.settingsPage.general.eyebrow') }}
                      </div>
                      <h3 class="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                        {{ t('foundation.settingsPage.general.heading') }}
                      </h3>
                      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {{ t('foundation.settingsPage.general.description') }}
                      </p>
                    </div>
                    <div class="rounded-[5px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                      {{ canEditSettings ? t('foundation.settingsPage.access.editable') : t('foundation.settingsPage.access.readOnly') }}
                    </div>
                  </div>

                  <Form
                    :key="`general-${generalFormKey}`"
                    :initial-values="generalFormValues"
                    class="mt-5 space-y-5"
                    @submit="submitGeneralSettings"
                  >
                    <fieldset :disabled="!canEditSettings || settingsStore.saving" class="space-y-5">
                      <div class="grid gap-4 md:grid-cols-2">
                        <div>
                          <label class="erp-label" for="date_format">{{ t('foundation.settingsPage.general.fields.dateFormat') }}</label>
                          <Field id="date_format" name="date_format" class="erp-input" />
                          <p class="erp-helper">{{ t('foundation.settingsPage.general.help.dateFormat') }}</p>
                        </div>

                        <div>
                          <label class="erp-label" for="decimal_places">{{ t('foundation.settingsPage.general.fields.decimalPlaces') }}</label>
                          <Field id="decimal_places" name="decimal_places" type="number" min="0" class="erp-input" />
                          <p class="erp-helper">{{ t('foundation.settingsPage.general.help.decimalPlaces') }}</p>
                        </div>
                      </div>

                      <div v-if="canEditSettings" class="erp-form-actions">
                        <button type="submit" class="erp-button-primary" :disabled="settingsStore.saving">
                          <span
                            v-if="settingsStore.saving"
                            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                          ></span>
                          {{ t('foundation.settingsPage.buttons.saveGeneralDefaults') }}
                        </button>
                      </div>
                    </fieldset>
                  </Form>
                </article>

                <div class="space-y-4" v-if="businessStore.item">
                  <article class="erp-ios-stat">
                    <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <i class="fa-solid fa-users text-cyan-600 dark:text-cyan-400"></i>
                      {{ t('foundation.settingsPage.stats.userCapacity') }}
                    </div>
                    <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {{ businessStore.item?.usage?.users_count ?? 0 }} / {{ businessStore.item?.max_users ?? 0 }}
                    </div>
                    <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {{ t('foundation.settingsPage.stats.remainingSeats', { count: businessStore.item?.usage?.remaining_users ?? 0 }) }}
                    </p>
                  </article>

                  <article class="erp-ios-stat">
                    <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <i class="fa-solid fa-code-branch text-cyan-600 dark:text-cyan-400"></i>
                      {{ t('foundation.settingsPage.stats.branchCapacity') }}
                    </div>
                    <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {{ businessStore.item?.usage?.branches_count ?? 0 }} / {{ businessStore.item?.max_branches ?? 0 }}
                    </div>
                    <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {{ t('foundation.settingsPage.stats.remainingBranches', { count: businessStore.item?.usage?.remaining_branches ?? 0 }) }}
                    </p>
                  </article>

                  <article class="erp-card p-5">
                    <div class="flex items-center justify-between gap-3">
                      <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {{ t('foundation.settingsPage.stats.workspaceContext') }}
                      </div>
                      <StatusBadge :status="businessStore.item?.status || 'active'" />
                    </div>
                    <div class="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                      <div class="flex items-center justify-between gap-3">
                        <span>{{ t('foundation.settingsPage.stats.tier') }}</span>
                        <span class="font-semibold uppercase text-slate-950 dark:text-white">{{ businessStore.item?.tier || 'basic' }}</span>
                      </div>
                      <div class="flex items-center justify-between gap-3">
                        <span>{{ t('foundation.settingsPage.stats.warehouses') }}</span>
                        <span class="font-semibold text-slate-950 dark:text-white">{{ businessStore.item?.usage?.warehouses_count ?? 0 }}</span>
                      </div>
                      <div class="flex items-center justify-between gap-3">
                        <span>{{ t('foundation.settingsPage.stats.businessId') }}</span>
                        <span class="max-w-[11rem] truncate font-mono text-xs text-slate-500 dark:text-slate-400">{{ businessStore.item?.id }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>

            <Form
              v-slot="{ values, setFieldValue }"
              v-else-if="currentGroupValues"
              :key="`${activeGroup}-${settingsFormKey}`"
              :initial-values="settingsDraftValues"
              class="space-y-5"
              @submit="submitSettingsGroup"
            >
              <fieldset :disabled="!canEditSettings || settingsStore.saving" class="space-y-5">
                <div
                  v-for="field in activeFields"
                  :key="field.key"
                  class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
                >
                  <label class="erp-label" :for="field.key">{{ field.label }}</label>
                  <p class="mb-3 text-xs text-slate-500 dark:text-slate-400">{{ field.help }}</p>

                  <AppSelect
                    v-if="field.component === 'select'"
                    :model-value="values[field.key] ?? null"
                    :options="field.options || []"
                    :placeholder="field.label"
                    @update:model-value="setFieldValue(field.key, $event ?? '')"
                  />

                  <Field
                    v-else-if="field.component === 'checkbox'"
                    :id="field.key"
                    :name="field.key"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    :value="true"
                    :unchecked-value="false"
                  />

                  <Field
                    v-else-if="field.component === 'textarea'"
                    :id="field.key"
                    :name="field.key"
                    as="textarea"
                    rows="4"
                    class="erp-input min-h-[7rem]"
                  />

                  <Field
                    v-else
                    :id="field.key"
                    :name="field.key"
                    :type="field.component === 'number' ? 'number' : 'text'"
                    class="erp-input"
                  />
                </div>

                <div v-if="canEditSettings" class="erp-form-actions">
                  <button type="submit" class="erp-button-primary" :disabled="settingsStore.saving">
                    <span
                      v-if="settingsStore.saving"
                      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                    ></span>
                    {{ t('foundation.settingsPage.buttons.saveGroup', { group: activeGroupMeta.label }) }}
                  </button>
                </div>
              </fieldset>
            </Form>
          </div>
        </article>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@stores/auth'
import { useBusinessStore } from '@stores/business'
import { useSettingsStore } from '@stores/settings'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const businessStore = useBusinessStore()
const activeGroup = ref('')
const settingsFormKey = ref(0)
const businessFormKey = ref(0)
const generalFormKey = ref(0)
const timezones = ['Asia/Phnom_Penh', 'Asia/Bangkok', 'UTC']
const timezoneOptions = computed(() => timezones.map((zone) => ({ value: zone, label: zone })))
const localeOptions = computed(() => [
  { value: 'en', label: t('locales.en') },
  { value: 'km', label: t('locales.km') },
])

const groups = computed(() => [
  {
    key: 'business',
    label: t('foundation.settingsPage.groups.business.label'),
    heading: t('foundation.settingsPage.groups.business.heading'),
    description: t('foundation.settingsPage.groups.business.description'),
    permissionAny: ['businesses.index', 'settings.index'],
  },
  {
    key: 'invoice',
    label: t('foundation.settingsPage.groups.invoice.label'),
    heading: t('foundation.settingsPage.groups.invoice.heading'),
    description: t('foundation.settingsPage.groups.invoice.description'),
    permission: 'settings.index',
  },
  {
    key: 'pos',
    label: t('foundation.settingsPage.groups.pos.label'),
    heading: t('foundation.settingsPage.groups.pos.heading'),
    description: t('foundation.settingsPage.groups.pos.description'),
    permission: 'settings.index',
  },
  {
    key: 'stock',
    label: t('foundation.settingsPage.groups.stock.label'),
    heading: t('foundation.settingsPage.groups.stock.heading'),
    description: t('foundation.settingsPage.groups.stock.description'),
    permission: 'settings.index',
  },
  {
    key: 'sales',
    label: t('foundation.settingsPage.groups.sales.label'),
    heading: t('foundation.settingsPage.groups.sales.heading'),
    description: t('foundation.settingsPage.groups.sales.description'),
    permission: 'settings.index',
  },
])

const fieldsByGroup = computed(() => ({
  invoice: [
    { key: 'prefix', label: t('foundation.settingsPage.dynamicFields.invoicePrefix.label'), component: 'text', help: t('foundation.settingsPage.dynamicFields.invoicePrefix.help') },
    { key: 'quotation_prefix', label: t('foundation.settingsPage.dynamicFields.quotationPrefix.label'), component: 'text', help: t('foundation.settingsPage.dynamicFields.quotationPrefix.help') },
    { key: 'start_number', label: t('foundation.settingsPage.dynamicFields.startNumber.label'), component: 'number', help: t('foundation.settingsPage.dynamicFields.startNumber.help') },
    { key: 'show_tax', label: t('foundation.settingsPage.dynamicFields.showTax.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.showTax.help') },
    { key: 'show_logo', label: t('foundation.settingsPage.dynamicFields.showLogo.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.showLogo.help') },
    { key: 'footer_note', label: t('foundation.settingsPage.dynamicFields.footerNote.label'), component: 'textarea', help: t('foundation.settingsPage.dynamicFields.footerNote.help') },
  ],
  pos: [
    { key: 'allow_discount', label: t('foundation.settingsPage.dynamicFields.allowDiscount.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.allowDiscount.help') },
    { key: 'max_discount_pct', label: t('foundation.settingsPage.dynamicFields.maxDiscountPct.label'), component: 'number', help: t('foundation.settingsPage.dynamicFields.maxDiscountPct.help') },
    { key: 'receipt_printer', label: t('foundation.settingsPage.dynamicFields.receiptPrinter.label'), component: 'select', help: t('foundation.settingsPage.dynamicFields.receiptPrinter.help'), options: [
      { value: 'browser', label: t('foundation.settingsPage.options.receiptPrinter.browser') },
      { value: 'network', label: t('foundation.settingsPage.options.receiptPrinter.network') },
    ] },
    { key: 'require_cash_register_session', label: t('foundation.settingsPage.dynamicFields.requireCashRegisterSession.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.requireCashRegisterSession.help') },
    { key: 'show_customer_display', label: t('foundation.settingsPage.dynamicFields.showCustomerDisplay.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.showCustomerDisplay.help') },
  ],
  stock: [
    { key: 'enable_lot_tracking', label: t('foundation.settingsPage.dynamicFields.enableLotTracking.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.enableLotTracking.help') },
    { key: 'enable_serial_tracking', label: t('foundation.settingsPage.dynamicFields.enableSerialTracking.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.enableSerialTracking.help') },
    { key: 'lot_expiry_alert_days', label: t('foundation.settingsPage.dynamicFields.lotExpiryAlertDays.label'), component: 'number', help: t('foundation.settingsPage.dynamicFields.lotExpiryAlertDays.help') },
    { key: 'default_lot_selection', label: t('foundation.settingsPage.dynamicFields.defaultLotSelection.label'), component: 'select', help: t('foundation.settingsPage.dynamicFields.defaultLotSelection.help'), options: [
      { value: 'fefo', label: t('foundation.settingsPage.options.lotSelection.fefo') },
      { value: 'fifo', label: t('foundation.settingsPage.options.lotSelection.fifo') },
    ] },
    { key: 'enable_rack_location', label: t('foundation.settingsPage.dynamicFields.enableRackLocation.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.enableRackLocation.help') },
  ],
  sales: [
    { key: 'enable_commission', label: t('foundation.settingsPage.dynamicFields.enableCommission.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.enableCommission.help') },
    { key: 'minimum_sell_price_enabled', label: t('foundation.settingsPage.dynamicFields.minimumSellPriceEnabled.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.minimumSellPriceEnabled.help') },
    { key: 'delivery_tracking_enabled', label: t('foundation.settingsPage.dynamicFields.deliveryTrackingEnabled.label'), component: 'checkbox', help: t('foundation.settingsPage.dynamicFields.deliveryTrackingEnabled.help') },
    { key: 'edit_lifetime_days', label: t('foundation.settingsPage.dynamicFields.saleEditLifetimeDays.label'), component: 'number', help: t('foundation.settingsPage.dynamicFields.saleEditLifetimeDays.help') },
  ],
}))

const businessSchema = yup.object({
  name: yup.string().required().max(255),
  legal_name: yup.string().nullable().max(255),
  email: yup.string().email().required().max(255),
  phone: yup.string().nullable().max(20),
  tax_id: yup.string().nullable().max(50),
  currency: yup.string().required().length(3),
  country: yup.string().nullable().length(2),
  locale: yup.string().nullable().max(10),
  timezone: yup.string().required().max(100),
  logo_url: yup.string().nullable().url().max(500),
  address: yup.object({
    line1: yup.string().nullable().max(255),
    line2: yup.string().nullable().max(255),
    city: yup.string().nullable().max(100),
    state: yup.string().nullable().max(100),
    postal_code: yup.string().nullable().max(30),
  }),
  financial_year: yup.object({
    start_month: yup.number().nullable().min(1).max(12),
  }),
})

const alert = reactive({ show: false, type: 'success', title: '', message: '' })

const canViewBusiness = computed(() => auth.can('businesses.index'))
const canEditBusiness = computed(() => auth.can('businesses.edit'))
const canViewSettings = computed(() => auth.can('settings.index'))
const canEditSettings = computed(() => auth.can('settings.edit'))

const availableGroups = computed(() =>
  groups.value.filter(
    (group) =>
      (!group.permission || auth.can(group.permission)) &&
      (!group.permissionAny || auth.canAny(group.permissionAny))
  )
)

const activeFields = computed(() => fieldsByGroup.value[activeGroup.value] || [])
const activeGroupMeta = computed(() => availableGroups.value.find((group) => group.key === activeGroup.value) || availableGroups.value[0] || groups.value[0])
const isBusinessGroup = computed(() => activeGroup.value === 'business')
const activeGroupAccessLabel = computed(() => {
  if (!isBusinessGroup.value) {
    return canEditSettings.value ? t('foundation.settingsPage.access.editable') : t('foundation.settingsPage.access.readOnly')
  }

  if ((canEditBusiness.value && canViewBusiness.value) || (canEditSettings.value && canViewSettings.value)) {
    return t('foundation.settingsPage.access.editable')
  }

  return t('foundation.settingsPage.access.readOnly')
})

const currentLoading = computed(() => {
  if (isBusinessGroup.value) {
    return businessStore.loading || settingsStore.loading
  }

  return settingsStore.loading
})

const currentGroupValues = computed(() => settingsStore.groups[activeGroup.value] || null)
const settingsDraftValues = computed(() => currentGroupValues.value || {})
const generalFormValues = computed(() => ({
  date_format: settingsStore.groups.general?.date_format ?? 'Y-m-d',
  decimal_places: settingsStore.groups.general?.decimal_places ?? 2,
}))

const businessFormValues = computed(() => ({
  name: businessStore.item?.name ?? '',
  legal_name: businessStore.item?.legal_name ?? '',
  email: businessStore.item?.email ?? '',
  phone: businessStore.item?.phone ?? '',
  tax_id: businessStore.item?.tax_id ?? '',
  currency: businessStore.item?.currency ?? 'USD',
  country: businessStore.item?.country ?? 'KH',
  locale: businessStore.item?.locale ?? 'en',
  timezone: businessStore.item?.timezone ?? 'Asia/Phnom_Penh',
  logo_url: businessStore.item?.logo_url ?? '',
  address: {
    line1: businessStore.item?.address?.line1 ?? '',
    line2: businessStore.item?.address?.line2 ?? '',
    city: businessStore.item?.address?.city ?? '',
    state: businessStore.item?.address?.state ?? '',
    postal_code: businessStore.item?.address?.postal_code ?? '',
  },
  financial_year: {
    start_month: businessStore.item?.financial_year?.start_month ?? 1,
  },
}))

const showToast = (type, title, message) => {
  alert.type = type
  alert.title = title
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
}

const normalizeRequestedGroup = (group) => {
  if (group === 'general') {
    return 'business'
  }

  return group
}

const syncRouteGroup = async (group) => {
  if (route.query.group === group) {
    return
  }

  await router.replace({
    name: 'settings',
    query: { ...route.query, group },
  })
}

const syncAuthBusiness = (business) => {
  if (!auth.user) {
    return
  }

  auth.user = {
    ...auth.user,
    business: {
      ...auth.user.business,
      id: business.id,
      name: business.name,
      legal_name: business.legal_name,
      email: business.email,
      status: business.status,
      currency: business.currency,
      timezone: business.timezone,
      locale: business.locale,
    },
  }

  auth.persist()
}

const loadGroup = async (group) => {
  if (group === 'business') {
    const tasks = []

    if (canViewBusiness.value) {
      tasks.push(businessStore.fetchBusiness())
    }

    if (canViewSettings.value && !settingsStore.groups.general) {
      tasks.push(settingsStore.fetchGroup('general'))
    }

    if (tasks.length > 0) {
      await Promise.all(tasks)
    }

    businessFormKey.value += 1
    generalFormKey.value += 1
    return
  }

  if (!settingsStore.groups[group]) {
    await settingsStore.fetchGroup(group)
  }

  settingsFormKey.value += 1
}

const selectGroup = async (group, options = {}) => {
  const { syncRoute = true } = options
  const normalizedGroup = normalizeRequestedGroup(group)

  if (!availableGroups.value.some((item) => item.key === normalizedGroup)) {
    return
  }

  activeGroup.value = normalizedGroup

  try {
    await loadGroup(normalizedGroup)
    if (syncRoute) {
      await syncRouteGroup(normalizedGroup)
    }
  } catch (error) {
    showToast(
      'danger',
      t('foundation.settingsPage.toast.loadFailedTitle'),
      error.response?.data?.message || t('foundation.settingsPage.toast.loadFailedMessage', { section: activeGroupMeta.value.label.toLowerCase() })
    )
  }
}

const submitBusiness = async (values) => {
  if (!canEditBusiness.value) {
    return
  }

  try {
    const response = await businessStore.updateBusiness(values)
    syncAuthBusiness(response.data)
    businessFormKey.value += 1
    showToast('success', t('foundation.settingsPage.toast.businessUpdatedTitle'), t('foundation.settingsPage.toast.businessUpdatedMessage'))
  } catch (error) {
    showToast(
      'danger',
      t('foundation.settingsPage.toast.businessUpdateFailedTitle'),
      error.response?.data?.message || t('foundation.settingsPage.toast.businessUpdateFailedMessage')
    )
  }
}

const submitGeneralSettings = async (values) => {
  if (!canEditSettings.value) {
    return
  }

  try {
    await settingsStore.updateGroup('general', values)
    generalFormKey.value += 1
    showToast('success', t('foundation.settingsPage.toast.generalSavedTitle'), t('foundation.settingsPage.toast.generalSavedMessage'))
  } catch (error) {
    showToast(
      'danger',
      t('foundation.settingsPage.toast.generalSaveFailedTitle'),
      error.response?.data?.message || t('foundation.settingsPage.toast.generalSaveFailedMessage')
    )
  }
}

const submitSettingsGroup = async (values) => {
  try {
    await settingsStore.updateGroup(activeGroup.value, values)
    settingsFormKey.value += 1
    showToast(
      'success',
      t('foundation.settingsPage.toast.settingsSavedTitle'),
      t('foundation.settingsPage.toast.settingsSavedMessage', { section: activeGroupMeta.value.label })
    )
  } catch (error) {
    showToast(
      'danger',
      t('foundation.settingsPage.toast.settingsSaveFailedTitle'),
      error.response?.data?.message || t('foundation.settingsPage.toast.settingsSaveFailedMessage')
    )
  }
}

watch(
  () => route.query.group,
  async (group) => {
    const nextGroup = normalizeRequestedGroup(typeof group === 'string' ? group : '')

    if (!nextGroup || nextGroup === activeGroup.value) {
      return
    }

    if (!availableGroups.value.some((item) => item.key === nextGroup)) {
      return
    }

    await selectGroup(nextGroup, { syncRoute: false })
  }
)

onMounted(async () => {
  const requestedGroup = normalizeRequestedGroup(typeof route.query.group === 'string' ? route.query.group : '')
  const initialGroup =
    availableGroups.value.find((group) => group.key === requestedGroup)?.key ||
    availableGroups.value[0]?.key ||
    'business'

  await selectGroup(initialGroup, { syncRoute: route.query.group !== initialGroup })
})
</script>
