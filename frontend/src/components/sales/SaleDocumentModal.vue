<template>
  <AppModal
    :show="show"
    :title="mode === 'quotation' ? t('sales.documentModal.quotationTitle') : t('sales.documentModal.saleTitle')"
    :icon="mode === 'quotation' ? t('sales.documentModal.quotationIcon') : t('sales.documentModal.saleIcon')"
    size="xl"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <div
        v-if="validationMessage"
        class="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
      >
        {{ validationMessage }}
      </div>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

        <div v-if="mode === 'sale'">
          <label class="erp-label">{{ t('sales.documentModal.fields.type') }}</label>
          <AppSelect
            :model-value="form.type || null"
            :options="documentTypeOptions"
            :placeholder="t('sales.documentModal.placeholders.selectType')"
            @update:model-value="handleTypeChange"
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
      </section>

      <section class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {{ t('sales.documentModal.itemsTitle') }}
            </h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ t('sales.documentModal.itemsHint') }}
            </p>
          </div>
          <button type="button" class="erp-button-secondary" @click="addLine">
            <i class="fa-solid fa-plus"></i>
            {{ t('sales.documentModal.addLine') }}
          </button>
        </div>

        <div class="space-y-4">
          <article
            v-for="(item, index) in form.items"
            :key="item.key"
            class="rounded-[24px] border border-slate-200 bg-white/70 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/35"
          >
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr,0.8fr,0.9fr,0.9fr]">
              <div class="md:col-span-2 xl:col-span-1">
                <label class="erp-label">{{ t('sales.documentModal.fields.product') }}</label>
                <AppSelect
                  :model-value="item.product_id || null"
                  :options="productSelectOptions"
                  :placeholder="t('sales.documentModal.placeholders.selectProduct')"
                  :search-placeholder="t('sales.documentModal.placeholders.searchProducts')"
                  :empty-text="t('sales.documentModal.placeholders.noProducts')"
                  searchable
                  @update:model-value="handleProductChange(index, $event || '')"
                />
              </div>

              <div>
                <label class="erp-label">{{ t('sales.documentModal.fields.quantity') }}</label>
                <input v-model.number="item.quantity" type="number" min="0.01" step="0.01" class="erp-input" />
              </div>

              <div>
                <label class="erp-label">{{ t('sales.documentModal.fields.unitPrice') }}</label>
                <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="erp-input" />
              </div>

              <div>
                <label class="erp-label">{{ t('sales.documentModal.fields.unitCost') }}</label>
                <input v-model.number="item.unit_cost" type="number" min="0" step="0.01" class="erp-input" />
              </div>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-[1fr,auto]">
              <div>
                <label class="erp-label">{{ t('sales.documentModal.fields.lineNote') }}</label>
                <textarea v-model="item.notes" rows="2" class="erp-input min-h-[5rem]"></textarea>
              </div>

              <div class="flex min-w-[12rem] flex-col justify-between rounded-[18px] bg-slate-100/80 px-4 py-3 dark:bg-slate-900/80">
                <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {{ t('sales.documentModal.lineTotal') }}
                </div>
                <div class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                  {{ formatAccountingMoney(lineTotal(item)) }}
                </div>
                <button
                  type="button"
                  class="mt-4 text-left text-sm font-medium text-rose-600 transition hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                  :disabled="form.items.length === 1"
                  @click="removeLine(index)"
                >
                  {{ t('sales.documentModal.removeLine') }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.notes') }}</label>
          <textarea v-model="form.notes" rows="3" class="erp-input min-h-[6rem]"></textarea>
        </div>

        <div>
          <label class="erp-label">{{ t('sales.documentModal.fields.staffNote') }}</label>
          <textarea v-model="form.staff_note" rows="3" class="erp-input min-h-[6rem]"></textarea>
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <article class="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.summary.lines') }}
          </div>
          <div class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{{ form.items.length }}</div>
        </article>

        <article class="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.summary.quantity') }}
          </div>
          <div class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{{ totalQuantity }}</div>
        </article>

        <article class="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {{ t('sales.documentModal.summary.subtotal') }}
          </div>
          <div class="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(subtotal) }}</div>
        </article>
      </section>

      <div class="erp-form-actions">
        <button type="button" class="erp-button-secondary" :disabled="saving" @click="$emit('close')">
          {{ t('sales.shared.actions.cancel') }}
        </button>
        <button type="button" class="erp-button-primary" :disabled="saving" @click="submit">
          <span
            v-if="saving"
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
          ></span>
          {{ mode === 'quotation' ? t('sales.documentModal.createQuotation') : t('sales.documentModal.createSale') }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import { formatAccountingMoney } from '@/utils/accounting'

const props = defineProps({
  show: { type: Boolean, default: false },
  mode: { type: String, default: 'sale' },
  saving: { type: Boolean, default: false },
  defaultType: { type: String, default: 'invoice' },
  documentTypeOptions: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  warehouses: { type: Array, default: () => [] },
  customers: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  registerSessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'submit'])
const { t } = useI18n()

const makeItem = () => ({
  key: crypto.randomUUID(),
  product_id: '',
  quantity: 1,
  unit_price: 0,
  unit_cost: 0,
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
  notes: '',
  staff_note: '',
  items: [makeItem()],
})

const validationMessage = computed(() => {
  if (!props.show) {
    return ''
  }

  return ''
})

const resetForm = () => {
  form.branch_id = ''
  form.warehouse_id = ''
  form.customer_id = ''
  form.type = props.mode === 'quotation' ? 'quotation' : props.defaultType
  form.sale_date = today()
  form.due_date = ''
  form.cash_register_session_id = ''
  form.notes = ''
  form.staff_note = ''
  form.items = [makeItem()]
}

watch(
  () => [props.show, props.defaultType, props.mode],
  ([show]) => {
    if (show) {
      resetForm()
    }
  }
)

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

const productSelectOptions = computed(() =>
  props.products.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.sku || product.type || '',
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

const showRegisterSessionField = computed(() => props.mode === 'sale' && form.type === 'pos_sale')

const subtotal = computed(() =>
  form.items.reduce((carry, item) => carry + lineTotal(item), 0)
)

const totalQuantity = computed(() =>
  form.items.reduce((carry, item) => carry + Number(item.quantity || 0), 0)
)

const lineTotal = (item) => Number(item.quantity || 0) * Number(item.unit_price || 0)

const handleBranchChange = (value) => {
  form.branch_id = value || ''

  if (!props.warehouses.some((warehouse) => warehouse.id === form.warehouse_id && warehouse.branch_id === form.branch_id)) {
    form.warehouse_id = ''
  }

  if (!props.registerSessions.some((session) => session.id === form.cash_register_session_id && session.branch_id === form.branch_id)) {
    form.cash_register_session_id = ''
  }
}

const handleTypeChange = (value) => {
  form.type = value || props.defaultType

  if (form.type !== 'pos_sale') {
    form.cash_register_session_id = ''
  }
}

const handleProductChange = (index, productId) => {
  const item = form.items[index]
  item.product_id = productId

  const product = props.products.find((entry) => entry.id === productId)

  if (!product) {
    return
  }

  const sellingPrice = Number(
    product.selling_price
    ?? product.sub_unit_selling_price
    ?? product.variable_selling_price_min
    ?? 0
  )
  const purchasePrice = Number(
    product.purchase_price
    ?? product.sub_unit_purchase_price
    ?? product.variable_purchase_price_min
    ?? 0
  )

  item.unit_price = Number.isFinite(sellingPrice) ? sellingPrice : 0
  item.unit_cost = Number.isFinite(purchasePrice) ? purchasePrice : 0
}

const addLine = () => {
  form.items.push(makeItem())
}

const removeLine = (index) => {
  if (form.items.length === 1) {
    return
  }

  form.items.splice(index, 1)
}

const submit = () => {
  if (!form.branch_id || !form.warehouse_id || !form.sale_date) {
    return emit('submit', { error: t('sales.documentModal.validation.missingHeader') })
  }

  if (showRegisterSessionField.value && !form.cash_register_session_id) {
    return emit('submit', { error: t('sales.documentModal.validation.missingRegisterSession') })
  }

  const normalizedItems = form.items
    .map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      unit_cost: Number(item.unit_cost || 0),
      notes: item.notes?.trim() || null,
    }))
    .filter((item) => item.product_id && item.quantity > 0)

  if (!normalizedItems.length || normalizedItems.some((item) => item.unit_price < 0 || item.unit_cost < 0)) {
    return emit('submit', { error: t('sales.documentModal.validation.invalidItems') })
  }

  emit('submit', {
    branch_id: form.branch_id,
    warehouse_id: form.warehouse_id,
    customer_id: form.customer_id || null,
    type: props.mode === 'quotation' ? 'quotation' : form.type,
    sale_date: form.sale_date,
    due_date: form.due_date || null,
    cash_register_session_id: showRegisterSessionField.value ? form.cash_register_session_id || null : null,
    notes: form.notes?.trim() || null,
    staff_note: form.staff_note?.trim() || null,
    items: normalizedItems,
  })
}
</script>
