<template>
  <div class="space-y-6">
    <div
      v-if="validationMessage"
      class="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
    >
      {{ validationMessage }}
    </div>

    <section class="erp-form-page">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.branch') }}</label>
          <AppSelect
            :model-value="form.branch_id || null"
            :options="branchOptions"
            :placeholder="t('sales.documentModal.placeholders.selectBranch')"
            :search-placeholder="t('sales.documentModal.placeholders.searchBranches')"
            searchable
            @update:model-value="handleBranchChange"
          />
        </div>

        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.warehouse') }}</label>
          <AppSelect
            :model-value="form.warehouse_id || null"
            :options="warehouseSelectOptions"
            :placeholder="warehouseSelectOptions.length ? t('sales.documentModal.placeholders.selectWarehouse') : t('sales.documentModal.placeholders.selectBranchFirst')"
            :search-placeholder="t('sales.documentModal.placeholders.searchWarehouses')"
            :empty-text="t('sales.documentModal.placeholders.noWarehouses')"
            searchable
            :disabled="!form.branch_id"
            @update:model-value="form.warehouse_id = $event || ''"
          />
        </div>

        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.customer') }}</label>
          <AppSelect
            :model-value="form.customer_id || null"
            :options="customerOptions"
            :placeholder="t('sales.documentModal.placeholders.optionalCustomer')"
            :search-placeholder="t('sales.documentModal.placeholders.searchCustomers')"
            :empty-text="t('sales.documentModal.placeholders.noCustomers')"
            clearable
            searchable
            @update:model-value="form.customer_id = $event || ''"
          />
        </div>

        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.saleDate') }}</label>
          <AppDatePicker
            :model-value="form.sale_date"
            @update:model-value="form.sale_date = $event || ''"
          />
        </div>

        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.dueDate') }}</label>
          <AppDatePicker
            :model-value="form.due_date"
            @update:model-value="form.due_date = $event || ''"
          />
        </div>

        <div v-if="showRegisterSessionField" class="md:col-span-2 xl:col-span-3">
          <label class="erp-label">{{ t('sales.documentModal.fields.registerSession') }}</label>
          <AppSelect
            :model-value="form.cash_register_session_id || null"
            :options="registerSessionSelectOptions"
            :placeholder="registerSessionSelectOptions.length ? t('sales.documentModal.placeholders.selectRegisterSession') : t('sales.documentModal.placeholders.noOpenSessions')"
            :empty-text="t('sales.documentModal.placeholders.noOpenSessions')"
            searchable
            clearable
            @update:model-value="form.cash_register_session_id = $event || ''"
          />
        </div>
      </div>
    </section>

    <section class="erp-form-page space-y-4">
      <div>
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.itemsTitle') }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.itemsHint') }}
          </p>
        </div>
      </div>

      <InventoryProductLookup
        :warehouse-id="form.warehouse_id"
        :helper-text="form.warehouse_id ? t('sales.documentModal.lookupWithWarehouse') : t('sales.documentModal.lookupWithoutWarehouse')"
        :disabled="!form.warehouse_id"
        @select="handleLookupSelect"
      />

      <div
        v-if="form.items.length === 0"
        class="erp-empty-state mt-4 text-sm text-slate-500 dark:text-slate-400"
      >
        {{ t('sales.documentModal.emptyItems') }}
      </div>

      <div v-else class="mt-4 erp-table-shell">
        <div class="erp-table-header">
          <div>
            <h3 class="text-base font-semibold text-slate-950 dark:text-white">{{ t('sales.documentModal.itemsTitle') }}</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ form.items.length }} {{ t('sales.shared.labels.lines') }}
            </p>
          </div>

          <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div class="w-full sm:w-72">
              <SearchInput v-model="form.item_search" :placeholder="t('sales.documentModal.searchItems')" />
            </div>
          </div>
        </div>

        <div
          v-if="filteredItems.length === 0"
          class="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          {{ t('sales.documentModal.noMatchingItems') }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="erp-table min-w-[1120px]">
            <thead>
              <tr>
                <th class="w-[23%]">{{ t('sales.documentModal.fields.product') }}</th>
                <th class="w-[8%]">{{ t('sales.documentModal.fields.quantity') }}</th>
                <th class="w-[11%]">{{ t('sales.documentModal.fields.unitPrice') }}</th>
                <th class="w-[16%]">{{ t('sales.documentModal.fields.lineDiscount') }}</th>
                <th class="w-[16%]">{{ t('sales.documentModal.fields.tax') }}</th>
                <th class="w-[18%]">{{ t('sales.documentModal.fields.lineNote') }}</th>
                <th class="w-[8%]">{{ t('sales.documentModal.lineTotal') }}</th>
                <th class="w-[6%]">{{ t('sales.documentModal.fields.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.key">
                <td>
                  <div class="font-semibold text-slate-950 dark:text-white">
                    {{ item.product_name || productMeta(item.product_id)?.name || t('sales.shared.notRecorded') }}
                    <span v-if="item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation_name }}</span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span v-if="item.sku || productMeta(item.product_id)?.sku" class="erp-badge erp-badge-neutral px-2 text-[11px]">
                      SKU: {{ item.sku || productMeta(item.product_id)?.sku }}
                    </span>
                    <span class="erp-badge erp-badge-info px-2 text-[11px]">
                      {{ productMeta(item.product_id)?.type || t('sales.shared.notRecorded') }}
                    </span>
                    <span
                      v-for="lotNumber in item.lot_numbers"
                      :key="`${item.key}-lot-${lotNumber}`"
                      class="erp-badge erp-badge-warning px-2 text-[11px]"
                    >
                      Lot: {{ lotNumber }}
                    </span>
                    <span
                      v-for="serialNumber in item.serial_numbers"
                      :key="`${item.key}-serial-${serialNumber}`"
                      class="erp-badge erp-badge-info px-2 text-[11px]"
                    >
                      Serial: {{ serialNumber }}
                    </span>
                  </div>
                </td>
                <td>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="erp-input"
                    :disabled="item.serial_ids.length > 0"
                    @input="syncTrackedQuantity(item)"
                  />
                </td>
                <td>
                  <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="erp-input" />
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <AppSelect
                      :model-value="item.discount_type || null"
                      :options="discountTypeOptions"
                      :placeholder="t('sales.documentModal.placeholders.selectDiscountType')"
                      class="w-[8.5rem]"
                      clearable
                      @update:model-value="item.discount_type = $event || ''"
                    />
                    <input
                      v-model.number="item.discount_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="erp-input"
                      :placeholder="t('sales.documentModal.placeholders.enterDiscount')"
                    />
                  </div>
                </td>
                <td>
                  <div
                    v-if="form.tax_scope === 'line' && hasLineTax(item)"
                    class="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div class="font-medium text-slate-950 dark:text-white">
                      {{ lineTaxTitle(item) }}
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2 text-xs">
                      <span class="erp-badge erp-badge-info px-2">
                        {{ lineTaxRateLabel(item) }}
                      </span>
                      <span class="erp-badge erp-badge-neutral px-2">
                        {{ lineTaxTypeLabel(item) }}
                      </span>
                    </div>
                    <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {{ t('sales.documentModal.taxAmountHint', { amount: formatAccountingMoney(lineTaxAmount(item)) }) }}
                    </div>
                  </div>
                  <div
                    v-else-if="form.tax_scope === 'line'"
                    class="rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
                  >
                    {{ t('sales.documentModal.noTax') }}
                  </div>
                  <div
                    v-else
                    class="rounded-[16px] border border-dashed border-cyan-200 bg-cyan-50/70 px-3 py-3 text-sm text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/25 dark:text-cyan-200"
                  >
                    {{ t('sales.documentModal.documentTaxApplies') }}
                  </div>
                </td>
                <td>
                  <textarea v-model="item.notes" rows="2" class="erp-input min-h-[5rem]"></textarea>
                </td>
                <td>
                  <div class="font-semibold text-slate-950 dark:text-white">
                    {{ formatAccountingMoney(lineTotal(item)) }}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-200"
                    :disabled="form.items.length === 1"
                    :title="t('sales.documentModal.removeLine')"
                    :aria-label="t('sales.documentModal.removeLine')"
                    @click="removeItemByKey(item.key)"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <div class="erp-form-page">
        <label class="erp-label">{{ t('sales.documentModal.fields.notes') }}</label>
        <textarea v-model="form.notes" rows="3" class="erp-input min-h-[6rem]"></textarea>
      </div>

      <div class="erp-form-page">
        <label class="erp-label">{{ t('sales.documentModal.fields.staffNote') }}</label>
        <textarea v-model="form.staff_note" rows="3" class="erp-input min-h-[6rem]"></textarea>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1.25fr,0.75fr]">
      <div class="erp-form-page">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.pricingTitle') }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.pricingHint') }}
          </p>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label class="erp-label">{{ t('sales.documentModal.fields.taxMode') }}</label>
            <AppSelect
              :model-value="form.tax_scope || 'line'"
              :options="taxScopeOptions"
              @update:model-value="handleTaxScopeChange"
            />
          </div>

          <div>
            <label class="erp-label">{{ t('sales.documentModal.fields.orderDiscountType') }}</label>
            <AppSelect
              :model-value="form.discount_type || null"
              :options="discountTypeOptions"
              :placeholder="t('sales.documentModal.placeholders.selectDiscountType')"
              clearable
              @update:model-value="form.discount_type = $event || ''"
            />
          </div>

          <div>
            <label class="erp-label">{{ t('sales.documentModal.fields.orderDiscountAmount') }}</label>
            <input
              v-model.number="form.discount_amount"
              type="number"
              min="0"
              step="0.01"
              class="erp-input"
              :placeholder="t('sales.documentModal.placeholders.enterDiscount')"
            />
          </div>

          <div>
            <label class="erp-label">{{ t('sales.documentModal.fields.shippingCharges') }}</label>
            <input
              v-model.number="form.shipping_charges"
              type="number"
              min="0"
              step="0.01"
              class="erp-input"
              :placeholder="t('sales.documentModal.placeholders.enterShipping')"
            />
          </div>

          <div v-if="form.tax_scope === 'sale'">
            <label class="erp-label">{{ t('sales.documentModal.fields.saleTax') }}</label>
            <AppSelect
              :model-value="form.tax_rate_id || null"
              :options="saleTaxRateOptions"
              :placeholder="t('sales.documentModal.placeholders.selectSaleTax')"
              :search-placeholder="t('sales.documentModal.placeholders.searchTaxes')"
              :empty-text="t('sales.documentModal.placeholders.noTaxes')"
              searchable
              clearable
              @update:model-value="handleSaleTaxRateChange"
            />
          </div>

          <div v-if="form.tax_scope === 'sale'">
            <label class="erp-label">{{ t('sales.documentModal.fields.saleTaxType') }}</label>
            <AppSelect
              :model-value="form.tax_type || null"
              :options="taxTypeOptions"
              :placeholder="t('sales.documentModal.placeholders.selectSaleTaxType')"
              @update:model-value="form.tax_type = $event || 'exclusive'"
            />
          </div>
        </div>

        <div
          v-if="form.tax_scope === 'sale' && form.tax_rate_id"
          class="mt-4 rounded-[16px] border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/25 dark:text-cyan-200"
        >
          {{ t('sales.documentModal.saleTaxHint', {
            rate: saleTaxSummaryLabel,
            type: saleTaxTypeLabel,
          }) }}
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <article class="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div class="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.lines') }}</span>
              <span class="font-semibold text-slate-950 dark:text-white">{{ form.items.length }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.quantity') }}</span>
              <span class="font-semibold text-slate-950 dark:text-white">{{ totalQuantity }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.subtotal') }}</span>
              <span class="font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(subtotal) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.lineDiscounts') }}</span>
              <span class="font-semibold text-rose-600 dark:text-rose-300">-{{ formatAccountingMoney(lineDiscountTotal) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.orderDiscount') }}</span>
              <span class="font-semibold text-rose-600 dark:text-rose-300">-{{ formatAccountingMoney(orderDiscountAmount) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.tax') }}</span>
              <span class="font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(taxTotal) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.documentModal.summary.shipping') }}</span>
              <span class="font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(shippingCharges) }}</span>
            </div>
            <div class="border-t border-slate-200 pt-3 dark:border-slate-800">
              <div class="flex items-center justify-between gap-3">
                <span class="text-base font-semibold text-slate-950 dark:text-white">{{ t('sales.documentModal.summary.grandTotal') }}</span>
                <span class="text-2xl font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div v-if="props.mode === 'sale'" class="erp-form-page space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.footerTitle') }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.footerHint') }}
          </p>
        </div>
        <div class="erp-badge erp-badge-info px-3 py-2">
          {{ actionFlowLabel }}
        </div>
      </div>

      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-wrap gap-2">
          <button type="button" class="erp-button-secondary" :disabled="saving" @click="$emit('cancel')">
            {{ cancelLabel || t('sales.shared.actions.cancel') }}
          </button>
          <button type="button" class="erp-button-secondary" :disabled="saving" @click="submitWithAction('draft')">
            <i class="fa-regular fa-floppy-disk"></i>
            {{ t('sales.shared.actions.saveDraft') }}
          </button>
          <button type="button" class="erp-button-secondary" :disabled="saving" @click="submitWithAction('quotation')">
            <i class="fa-regular fa-file-lines"></i>
            {{ t('sales.shared.actions.saveQuotation') }}
          </button>
          <button type="button" class="erp-button-secondary" :disabled="saving" @click="submitWithAction('suspended')">
            <i class="fa-solid fa-pause"></i>
            {{ t('sales.shared.actions.suspendSale') }}
          </button>
        </div>

        <div class="flex flex-wrap gap-2 xl:justify-end">
          <button type="button" class="erp-button-primary" :disabled="saving" @click="submitWithAction('save')">
            <span
              v-if="saving"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
            ></span>
            <i v-else class="fa-solid fa-file-circle-plus"></i>
            {{ saveActionLabel }}
          </button>
          <button type="button" class="erp-button-primary" :disabled="saving" @click="submitWithAction('finalize')">
            <span
              v-if="saving"
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
            ></span>
            <i v-else class="fa-solid fa-circle-check"></i>
            {{ finalizeActionLabel }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="erp-form-actions">
      <button type="button" class="erp-button-secondary" :disabled="saving" @click="$emit('cancel')">
        {{ cancelLabel || t('sales.shared.actions.cancel') }}
      </button>
      <button type="button" class="erp-button-primary" :disabled="saving" @click="submit">
        <span
          v-if="saving"
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
        ></span>
        {{ submitLabel || defaultSubmitLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import SearchInput from '@components/ui/SearchInput.vue'
import { formatAccountingMoney } from '@/utils/accounting'

const props = defineProps({
  show: { type: Boolean, default: true },
  mode: { type: String, default: 'sale' },
  isEditing: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  defaultType: { type: String, default: 'invoice' },
  documentTypeOptions: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  warehouses: { type: Array, default: () => [] },
  customers: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  registerSessions: { type: Array, default: () => [] },
  taxRates: { type: Array, default: () => [] },
  initialValues: { type: Object, default: null },
  submitLabel: { type: String, default: '' },
  cancelLabel: { type: String, default: '' },
  externalError: { type: String, default: '' },
})

const emit = defineEmits(['cancel', 'submit'])
const { t } = useI18n()

const attemptedSubmit = ref(false)
const pendingAction = ref('save')

const makeItem = () => ({
  key: crypto.randomUUID(),
  product_id: '',
  variation_id: '',
  lot_allocations: [],
  serial_ids: [],
  quantity: 1,
  unit_price: 0,
  discount_type: '',
  discount_amount: 0,
  tax_rate_id: '',
  tax_rate_name: '',
  tax_rate_type: '',
  tax_type: '',
  tax_rate: 0,
  unit_cost: 0,
  product_name: '',
  variation_name: '',
  sku: '',
  lot_numbers: [],
  serial_numbers: [],
  notes: '',
})

const today = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  branch_id: '',
  warehouse_id: '',
  customer_id: '',
  type: props.defaultType,
  sale_date: today(),
  due_date: '',
  cash_register_session_id: '',
  discount_type: '',
  discount_amount: 0,
  tax_scope: 'line',
  tax_rate_id: '',
  tax_rate_type: '',
  tax_rate: 0,
  tax_type: 'exclusive',
  shipping_charges: 0,
  notes: '',
  staff_note: '',
  item_search: '',
  items: [],
})

const branchOptions = computed(() =>
  props.branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  }))
)

const warehouseSelectOptions = computed(() =>
  props.warehouses
    .filter((warehouse) => !form.branch_id || warehouse.branch_id === form.branch_id)
    .map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
      description: warehouse.branch?.name || warehouse.code || '',
    }))
)

const customerOptions = computed(() =>
  props.customers.map((customer) => ({
    value: customer.id,
    label: customer.name,
    description: customer.phone || customer.code || '',
  }))
)

const registerSessionSelectOptions = computed(() =>
  props.registerSessions
    .filter((session) => !form.branch_id || session.branch_id === form.branch_id)
    .map((session) => ({
      value: session.id,
      label: session.label,
      description: session.description || '',
    }))
)

const primaryDocumentType = computed(() => {
  if (props.mode === 'quotation') {
    return 'quotation'
  }

  if (props.initialValues?.type === 'pos_sale' || props.defaultType === 'pos_sale') {
    return 'pos_sale'
  }

  return 'invoice'
})

const showRegisterSessionField = computed(() => props.mode === 'sale' && primaryDocumentType.value === 'pos_sale')
const resolvedTypeForAction = (action = pendingAction.value) => {
  if (props.mode === 'quotation') return 'quotation'
  if (action === 'draft') return 'draft'
  if (action === 'quotation') return 'quotation'
  if (action === 'suspended') return 'suspended'
  return form.type === 'quotation' ? 'quotation' : primaryDocumentType.value
}

const requiresRegisterSessionForAction = computed(() =>
  props.mode === 'sale' && resolvedTypeForAction() === 'pos_sale'
)

const productMap = computed(() =>
  new Map(props.products.map((product) => [product.id, product]))
)

const discountTypeOptions = computed(() => [
  { value: 'fixed', label: t('sales.documentModal.discountTypes.fixed') },
  { value: 'percentage', label: t('sales.documentModal.discountTypes.percentage') },
])

const taxScopeOptions = computed(() => [
  { value: 'line', label: t('sales.documentModal.taxScopes.line') },
  { value: 'sale', label: t('sales.documentModal.taxScopes.sale') },
])

const taxTypeOptions = computed(() => [
  { value: 'exclusive', label: t('sales.documentModal.taxTypes.exclusive') },
  { value: 'inclusive', label: t('sales.documentModal.taxTypes.inclusive') },
])

const subtotal = computed(() =>
  form.items.reduce((carry, item) => carry + lineBaseAmount(item), 0)
)

const totalQuantity = computed(() =>
  form.items.reduce((carry, item) => carry + Number(item.quantity || 0), 0)
)

const resolveDiscountAmount = (discountType, discountAmount, baseAmount) => {
  const base = Number(baseAmount || 0)
  const amount = Number(discountAmount || 0)

  if (base <= 0 || amount <= 0) {
    return 0
  }

  if (discountType === 'percentage') {
    return Math.min(base, (base * amount) / 100)
  }

  return Math.min(base, amount)
}

const lineDiscountAmount = (item) => resolveDiscountAmount(item.discount_type, item.discount_amount, lineGross(item))

const lineGross = (item) => Number(item.quantity || 0) * Number(item.unit_price || 0)

const lineTaxable = (item) => Math.max(0, lineGross(item) - lineDiscountAmount(item))

const lineBaseAmount = (item) => {
  const grossAfterDiscount = lineTaxable(item)
  const rate = Number(item.tax_rate || 0)

  if (grossAfterDiscount <= 0 || rate <= 0) {
    return grossAfterDiscount
  }

  if (item.tax_rate_type === 'fixed') {
    return item.tax_type === 'inclusive'
      ? Math.max(0, grossAfterDiscount - Math.min(grossAfterDiscount, rate))
      : grossAfterDiscount
  }

  if (item.tax_type === 'inclusive') {
    const taxAmount = grossAfterDiscount - (grossAfterDiscount / (1 + rate / 100))
    return Math.max(0, grossAfterDiscount - taxAmount)
  }

  return grossAfterDiscount
}

const lineTaxAmount = (item) => {
  const grossAfterDiscount = lineTaxable(item)
  const rate = Number(item.tax_rate || 0)

  if (grossAfterDiscount <= 0 || rate <= 0) {
    return 0
  }

  if (item.tax_rate_type === 'fixed') {
    return Math.min(grossAfterDiscount, rate)
  }

  if (item.tax_type === 'inclusive') {
    return grossAfterDiscount - (grossAfterDiscount / (1 + rate / 100))
  }

  return grossAfterDiscount * (rate / 100)
}

const lineNetTotal = (item) => {
  const grossAfterDiscount = lineTaxable(item)

  if (item.tax_type === 'inclusive') {
    return grossAfterDiscount
  }

  return grossAfterDiscount + lineTaxAmount(item)
}

const lineDiscountTotal = computed(() =>
  form.items.reduce((carry, item) => carry + lineDiscountAmount(item), 0)
)

const orderDiscountBase = computed(() => subtotal.value)

const orderDiscountAmount = computed(() =>
  resolveDiscountAmount(form.discount_type, form.discount_amount, orderDiscountBase.value)
)

const saleTaxRateOptions = computed(() =>
  props.taxRates.map((taxRate) => ({
    value: taxRate.id,
    label: taxRate.name,
    description: taxRate.type === 'fixed'
      ? `${t('sales.documentModal.taxRateTypes.fixed')} • ${formatAccountingMoney(Number(taxRate.rate || 0))}`
      : `${t('sales.documentModal.taxRateTypes.percentage')} • ${Number(taxRate.rate || 0).toFixed(2)}%`,
  }))
)

const saleTaxSummaryLabel = computed(() => {
  const rate = Number(form.tax_rate || 0)
  return form.tax_rate_type === 'fixed'
    ? formatAccountingMoney(rate)
    : `${rate.toFixed(2)}%`
})

const saleTaxTypeLabel = computed(() =>
  form.tax_type === 'inclusive'
    ? t('sales.documentModal.taxTypes.inclusive')
    : t('sales.documentModal.taxTypes.exclusive')
)

const taxTotal = computed(() =>
  form.tax_scope === 'sale'
    ? documentTaxAmount.value
    : form.items.reduce((carry, item) => carry + lineTaxAmount(item), 0)
)

const shippingCharges = computed(() => Number(form.shipping_charges || 0))

const documentTaxAmount = computed(() => {
  const grossAfterOrderDiscount = Math.max(0, subtotal.value - orderDiscountAmount.value)
  const rate = Number(form.tax_rate || 0)

  if (grossAfterOrderDiscount <= 0 || rate <= 0 || form.tax_scope !== 'sale') {
    return 0
  }

  if (form.tax_rate_type === 'fixed') {
    return Math.min(grossAfterOrderDiscount, rate)
  }

  if (form.tax_type === 'inclusive') {
    return grossAfterOrderDiscount - (grossAfterOrderDiscount / (1 + rate / 100))
  }

  return grossAfterOrderDiscount * (rate / 100)
})

const grandTotal = computed(() =>
  Math.max(0, subtotal.value - orderDiscountAmount.value) + taxTotal.value + shippingCharges.value
)

const defaultSubmitLabel = computed(() =>
  props.mode === 'quotation'
    ? (props.isEditing ? t('sales.documentModal.updateQuotation') : t('sales.documentModal.createQuotation'))
    : (props.isEditing ? t('sales.documentModal.updateSale') : t('sales.documentModal.createSale'))
)

const actionFlowLabel = computed(() => {
  if (form.type === 'quotation') {
    return t('sales.shared.types.quotation')
  }

  if (primaryDocumentType.value === 'pos_sale') {
    return t('sales.shared.types.pos_sale')
  }

  return t('sales.shared.types.invoice')
})

const saveActionLabel = computed(() => {
  if (props.isEditing) {
    if (form.type === 'quotation') return t('sales.documentModal.updateQuotation')
    return t('sales.shared.actions.updateSale')
  }

  if (form.type === 'quotation') return t('sales.documentModal.createQuotation')
  return t('sales.shared.actions.saveSale')
})

const finalizeActionLabel = computed(() => {
  if (props.isEditing) {
    return t('sales.shared.actions.updateAndFinalizeSale')
  }

  return t('sales.shared.actions.finalizeSale')
})

const validationMessage = computed(() => {
  if (props.externalError) {
    return props.externalError
  }

  if (!attemptedSubmit.value) {
    return ''
  }

  if (!form.branch_id || !form.warehouse_id || !form.sale_date) {
    return t('sales.documentModal.validation.missingHeader')
  }

  if (requiresRegisterSessionForAction.value && !form.cash_register_session_id) {
    return t('sales.documentModal.validation.missingRegisterSession')
  }

  const normalizedItems = getNormalizedItems()

  if (!normalizedItems.length || normalizedItems.some((item) => item.unit_price < 0 || item.unit_cost < 0)) {
    return t('sales.documentModal.validation.invalidItems')
  }

  return ''
})

const filteredItems = computed(() => {
  const term = form.item_search.trim().toLowerCase()

  if (!term) {
    return form.items
  }

  return form.items.filter((item) => {
    const product = productMap.value.get(item.product_id)
    const haystack = [
      item.product_name,
      item.variation_name,
      product?.name,
      product?.sku,
      product?.type,
      item.sku,
      ...item.lot_numbers,
      ...item.serial_numbers,
      item.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

const resetForm = () => {
  const initialItems = Array.isArray(props.initialValues?.items) && props.initialValues.items.length
    ? props.initialValues.items.map((item) => ({
      key: crypto.randomUUID(),
      product_id: item.product_id || '',
      variation_id: item.variation_id || '',
      lot_allocations: Array.isArray(item.lot_allocations)
        ? item.lot_allocations.map((allocation) => ({
          lot_id: allocation.lot_id || '',
          quantity: Number(allocation.quantity || 0),
        }))
        : [],
      serial_ids: Array.isArray(item.serial_ids) ? [...item.serial_ids] : [],
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      discount_type: item.discount_type || '',
      discount_amount: Number(item.discount_amount || 0),
      tax_rate_id: item.tax_rate_id || '',
      tax_rate_name: item.tax_rate_record?.name || item.tax_rate_name || '',
      tax_rate_type: item.tax_rate_type || item.tax_rate_record?.type || '',
      tax_type: item.tax_type || '',
      tax_rate: Number(item.tax_rate || 0),
      unit_cost: Number(item.unit_cost || 0),
      product_name: item.product_name || '',
      variation_name: item.variation_name || '',
      sku: item.sku || '',
      lot_numbers: Array.isArray(item.lot_numbers) ? [...item.lot_numbers] : [],
      serial_numbers: Array.isArray(item.serial_numbers) ? [...item.serial_numbers] : [],
      notes: item.notes || '',
    }))
    : []

  form.branch_id = props.initialValues?.branch_id || ''
  form.warehouse_id = props.initialValues?.warehouse_id || ''
  form.customer_id = props.initialValues?.customer_id || ''
  form.type = props.mode === 'quotation' ? 'quotation' : (props.initialValues?.type || primaryDocumentType.value)
  form.sale_date = props.initialValues?.sale_date || today()
  form.due_date = props.initialValues?.due_date || ''
  form.cash_register_session_id = props.initialValues?.cash_register_session_id || ''
  form.discount_type = props.initialValues?.discount_type || ''
  form.discount_amount = Number(props.initialValues?.discount_amount || 0)
  form.tax_scope = props.initialValues?.tax_scope || 'line'
  form.tax_rate_id = props.initialValues?.tax_rate_id || ''
  form.tax_rate_type = props.initialValues?.tax_rate_type || props.initialValues?.tax_rate_record?.type || ''
  form.tax_rate = Number(props.initialValues?.tax_rate || props.initialValues?.tax_rate_record?.rate || 0)
  form.tax_type = props.initialValues?.tax_type || 'exclusive'
  form.shipping_charges = Number(props.initialValues?.shipping_charges || 0)
  form.notes = props.initialValues?.notes || ''
  form.staff_note = props.initialValues?.staff_note || ''
  form.item_search = ''
  form.items = initialItems
  attemptedSubmit.value = false
  pendingAction.value = 'save'
}

watch(
  () => [props.show, props.defaultType, props.mode, props.initialValues, primaryDocumentType.value],
  ([show]) => {
    if (show) {
      resetForm()
    }
  },
  { immediate: true }
)

const lineTotal = (item) => lineNetTotal(item)

const handleBranchChange = (value) => {
  form.branch_id = value || ''

  if (!props.warehouses.some((warehouse) => warehouse.id === form.warehouse_id && warehouse.branch_id === form.branch_id)) {
    form.warehouse_id = ''
  }

  if (!props.registerSessions.some((session) => session.id === form.cash_register_session_id && session.branch_id === form.branch_id)) {
    form.cash_register_session_id = ''
  }
}

const handleTaxScopeChange = (value) => {
  form.tax_scope = value || 'line'

  if (form.tax_scope !== 'sale') {
    form.tax_rate_id = ''
    form.tax_rate_type = ''
    form.tax_rate = 0
    form.tax_type = 'exclusive'
  }
}

const handleSaleTaxRateChange = (value) => {
  form.tax_rate_id = value || ''

  const selected = props.taxRates.find((taxRate) => taxRate.id === form.tax_rate_id)

  if (!selected) {
    form.tax_rate_type = ''
    form.tax_rate = 0
    return
  }

  form.tax_rate_type = selected.type || 'percentage'
  form.tax_rate = Number(selected.rate || 0)
}

const removeLine = (index) => {
  if (form.items.length === 1) {
    return
  }

  form.items.splice(index, 1)
}

const removeItemByKey = (key) => {
  const index = form.items.findIndex((item) => item.key === key)

  if (index === -1) {
    return
  }

  removeLine(index)
}

const productMeta = (productId) => productMap.value.get(productId) || null

const deriveSellingPrice = (productId) => {
  const product = productMap.value.get(productId)

  if (!product) {
    return 0
  }

  const sellingPrice = Number(
    product.selling_price
    ?? product.sub_unit_selling_price
    ?? product.variable_selling_price_min
    ?? 0
  )

  return Number.isFinite(sellingPrice) ? sellingPrice : 0
}

const deriveTaxType = (productId) => {
  const product = productMap.value.get(productId)
  return product?.tax_type || 'exclusive'
}

const deriveTaxRateId = (productId) => {
  const product = productMap.value.get(productId)
  return product?.tax_rate?.id || product?.tax_rate_id || ''
}

const deriveTaxRateName = (productId) => {
  const product = productMap.value.get(productId)
  return product?.tax_rate?.name || ''
}

const deriveTaxRateType = (productId) => {
  const product = productMap.value.get(productId)
  return product?.tax_rate?.type || ''
}

const deriveTaxRate = (productId) => {
  const product = productMap.value.get(productId)
  const rate = Number(product?.tax_rate?.rate ?? product?.tax_rate ?? 0)
  return Number.isFinite(rate) ? rate : 0
}

const hasLineTax = (item) => Number(item.tax_rate || 0) > 0

const lineTaxTitle = (item) => item.tax_rate_name || t('sales.documentModal.defaultTaxLabel')

const lineTaxRateLabel = (item) => {
  const rate = Number(item.tax_rate || 0)

  if (item.tax_rate_type === 'fixed') {
    return `${t('sales.documentModal.taxRateTypes.fixed')}: ${formatAccountingMoney(rate)}`
  }

  return `${t('sales.documentModal.taxRateTypes.percentage')}: ${rate.toFixed(2)}%`
}

const lineTaxTypeLabel = (item) =>
  item.tax_type === 'inclusive'
    ? t('sales.documentModal.taxTypes.inclusive')
    : t('sales.documentModal.taxTypes.exclusive')

const syncTrackedQuantity = (item) => {
  if (item.serial_ids.length > 0) {
    item.quantity = item.serial_ids.length
    return
  }

  if (item.lot_allocations.length === 1) {
    item.lot_allocations[0].quantity = Number(item.quantity || 0)
  }
}

const isSameLookupItem = (item, match) =>
  item.product_id === match.product_id &&
  (item.variation_id || '') === (match.variation_id || '') &&
  (item.lot_allocations[0]?.lot_id || '') === (match.lot_id || '') &&
  (match.serial_id ? item.serial_ids.length > 0 : item.serial_ids.length === 0)

const handleLookupSelect = (match) => {
  const existing = form.items.find((item) => isSameLookupItem(item, match))

  if (existing) {
    if (match.serial_id) {
      if (!existing.serial_ids.includes(match.serial_id)) {
        existing.serial_ids.push(match.serial_id)
        if (match.serial_number && !existing.serial_numbers.includes(match.serial_number)) {
          existing.serial_numbers.push(match.serial_number)
        }
        existing.quantity = existing.serial_ids.length
      }
    } else {
      existing.quantity = Number(existing.quantity || 0) + 1

      if (match.lot_id && existing.lot_allocations.length === 1) {
        existing.lot_allocations[0].quantity = Number(existing.quantity || 0)
      }
    }

    if (!Number(existing.unit_cost || 0) && match.unit_cost) {
      existing.unit_cost = Number(match.unit_cost)
    }

    if (!existing.tax_rate_id) {
      existing.tax_rate_id = deriveTaxRateId(match.product_id)
      existing.tax_rate_name = deriveTaxRateName(match.product_id)
      existing.tax_rate_type = deriveTaxRateType(match.product_id)
      existing.tax_type = deriveTaxType(match.product_id)
      existing.tax_rate = deriveTaxRate(match.product_id)
    }

    return
  }

  form.items.push({
    ...makeItem(),
    product_id: match.product_id,
    variation_id: match.variation_id || '',
    lot_allocations: match.lot_id ? [{ lot_id: match.lot_id, quantity: 1 }] : [],
    serial_ids: match.serial_id ? [match.serial_id] : [],
    quantity: 1,
    unit_price: deriveSellingPrice(match.product_id),
    discount_type: '',
    discount_amount: 0,
    tax_rate_id: deriveTaxRateId(match.product_id),
    tax_rate_name: deriveTaxRateName(match.product_id),
    tax_rate_type: deriveTaxRateType(match.product_id),
    tax_type: deriveTaxType(match.product_id),
    tax_rate: deriveTaxRate(match.product_id),
    unit_cost: Number(match.unit_cost || 0),
    product_name: match.product_name || '',
    variation_name: match.variation_name || '',
    sku: match.sku || '',
    lot_numbers: match.lot_number ? [match.lot_number] : [],
    serial_numbers: match.serial_number ? [match.serial_number] : [],
  })
}

const getNormalizedItems = () => form.items
  .map((item) => ({
    product_id: item.product_id,
    variation_id: item.variation_id || null,
    quantity: Number(item.quantity || 0),
    unit_price: Number(item.unit_price || 0),
    discount_type: item.discount_type || null,
    discount_amount: Number(item.discount_amount || 0),
    tax_rate_id: item.tax_rate_id || null,
    tax_rate_type: item.tax_rate_type || null,
    tax_type: item.tax_type || null,
    tax_rate: Number(item.tax_rate || 0),
    unit_cost: Number(item.unit_cost || 0),
    lot_allocations: item.lot_allocations.length
      ? item.lot_allocations.map((allocation) => ({
        lot_id: allocation.lot_id,
        quantity: Number(allocation.quantity || 0),
      }))
      : undefined,
    serial_ids: item.serial_ids.length ? item.serial_ids : undefined,
    notes: item.notes?.trim() || null,
  }))
  .filter((item) => item.product_id && item.quantity > 0)

const buildPayload = (action = 'save') => {
  attemptedSubmit.value = true

  if (validationMessage.value) {
    return null
  }

  const type = resolvedTypeForAction(action)

  return {
    branch_id: form.branch_id,
    warehouse_id: form.warehouse_id,
    customer_id: form.customer_id || null,
    type,
    sale_date: form.sale_date,
    due_date: form.due_date || null,
    cash_register_session_id: showRegisterSessionField.value ? form.cash_register_session_id || null : null,
    discount_type: form.discount_type || null,
    discount_amount: Number(form.discount_amount || 0),
    tax_scope: form.tax_scope || 'line',
    tax_rate_id: form.tax_scope === 'sale' ? (form.tax_rate_id || null) : null,
    tax_rate_type: form.tax_scope === 'sale' ? (form.tax_rate_type || null) : null,
    tax_rate: form.tax_scope === 'sale' ? Number(form.tax_rate || 0) : 0,
    tax_type: form.tax_scope === 'sale' ? (form.tax_type || null) : null,
    shipping_charges: Number(form.shipping_charges || 0),
    notes: form.notes?.trim() || null,
    staff_note: form.staff_note?.trim() || null,
    items: getNormalizedItems(),
    ui_action: action,
  }
}

const submit = () => {
  pendingAction.value = 'save'
  const payload = buildPayload('save')

  if (!payload) {
    return
  }

  emit('submit', payload)
}

const submitWithAction = (action) => {
  pendingAction.value = action
  const payload = buildPayload(action)

  if (!payload) {
    return
  }

  emit('submit', payload)
}
</script>
