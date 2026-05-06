<template>
  <AppModal
    :show="show"
    :title="title"
    :icon="icon"
    :size="size"
    :mobile-full-screen="mobileFullScreen"
    @close="$emit('close')"
  >
    <div class="space-y-5">
      <div v-if="introTitle || introText" class="space-y-1">
        <div v-if="introTitle" class="text-sm font-semibold text-slate-950 dark:text-white">
          {{ introTitle }}
        </div>
        <div v-if="introText" class="text-sm text-slate-500 dark:text-slate-400">
          {{ introText }}
        </div>
      </div>

      <div v-if="summaryLabel" class="rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div class="flex items-center justify-between gap-3">
          <span class="text-slate-500 dark:text-slate-400">{{ summaryLabel }}</span>
          <span class="text-lg font-semibold text-slate-950 dark:text-white">
            {{ formatAccountingMoney(summaryValue) }}
          </span>
        </div>
      </div>

      <div class="space-y-3">
        <div v-if="allowMultipleRows" class="flex items-center justify-end">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-300"
            @click="$emit('add-row')"
          >
            <i class="fa-solid fa-plus"></i>
            {{ t('sales.shared.paymentModal.addRow') }}
          </button>
        </div>

        <div class="space-y-3">
          <article
            v-for="(row, index) in resolvedPayments"
            :key="index"
            class="rounded-[18px] border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/75"
          >
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <span class="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                  {{ index + 1 }}
                </span>
                <div class="text-sm font-semibold text-slate-950 dark:text-white">
                  {{ t('sales.shared.paymentModal.rowLabel', { number: index + 1 }) }}
                </div>
              </div>

              <button
                v-if="allowMultipleRows && resolvedPayments.length > 1"
                type="button"
                class="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 sm:w-auto dark:border-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-950/30"
                @click="$emit('remove-row', index)"
              >
                <i class="fa-solid fa-trash"></i>
                {{ t('sales.shared.paymentModal.removeRow') }}
              </button>
            </div>

            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
              <div class="md:col-span-2 xl:col-span-5">
                <label class="erp-label">{{ accountLabel }}</label>
                <AppSelect
                  :model-value="row.payment_account_id || null"
                  :options="paymentAccountOptions"
                  :placeholder="accountPlaceholder"
                  :search-placeholder="accountSearchPlaceholder || undefined"
                  :empty-text="accountEmptyText || undefined"
                  searchable
                  @update:model-value="row.payment_account_id = $event || ''"
                />
                <p v-if="showAccountHint && index === 0" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ accountHint }}
                </p>
              </div>

              <div class="xl:col-span-2">
                <label class="erp-label">{{ methodLabel }}</label>
                <AppSelect
                  :model-value="row.method || null"
                  :options="paymentMethodOptions"
                  :placeholder="methodPlaceholder || undefined"
                  @update:model-value="row.method = $event || 'cash'"
                />
              </div>

              <div class="xl:col-span-2">
                <label class="erp-label">{{ amountLabel }}</label>
                <input
                  v-model.number="row.amount"
                  type="number"
                  :min="amountMin"
                  :step="amountStep"
                  class="erp-input text-right"
                />
              </div>

              <div v-if="showPaymentDate" class="md:col-span-2 xl:col-span-3">
                <label class="erp-label">{{ paymentDateLabel }}</label>
                <AppDatePicker
                  :model-value="row.payment_date"
                  placeholder="Select date"
                  @update:model-value="row.payment_date = $event || ''"
                />
              </div>

              <div class="md:col-span-1 xl:col-span-5">
                <label class="erp-label">{{ referenceLabel }}</label>
                <input v-model="row.reference" type="text" class="erp-input" :placeholder="referencePlaceholder || undefined" />
              </div>

              <div v-if="showNote" class="md:col-span-1 xl:col-span-7">
                <label class="erp-label">{{ noteLabel }}</label>
                <textarea v-model="row.note" :rows="noteRows" class="erp-input min-h-[2.75rem]" :placeholder="notePlaceholder || undefined"></textarea>
              </div>
            </div>
          </article>
        </div>
      </div>

      <slot name="extra" />

      <div v-if="error" class="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
        {{ error }}
      </div>

      <div class="erp-form-actions flex-col-reverse gap-2 sm:flex-row">
        <button type="button" class="erp-button-secondary" :disabled="saving" @click="$emit('close')">
          {{ cancelLabel }}
        </button>
        <button type="button" class="erp-button-primary" :disabled="saving" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import { formatAccountingMoney } from '@/utils/accounting'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  icon: { type: String, default: 'payment' },
  size: { type: String, default: 'xl' },
  mobileFullScreen: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
  introTitle: { type: String, default: '' },
  introText: { type: String, default: '' },
  summaryLabel: { type: String, default: '' },
  summaryValue: { type: Number, default: 0 },
  form: { type: Object, required: true },
  payments: { type: Array, default: null },
  paymentAccountOptions: { type: Array, default: () => [] },
  paymentMethodOptions: { type: Array, default: () => [] },
  accountLabel: { type: String, default: 'Payment account' },
  methodLabel: { type: String, default: 'Payment method' },
  amountLabel: { type: String, default: 'Amount' },
  paymentDateLabel: { type: String, default: 'Payment date' },
  referenceLabel: { type: String, default: 'Reference' },
  noteLabel: { type: String, default: 'Note' },
  accountPlaceholder: { type: String, default: '' },
  accountSearchPlaceholder: { type: String, default: '' },
  accountEmptyText: { type: String, default: '' },
  methodPlaceholder: { type: String, default: '' },
  referencePlaceholder: { type: String, default: '' },
  notePlaceholder: { type: String, default: '' },
  accountHint: { type: String, default: '' },
  showAccountHint: { type: Boolean, default: false },
  showPaymentDate: { type: Boolean, default: true },
  showNote: { type: Boolean, default: true },
  noteRows: { type: Number, default: 3 },
  amountMin: { type: [Number, String], default: 0 },
  amountStep: { type: [Number, String], default: 0.01 },
  allowMultipleRows: { type: Boolean, default: false },
  cancelLabel: { type: String, default: 'Cancel' },
  confirmLabel: { type: String, default: 'Confirm' },
})

defineEmits(['close', 'confirm', 'add-row', 'remove-row'])

const { t } = useI18n()
const resolvedPayments = Array.isArray(props.payments) && props.payments.length
  ? props.payments
  : (props.form ? [props.form] : [])

</script>
