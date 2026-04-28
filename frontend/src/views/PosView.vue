<template>
  <div class="pos-terminal min-h-screen">
    <header class="pos-terminal-header">
      <div class="pos-header-copy min-w-0">
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
          <RouterLink to="/dashboard" class="transition hover:text-cyan-600 dark:hover:text-cyan-300">
            {{ t('layout.nav.dashboard.label') }}
          </RouterLink>
          <span>/</span>
          <RouterLink to="/sales" class="transition hover:text-cyan-600 dark:hover:text-cyan-300">
            {{ t('layout.nav.sales.label') }}
          </RouterLink>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold text-slate-950 dark:text-white">
            {{ t('sales.posPage.title') }}
          </h1>
          <span class="erp-badge gap-2 px-3" :class="form.cash_register_session_id ? 'erp-badge-success' : 'erp-badge-warning'">
            <i class="fa-solid fa-cash-register"></i>
            {{ form.cash_register_session_id ? t('sales.posPage.registerReady') : t('sales.posPage.noRegister') }}
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ t('sales.posPage.subtitle') }}
        </p>
      </div>

      <div class="pos-header-actions flex shrink-0 flex-wrap items-center gap-2">
        <button type="button" class="pos-terminal-icon-button" :title="t('sales.posPage.actions.clearCart')" :disabled="!cart.length" @click="clearCart">
          <i class="fa-solid fa-broom"></i>
        </button>
        <RouterLink to="/sales/registers" class="pos-terminal-button">
          <i class="fa-solid fa-cash-register"></i>
          <span>{{ t('layout.nav.cashRegisters.label') }}</span>
        </RouterLink>
        <button type="button" class="pos-terminal-button" @click="exitPos">
          <i class="fa-solid fa-up-right-from-square"></i>
          <span>{{ t('sales.posPage.actions.exit') }}</span>
        </button>
      </div>
    </header>

    <main class="w-full space-y-4 px-3 py-3 sm:px-4 sm:py-4 xl:px-5">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <PageBlurSkeleton v-if="loading" variant="form" />

      <template v-else>
        <section class="pos-workspace">
          <div class="pos-sale-side">
            <div class="pos-panel pos-sale-panel">
              <div class="pos-section-heading">
                <div>
                  <h2 class="pos-section-title">Sale Setup</h2>
                  <p class="pos-section-copy">Choose the active branch, stock location, register, and customer before scanning items.</p>
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[0.95fr,0.95fr,1.05fr,1.15fr]">
                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.branch') }}</label>
                  <AppSelect
                    :model-value="form.branch_id || null"
                    :options="branchOptions"
                    :placeholder="t('sales.documentModal.placeholders.selectBranch')"
                    searchable
                    @update:model-value="handleBranchChange"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.warehouse') }}</label>
                  <AppSelect
                    :model-value="form.warehouse_id || null"
                    :options="warehouseOptions"
                    :placeholder="form.branch_id ? t('sales.documentModal.placeholders.selectWarehouse') : t('sales.documentModal.placeholders.selectBranchFirst')"
                    :disabled="!form.branch_id"
                    searchable
                    @update:model-value="form.warehouse_id = $event || ''"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.register') }}</label>
                  <AppSelect
                    :model-value="form.cash_register_session_id || null"
                    :options="registerOptions"
                    :placeholder="registerOptions.length ? t('sales.documentModal.placeholders.selectRegisterSession') : t('sales.documentModal.placeholders.noOpenSessions')"
                    clearable
                    searchable
                    @update:model-value="form.cash_register_session_id = $event || ''"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.customer') }}</label>
                  <AppSelect
                    :model-value="form.customer_id || null"
                    :options="customerOptions"
                    :placeholder="t('sales.documentModal.placeholders.optionalCustomer')"
                    clearable
                    searchable
                    @update:model-value="form.customer_id = $event || ''"
                  />
                </div>
              </div>

              <div class="mt-3">
                <label class="erp-label">{{ t('sales.posPage.scanTitle') }}</label>
                <InventoryProductLookup
                  :warehouse-id="form.warehouse_id"
                  :disabled="!form.warehouse_id"
                  :helper-text="''"
                  @select="addLookupItem"
                />
              </div>

              <div v-if="!form.warehouse_id" class="mt-3 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
                {{ t('sales.posPage.noWarehouseHint') }}
              </div>
            </div>

            <div class="pos-panel pos-cart-panel">
              <div class="pos-panel-topline">
                <div>
                  <h2 class="pos-section-title">Sell Lines</h2>
                  <p class="pos-section-copy">Review quantity, unit, pricing, and discount before payment.</p>
                </div>
              </div>

              <div class="pos-cart-header hidden xl:block">
                <div class="grid grid-cols-[minmax(0,1fr),5.5rem,6.4rem,6.6rem,11rem,6.8rem,2.25rem] items-center gap-2">
                  <span>{{ t('sales.documentModal.fields.product') }}</span>
                  <span class="text-center">{{ t('sales.documentModal.fields.quantity') }}</span>
                  <span>{{ t('sales.documentModal.fields.unit') }}</span>
                  <span class="text-right">{{ t('sales.documentModal.fields.unitPrice') }}</span>
                  <span>{{ t('sales.documentModal.fields.lineDiscount') }}</span>
                  <span class="text-right">{{ t('sales.documentModal.fields.subtotal') }}</span>
                  <span></span>
                </div>
              </div>

              <div v-if="!cart.length" class="erp-empty-state pos-cart-empty text-sm text-slate-500 dark:text-slate-400">
                {{ t('sales.posPage.emptyCart') }}
              </div>

              <div v-else class="pos-cart-list">
                <article
                  v-for="item in cart"
                  :key="item.key"
                  class="pos-cart-row"
                >
                  <div class="grid gap-2 md:grid-cols-[minmax(0,1fr),minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr),5.5rem,6.4rem,6.6rem,11rem,6.8rem,2.25rem] xl:items-center">
                    <div class="min-w-0 md:col-span-2 xl:col-span-1">
                      <div class="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {{ item.product_name || t('sales.shared.notRecorded') }}
                        <span v-if="item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation_name }}</span>
                      </div>
                      <div class="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span v-if="item.sku" class="erp-badge erp-badge-neutral px-1.5 py-0 text-[10px]">SKU: {{ item.sku }}</span>
                        <span v-for="lot in item.lot_numbers" :key="`${item.key}-${lot}`" class="erp-badge erp-badge-warning px-1.5 py-0 text-[10px]">Lot: {{ lot }}</span>
                        <span v-for="serial in item.serial_numbers" :key="`${item.key}-${serial}`" class="erp-badge erp-badge-info px-1.5 py-0 text-[10px]">Serial: {{ serial }}</span>
                        <span v-if="lineDiscountAmount(item) > 0" class="erp-badge erp-badge-danger px-1.5 py-0 text-[10px]">
                          -{{ formatAccountingMoney(lineDiscountAmount(item)) }}
                        </span>
                      </div>
                    </div>

                    <div>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        class="erp-input sale-line-compact-input text-center font-semibold"
                        :disabled="item.serial_ids.length > 0"
                        @input="syncTrackedQuantity(item)"
                      />
                    </div>

                    <div class="sale-line-quantity pos-sale-line-uom">
                      <div class="sale-line-quantity__unit !col-span-2">
                        <AppSelect
                          v-if="unitOptionsFor(item).length"
                          :model-value="selectedUnitValue(item)"
                          :options="unitOptionsFor(item)"
                          :placeholder="t('sales.documentModal.fields.unit')"
                          @update:model-value="handleLineUnitChange(item, $event)"
                        />
                        <div v-else class="sale-line-quantity__fallback">
                          {{ selectedUnitOption(item)?.label || t('sales.documentModal.baseUnit') }}
                        </div>
                      </div>
                    </div>

                    <div>
                      <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="erp-input sale-line-compact-input pos-cart-price-input text-right font-semibold" />
                    </div>

                    <div class="sale-line-discount pos-sale-line-discount md:col-span-2 xl:col-span-1">
                      <div class="sale-line-discount__type">
                        <AppSelect
                          :model-value="item.discount_type || null"
                          :options="discountTypeOptions"
                          :placeholder="t('sales.documentModal.placeholders.selectDiscountType')"
                          clearable
                          @update:model-value="item.discount_type = $event || ''"
                        />
                      </div>
                      <div class="sale-line-discount__value">
                        <input
                          v-model.number="item.discount_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          class="erp-input sale-line-discount__input text-right"
                          :placeholder="t('sales.documentModal.placeholders.enterDiscount')"
                        />
                      </div>
                    </div>

                    <div class="text-right">
                      <div class="text-sm font-semibold text-slate-950 dark:text-white">
                        {{ formatAccountingMoney(lineTotal(item)) }}
                      </div>
                      <div class="mt-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {{ formatAccountingMoney(lineGross(item)) }}
                      </div>
                    </div>

                    <button
                      type="button"
                      class="pos-cart-delete"
                      :disabled="saving"
                      :title="t('sales.documentModal.removeLine')"
                      @click="removeItem(item.key)"
                    >
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </article>
              </div>
            </div>

            <div class="pos-totals-bar">
              <div class="pos-total-cell">
                <span>{{ t('sales.posPage.summary.items') }}</span>
                <strong>{{ cart.length }}</strong>
              </div>
              <div class="pos-total-cell">
                <span>{{ t('sales.posPage.summary.quantity') }}</span>
                <strong>{{ totalQuantity }}</strong>
              </div>
              <div class="pos-total-cell">
                <span>{{ t('sales.posPage.summary.subtotal') }}</span>
                <strong>{{ formatAccountingMoney(subtotal) }}</strong>
              </div>
              <div class="pos-total-cell">
                <span>{{ t('sales.posPage.summary.tax') }}</span>
                <strong>{{ formatAccountingMoney(taxTotal) }}</strong>
              </div>
              <div class="pos-total-payable">
                <span>{{ t('sales.posPage.summary.total') }}</span>
                <strong>{{ formatAccountingMoney(grandTotal) }}</strong>
              </div>
            </div>

            <div class="pos-panel pos-payment-panel">
              <div class="pos-section-heading">
                <div>
                  <h2 class="pos-section-title">Checkout</h2>
                  <p class="pos-section-copy">Finalize the payment method, account, and tendered amount.</p>
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr,0.8fr,0.85fr,1fr]">
                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.paymentMethod') }}</label>
                  <AppSelect
                    :model-value="payment.method || null"
                    :options="paymentMethodOptions"
                    @update:model-value="payment.method = $event || 'cash'"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.paymentAccount') }}</label>
                  <AppSelect
                    :model-value="payment.payment_account_id || null"
                    :options="paymentAccountOptions"
                    :placeholder="t('sales.salesPage.placeholders.selectPaymentAccount')"
                    searchable
                    @update:model-value="payment.payment_account_id = $event || ''"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.paidAmount') }}</label>
                  <input v-model.number="payment.amount" type="number" min="0" step="0.01" class="erp-input text-right font-semibold" />
                </div>

                <div class="rounded-[8px] border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
                  <div class="flex items-center justify-between gap-3">
                    <span>{{ t('sales.posPage.summary.change') }}</span>
                    <span class="font-semibold">{{ formatAccountingMoney(changeDue) }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <input v-model="payment.reference" type="text" class="erp-input" :placeholder="t('sales.posPage.fields.reference')" />
                <input v-model="form.notes" type="text" class="erp-input" :placeholder="t('sales.posPage.fields.note')" />
              </div>
            </div>

            <div v-if="checkoutMessage" class="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
              {{ checkoutMessage }}
            </div>
          </div>

          <aside class="pos-product-side">
            <div class="pos-panel pos-product-panel">
              <div class="pos-section-heading">
                <div>
                  <h2 class="pos-section-title">Product Browser</h2>
                  <p class="pos-section-copy">Filter by category or brand, then tap a tile to add it to the current sale.</p>
                </div>
                <div class="pos-inline-stats">
                  <span class="pos-inline-stat">{{ filteredProducts.length }} items</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button type="button" class="pos-filter-button" @click="filterMode = 'category'">
                  <i class="fa-solid fa-layer-group"></i>
                  {{ t('sales.posPage.productBrowser.categories') }}
                </button>
                <button type="button" class="pos-filter-button" @click="filterMode = 'brand'">
                  <i class="fa-solid fa-award"></i>
                  {{ t('sales.posPage.productBrowser.brands') }}
                </button>
              </div>

              <div class="mt-3">
                <input
                  v-model="productSearch"
                  type="text"
                  class="erp-input"
                  :placeholder="t('sales.posPage.productBrowser.searchProducts')"
                />
              </div>

              <div class="pos-chip-strip">
                <button type="button" class="pos-chip" :class="activeFilterId === '' ? 'pos-chip-active' : ''" @click="clearProductFilter">
                  {{ t('sales.posPage.productBrowser.all') }}
                </button>
                <button
                  v-for="filter in activeFilters"
                  :key="filter.id"
                  type="button"
                  class="pos-chip"
                  :class="activeFilterId === filter.id ? 'pos-chip-active' : ''"
                  @click="activeFilterId = filter.id"
                >
                  {{ filter.name }}
                </button>
              </div>

              <div v-if="filteredProducts.length === 0" class="erp-empty-state py-12 text-sm text-slate-500 dark:text-slate-400">
                {{ t('sales.posPage.productBrowser.noProducts') }}
              </div>

              <div v-else class="pos-product-grid">
                <button
                  v-for="product in filteredProducts"
                  :key="product.id"
                  type="button"
                  class="pos-product-tile"
                  :disabled="!form.warehouse_id"
                  @click="addProductTile(product)"
                >
                  <span v-if="product.image_url" class="pos-product-image">
                    <img :src="product.image_url" :alt="product.name" />
                  </span>
                  <span v-else class="pos-product-image pos-product-image-empty">
                    <i class="fa-solid fa-box-open"></i>
                  </span>
                  <span class="pos-product-name">{{ product.name }}</span>
                  <span class="pos-product-meta">
                    {{ product.sku || product.category?.name || t('sales.shared.notRecorded') }}
                  </span>
                  <span class="pos-product-meta-secondary">
                    {{ product.brand?.name || product.unit?.short_name || t('sales.documentModal.fields.unit') }}
                  </span>
                  <span
                    v-if="product.available_quantity !== null && product.available_quantity !== undefined && form.warehouse_id"
                    class="pos-product-stock"
                  >
                    Avail: {{ product.available_quantity }}
                  </span>
                  <span class="pos-product-price">{{ formatAccountingMoney(productPrice(product)) }}</span>
                </button>
              </div>
            </div>
          </aside>
        </section>
      </template>
    </main>

    <div class="pos-action-bar">
      <div class="pos-action-inner">
        <button type="button" class="pos-action-cancel" :disabled="saving || !cart.length" @click="clearCart">
          <i class="fa-solid fa-window-close"></i>
          {{ t('sales.posPage.actions.clearCart') }}
        </button>
        <button type="button" class="pos-action-lite" :disabled="saving || !cart.length" @click="submitSuspended">
          <i class="fa-solid fa-pause"></i>
          {{ t('sales.posPage.actions.suspend') }}
        </button>
        <button type="button" class="pos-action-lite" :disabled="saving || !cart.length" @click="submitCard">
          <i class="fa-solid fa-credit-card"></i>
          {{ t('sales.posPage.actions.card') }}
        </button>
        <button type="button" class="pos-action-primary" :disabled="saving || !cart.length" @click="submitFinalized">
          <i class="fa-solid fa-money-check-dollar"></i>
          {{ t('sales.posPage.actions.multiplePay') }}
        </button>
        <button type="button" class="pos-action-cash" :disabled="saving || !cart.length" @click="submitCash">
          <span
            v-if="saving"
            class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          ></span>
          <i v-else class="fa-solid fa-money-bill-wave"></i>
          {{ t('sales.posPage.actions.cash') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import * as accountingApi from '@api/accounting'
import * as branchesApi from '@api/branches'
import * as customersApi from '@api/customers'
import * as productsApi from '@api/products'
import * as salesApi from '@api/sales'
import * as warehousesApi from '@api/warehouses'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import { useAuthStore } from '@stores/auth'
import { formatAccountingMoney } from '@/utils/accounting'
import { formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const BASE_UNIT_OPTION_VALUE = '__base_unit__'

const loading = ref(true)
const saving = ref(false)
const attemptedSubmit = ref(false)
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const products = ref([])
const registers = ref([])
const paymentAccounts = ref([])
const cart = ref([])
const filterMode = ref('category')
const activeFilterId = ref('')
const productSearch = ref('')

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const form = reactive({
  branch_id: '',
  warehouse_id: '',
  customer_id: '',
  cash_register_session_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  notes: '',
})
const payment = reactive({
  payment_account_id: '',
  amount: 0,
  method: 'cash',
  reference: '',
})

const productMap = computed(() => new Map(products.value.map((product) => [product.id, product])))

const uniqueFilters = (items, getter) => {
  const map = new Map()

  items.forEach((item) => {
    const value = getter(item)

    if (value?.id && value?.name && !map.has(value.id)) {
      map.set(value.id, { id: value.id, name: value.name })
    }
  })

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

const categoryFilters = computed(() => uniqueFilters(products.value, (product) => product.category))
const brandFilters = computed(() => uniqueFilters(products.value, (product) => product.brand))
const activeFilters = computed(() => filterMode.value === 'brand' ? brandFilters.value : categoryFilters.value)

const productPrice = (product) =>
  toFiniteNumber(product.selling_price ?? product.variable_selling_price_min ?? product.sub_unit_selling_price, 0)

const filteredProducts = computed(() => {
  const term = productSearch.value.trim().toLowerCase()

  return products.value
    .filter((product) => {
      if (!activeFilterId.value) {
        return true
      }

      return filterMode.value === 'brand'
        ? product.brand?.id === activeFilterId.value
        : product.category?.id === activeFilterId.value
    })
    .filter((product) => {
      if (!term) {
        return true
      }

      return [
        product.name,
        product.sku,
        product.category?.name,
        product.brand?.name,
      ].filter(Boolean).join(' ').toLowerCase().includes(term)
    })
    .slice(0, 60)
})

const branchOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  }))
)

const warehouseOptions = computed(() =>
  warehouses.value
    .filter((warehouse) => !form.branch_id || warehouse.branch_id === form.branch_id)
    .map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
      description: warehouse.branch?.name || warehouse.code || '',
    }))
)

const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    value: customer.id,
    label: customer.name,
    description: customer.phone || customer.code || '',
  }))
)

const registerOptions = computed(() =>
  registers.value
    .filter((register) => !form.branch_id || register.branch_id === form.branch_id)
    .map((register) => ({
      value: register.current_open_session.id,
      label: register.name,
      description: `${register.branch?.name || t('sales.shared.notRecorded')} • ${formatHumanDateTime(register.current_open_session.opened_at)}`,
    }))
)

const paymentAccountOptions = computed(() =>
  paymentAccounts.value.map((account) => ({
    value: account.id,
    label: account.name,
    description: account.account_type || account.type || '',
  }))
)

const paymentMethodOptions = computed(() => [
  { value: 'cash', label: t('sales.shared.methods.cash') },
  { value: 'card', label: t('sales.shared.methods.card') },
  { value: 'bank_transfer', label: t('sales.shared.methods.bank_transfer') },
  { value: 'cheque', label: t('sales.shared.methods.cheque') },
  { value: 'other', label: t('sales.shared.methods.other') },
])

const discountTypeOptions = computed(() => [
  { value: 'fixed', label: t('sales.documentModal.discountTypes.fixed') },
  { value: 'percentage', label: t('sales.documentModal.discountTypes.percentage') },
])

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const deriveProductTax = (productId) => {
  const product = productMap.value.get(productId)

  return {
    tax_rate_id: product?.tax_rate?.id || product?.tax_rate_id || null,
    tax_rate_type: product?.tax_rate?.type || null,
    tax_type: product?.tax_type || 'exclusive',
    tax_rate: toFiniteNumber(product?.tax_rate?.rate ?? product?.tax_rate, 0),
  }
}

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

const lineGross = (item) => Number(item.quantity || 0) * Number(item.unit_price || 0)
const lineDiscountAmount = (item) => resolveDiscountAmount(item.discount_type, item.discount_amount, lineGross(item))
const lineTaxable = (item) => Math.max(0, lineGross(item) - lineDiscountAmount(item))

const lineTaxAmount = (item) => {
  const gross = lineTaxable(item)
  const rate = Number(item.tax_rate || 0)

  if (gross <= 0 || rate <= 0) {
    return 0
  }

  if (item.tax_rate_type === 'fixed') {
    return Math.min(gross, rate)
  }

  if (item.tax_type === 'inclusive') {
    return gross - (gross / (1 + rate / 100))
  }

  return gross * (rate / 100)
}

const lineTotal = (item) => {
  const gross = lineTaxable(item)
  return item.tax_type === 'inclusive' ? gross : gross + lineTaxAmount(item)
}

const subtotal = computed(() => cart.value.reduce((carry, item) => carry + lineTaxable(item), 0))
const taxTotal = computed(() => cart.value.reduce((carry, item) => carry + lineTaxAmount(item), 0))
const grandTotal = computed(() => cart.value.reduce((carry, item) => carry + lineTotal(item), 0))
const totalQuantity = computed(() => cart.value.reduce((carry, item) => carry + Number(item.quantity || 0), 0))
const changeDue = computed(() => Math.max(0, Number(payment.amount || 0) - grandTotal.value))

const normalizedItems = computed(() =>
  cart.value
    .map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id || null,
      sub_unit_id: item.sub_unit_id || null,
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
      notes: null,
    }))
    .filter((item) => item.product_id && item.quantity > 0)
)

const validationMessage = computed(() => {
  if (!attemptedSubmit.value) {
    return ''
  }

  if (!form.branch_id || !form.warehouse_id || !form.sale_date) {
    return t('sales.documentModal.validation.missingHeader')
  }

  if (!normalizedItems.value.length) {
    return t('sales.documentModal.validation.invalidItems')
  }

  return ''
})

const paymentValidationMessage = computed(() => {
  if (!attemptedSubmit.value) {
    return ''
  }

  if (!form.cash_register_session_id) {
    return t('sales.documentModal.validation.missingRegisterSession')
  }

  if (Number(payment.amount || 0) > 0 && !payment.payment_account_id) {
    return t('sales.posPage.paymentRequired')
  }

  return ''
})

const checkoutMessage = computed(() => validationMessage.value || paymentValidationMessage.value)

const showToast = (type, message) => {
  alert.type = type
  alert.title = t(type === 'danger' ? 'sales.shared.toast.errorTitle' : 'sales.shared.toast.successTitle')
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const exitPos = () => {
  router.push({ name: 'sales' })
}

const clearProductFilter = () => {
  activeFilterId.value = ''
}

const handleBranchChange = (value) => {
  form.branch_id = value || ''

  if (!warehouses.value.some((warehouse) => warehouse.id === form.warehouse_id && warehouse.branch_id === form.branch_id)) {
    form.warehouse_id = ''
  }

  if (!registers.value.some((register) => register.current_open_session?.id === form.cash_register_session_id && register.branch_id === form.branch_id)) {
    form.cash_register_session_id = ''
  }
}

const buildUnitOptionLabel = (unit) => {
  if (!unit) {
    return t('sales.documentModal.baseUnit')
  }

  return unit.short_name
    ? `${unit.name} (${unit.short_name})`
    : unit.name
}

const resolveSubUnitPrice = (explicitSubUnitPrice, baseUnitPrice, subUnit) => {
  const directPrice = toFiniteNumber(explicitSubUnitPrice, Number.NaN)

  if (Number.isFinite(directPrice) && directPrice > 0) {
    return directPrice
  }

  const factor = toFiniteNumber(subUnit?.conversion_factor, 1)

  if (factor > 0 && baseUnitPrice > 0) {
    return baseUnitPrice * factor
  }

  return 0
}

const buildUnitOptions = ({
  baseUnit = null,
  subUnit = null,
  baseUnitPrice = 0,
  subUnitPrice = 0,
  stockTracking = 'none',
}) => {
  const options = [
    {
      value: BASE_UNIT_OPTION_VALUE,
      label: buildUnitOptionLabel(baseUnit),
      description: formatAccountingMoney(baseUnitPrice),
      sub_unit_id: '',
      price: toFiniteNumber(baseUnitPrice, 0),
      factor: 1,
    },
  ]

  if (subUnit && !['lot', 'serial'].includes(stockTracking)) {
    options.push({
      value: subUnit.id,
      label: buildUnitOptionLabel(subUnit),
      description: `${formatAccountingMoney(subUnitPrice)} • x${toFiniteNumber(subUnit.conversion_factor, 1).toFixed(4)}`,
      sub_unit_id: subUnit.id,
      price: toFiniteNumber(subUnitPrice, 0),
      factor: toFiniteNumber(subUnit.conversion_factor, 1),
    })
  }

  return options
}

const buildLookupUnitState = (match) => {
  const product = productMap.value.get(match.product_id)
  const baseUnit = match.unit || product?.unit || null
  const subUnit = match.sub_unit || product?.sub_unit || null
  const stockTracking = match.stock_tracking || product?.stock_tracking || 'none'
  const baseUnitPrice = toFiniteNumber(
    match.selling_price ?? product?.selling_price ?? product?.variable_selling_price_min,
    0
  )
  const subUnitPrice = resolveSubUnitPrice(
    match.sub_unit_selling_price ?? product?.sub_unit_selling_price,
    baseUnitPrice,
    subUnit
  )

  return {
    sub_unit_id: '',
    base_unit_price: baseUnitPrice,
    sub_unit_price: subUnitPrice,
    minimum_selling_price: toFiniteNumber(match.minimum_selling_price ?? product?.minimum_selling_price, 0),
    stock_tracking: stockTracking,
    unit_options: buildUnitOptions({
      baseUnit,
      subUnit,
      baseUnitPrice,
      subUnitPrice,
      stockTracking,
    }),
  }
}

const unitOptionsFor = (item) => Array.isArray(item?.unit_options) ? item.unit_options : []
const selectedUnitValue = (item) => item.sub_unit_id || BASE_UNIT_OPTION_VALUE

const selectedUnitOption = (item) =>
  unitOptionsFor(item).find((option) => option.value === selectedUnitValue(item))
  || unitOptionsFor(item)[0]
  || null

const handleLineUnitChange = (item, value) => {
  const selected = unitOptionsFor(item).find((option) => option.value === value)

  if (!selected) {
    item.sub_unit_id = ''
    return
  }

  item.sub_unit_id = selected.sub_unit_id || ''
  item.unit_price = toFiniteNumber(selected.price, item.unit_price)
}

const isSameLookupItem = (item, match) =>
  item.product_id === match.product_id &&
  (item.variation_id || '') === (match.variation_id || '') &&
  (item.lot_allocations[0]?.lot_id || '') === (match.lot_id || '') &&
  (match.serial_id ? item.serial_ids.length > 0 : item.serial_ids.length === 0)

const addLookupItem = (match) => {
  const existing = cart.value.find((item) => isSameLookupItem(item, match))

  if (existing) {
    if (match.serial_id) {
      if (!existing.serial_ids.includes(match.serial_id)) {
        existing.serial_ids.push(match.serial_id)
        if (match.serial_number && !existing.serial_numbers.includes(match.serial_number)) {
          existing.serial_numbers.push(match.serial_number)
        }
      }
      existing.quantity = existing.serial_ids.length
    } else {
      existing.quantity = Number(existing.quantity || 0) + 1
    }

    syncTrackedQuantity(existing)
    return
  }

  const tax = deriveProductTax(match.product_id)
  const product = productMap.value.get(match.product_id)
  const lookupUnitState = buildLookupUnitState(match)

  cart.value.push({
    key: crypto.randomUUID(),
    product_id: match.product_id,
    variation_id: match.variation_id || '',
    lot_allocations: match.lot_id ? [{ lot_id: match.lot_id, quantity: 1 }] : [],
    serial_ids: match.serial_id ? [match.serial_id] : [],
    quantity: 1,
    unit_price: lookupUnitState.base_unit_price,
    unit_cost: Number(match.unit_cost || 0),
    discount_type: '',
    discount_amount: 0,
    product_name: match.product_name || product?.name || '',
    variation_name: match.variation_name || '',
    sku: match.sku || product?.sku || '',
    lot_numbers: match.lot_number ? [match.lot_number] : [],
    serial_numbers: match.serial_number ? [match.serial_number] : [],
    ...lookupUnitState,
    ...tax,
  })
}

const addProductTile = (product) => {
  addLookupItem({
    product_id: product.id,
    variation_id: '',
    product_name: product.name,
    variation_name: '',
    sku: product.sku || '',
    selling_price: productPrice(product),
    unit_cost: product.purchase_price || 0,
    stock_tracking: product.stock_tracking || 'none',
    unit: product.unit || null,
    sub_unit: product.sub_unit || null,
    sub_unit_selling_price: product.sub_unit_selling_price ?? null,
    minimum_selling_price: product.minimum_selling_price ?? 0,
  })
}

const syncTrackedQuantity = (item) => {
  if (item.serial_ids.length) {
    item.quantity = item.serial_ids.length
    return
  }

  if (item.lot_allocations.length === 1) {
    item.lot_allocations[0].quantity = Number(item.quantity || 0)
  }
}

const incrementItem = (item) => {
  item.quantity = Number(item.quantity || 0) + 1
  syncTrackedQuantity(item)
}

const decrementItem = (item) => {
  item.quantity = Math.max(1, Number(item.quantity || 0) - 1)
  syncTrackedQuantity(item)
}

const removeItem = (key) => {
  cart.value = cart.value.filter((item) => item.key !== key)
}

const clearCart = () => {
  cart.value = []
  payment.amount = 0
  payment.reference = ''
  form.notes = ''
  attemptedSubmit.value = false
}

const buildPayload = (type) => ({
  branch_id: form.branch_id,
  warehouse_id: form.warehouse_id,
  customer_id: form.customer_id || null,
  type,
  sale_date: form.sale_date,
  due_date: null,
  cash_register_session_id: type === 'pos_sale' ? form.cash_register_session_id || null : null,
  discount_type: null,
  discount_amount: 0,
  tax_scope: 'line',
  tax_rate_id: null,
  tax_rate_type: null,
  tax_rate: 0,
  tax_type: null,
  shipping_charges: 0,
  notes: form.notes?.trim() || null,
  staff_note: null,
  items: normalizedItems.value,
  ui_action: type === 'suspended' ? 'suspended' : 'finalize',
})

const submitSuspended = async () => {
  attemptedSubmit.value = true

  if (validationMessage.value) {
    return
  }

  saving.value = true

  try {
    await salesApi.createSale(buildPayload('suspended'))
    showToast('success', t('sales.posPage.toast.suspended'))
    clearCart()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.posPage.toast.failed'))
  } finally {
    saving.value = false
  }
}

const submitFinalized = async () => {
  attemptedSubmit.value = true

  if (validationMessage.value || paymentValidationMessage.value) {
    return
  }

  saving.value = true

  try {
    const created = await salesApi.createSale(buildPayload('pos_sale'))
    const sale = created.data.data
    await salesApi.completeSale(sale.id)

    if (Number(payment.amount || 0) > 0) {
      await salesApi.recordSalePayment(sale.id, {
        payment_account_id: payment.payment_account_id,
        amount: Number(payment.amount || 0),
        method: payment.method || 'cash',
        payment_date: form.sale_date,
        reference: payment.reference?.trim() || null,
        note: null,
      })
    }

    showToast('success', t('sales.posPage.toast.finalized'))
    clearCart()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.posPage.toast.failed'))
  } finally {
    saving.value = false
  }
}

const submitCash = () => {
  payment.method = 'cash'
  payment.amount = Number(grandTotal.value.toFixed(2))
  submitFinalized()
}

const submitCard = () => {
  payment.method = 'card'
  payment.amount = Number(grandTotal.value.toFixed(2))
  submitFinalized()
}

const loadBranches = async () => {
  if (!auth.isBranchScopeBypassed) {
    branches.value = auth.allowedBranches.map((branch) => ({ ...branch }))
    return
  }

  const response = await branchesApi.getBranches({ per_page: 250 })
  branches.value = response.data.data
}

const loadWarehouses = async () => {
  const response = await warehousesApi.getWarehouses({ per_page: 250 })
  const allWarehouses = response.data.data
  warehouses.value = auth.isBranchScopeBypassed
    ? allWarehouses
    : allWarehouses.filter((warehouse) => auth.allowedBranches.some((branch) => branch.id === warehouse.branch_id))
}

const loadCustomers = async () => {
  const response = await customersApi.getCustomers({ per_page: 250, status: 'active' })
  customers.value = response.data.data
}

const loadProducts = async () => {
  const response = await productsApi.getProducts({
    per_page: 250,
    warehouse_id: form.warehouse_id || undefined,
  })
  products.value = response.data.data.filter((product) => product.is_active && product.is_for_selling !== false)
}

const loadRegisters = async () => {
  const response = await salesApi.getCashRegisters({ per_page: 250, status: 'active' })
  registers.value = response.data.data.filter((register) => register.current_open_session)
}

const loadPaymentAccounts = async () => {
  const response = await accountingApi.getPaymentAccounts({ per_page: 250, status: 'active' })
  paymentAccounts.value = response.data.data
}

watch(grandTotal, (value) => {
  if (!payment.amount || Number(payment.amount) < Number(value)) {
    payment.amount = Number(value.toFixed(2))
  }
})

watch(filterMode, () => {
  activeFilterId.value = ''
})

watch(() => form.warehouse_id, async () => {
  if (loading.value) {
    return
  }

  await loadProducts()
})

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      loadBranches(),
      loadWarehouses(),
      loadCustomers(),
      loadProducts(),
      loadRegisters(),
      loadPaymentAccounts(),
    ])

    if (branches.value.length === 1) {
      form.branch_id = branches.value[0].id
    }
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.formPage.loadErrorMessage'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pos-terminal {
  background:
    radial-gradient(circle at top left, rgba(125, 211, 252, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(110, 231, 183, 0.18), transparent 24%),
    linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(239, 246, 255, 0.96) 45%, rgba(240, 253, 250, 0.92)),
    #f8fafc;
  color: rgb(15 23 42);
  padding-bottom: 5rem;
}

.pos-terminal-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  min-height: 4.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid rgba(203, 213, 225, 0.76);
  background: rgba(255, 255, 255, 0.84);
  padding: 1rem 1.1rem;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(18px) saturate(160%);
}

.pos-header-copy {
  display: flex;
  flex-direction: column;
}

.pos-header-actions {
  align-self: flex-start;
}

.pos-terminal-button {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  padding: 0 0.85rem;
  color: rgb(51 65 85);
  font-size: 0.875rem;
  font-weight: 700;
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
}

.pos-terminal-button:hover {
  border-color: rgba(6, 182, 212, 0.52);
  background: rgba(236, 254, 255, 0.9);
  color: rgb(14 116 144);
}

.pos-terminal-icon-button {
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: rgb(51 65 85);
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease, opacity 150ms ease;
}

.pos-terminal-icon-button:hover:not(:disabled) {
  border-color: rgba(244, 63, 94, 0.42);
  background: rgba(255, 241, 242, 0.9);
  color: rgb(190 18 60);
}

.pos-terminal-icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-panel {
  border: 1px solid rgba(203, 213, 225, 0.76);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.82));
  padding: 1rem;
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(150%);
}

.pos-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.pos-sale-side,
.pos-product-side {
  min-width: 0;
}

.pos-sale-side {
  display: flex;
  min-height: calc(100vh - 10rem);
  flex-direction: column;
  gap: 1rem;
}

.pos-section-heading,
.pos-panel-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
  margin-bottom: 0.85rem;
}

.pos-section-title {
  color: rgb(15 23 42);
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.2;
}

.pos-section-copy {
  margin-top: 0.2rem;
  color: rgb(100 116 139);
  font-size: 0.78rem;
  line-height: 1.45;
}

.pos-sale-panel,
.pos-payment-panel,
.pos-product-panel {
  padding: 0.9rem;
}

.pos-cart-panel {
  display: flex;
  min-height: 22rem;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.pos-cart-header {
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.98);
  padding: 0.42rem 0.6rem;
  color: rgb(100 116 139);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pos-cart-empty {
  display: flex;
  min-height: 22rem;
  align-items: center;
  justify-content: center;
}

.pos-cart-list {
  display: flex;
  max-height: calc(100vh - 24rem);
  min-height: 18rem;
  flex-direction: column;
  gap: 0.35rem;
  overflow-y: auto;
  padding: 0.5rem;
}

.pos-cart-row {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88));
  padding: 0.58rem 0.62rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.pos-cart-price-input {
  min-height: 2rem;
  padding: 0.35rem 0.55rem;
  font-size: 0.85rem;
}

.pos-cart-delete {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(254, 205, 211, 1);
  border-radius: 8px;
  color: rgb(225 29 72);
  transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease, opacity 150ms ease;
}

.pos-cart-delete:hover:not(:disabled) {
  border-color: rgb(253 164 175);
  background: rgb(255 241 242);
}

.pos-cart-delete:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-totals-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.76);
  border-radius: 10px;
  background: rgb(226 232 240);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.pos-total-cell,
.pos-total-payable {
  display: flex;
  min-height: 3.4rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.94);
  padding: 0.45rem;
}

.pos-total-cell span,
.pos-total-payable span {
  color: rgb(100 116 139);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pos-total-cell strong {
  color: rgb(15 23 42);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.pos-total-payable {
  grid-column: 1 / -1;
  background:
    linear-gradient(135deg, rgba(220, 252, 231, 0.95), rgba(209, 250, 229, 0.84));
}

.pos-total-payable span {
  color: rgb(6 95 70);
}

.pos-total-payable strong {
  color: rgb(4 120 87);
  font-size: 1.8rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.pos-filter-button {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(14, 165, 233, 0.18);
  background: linear-gradient(135deg, rgb(14 116 144), rgb(59 130 246));
  color: white;
  font-size: 0.9rem;
  font-weight: 800;
  transition: transform 150ms ease, filter 150ms ease;
}

.pos-filter-button:hover {
  filter: brightness(1.04);
}

.pos-filter-button:active {
  transform: scale(0.98);
}

.pos-chip-strip {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding: 0.75rem 0 0.65rem;
}

.pos-chip {
  min-height: 2.1rem;
  white-space: nowrap;
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  padding: 0 0.85rem;
  color: rgb(71 85 105);
  font-size: 0.8rem;
  font-weight: 800;
}

.pos-chip-active {
  border-color: rgba(14, 165, 233, 0.52);
  background: rgb(224 242 254);
  color: rgb(3 105 161);
}

.pos-product-grid {
  display: grid;
  max-height: calc(100vh - 18rem);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.pos-product-tile {
  display: grid;
  min-height: 8.8rem;
  grid-template-rows: 3.35rem auto auto auto;
  gap: 0.28rem;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88));
  padding: 0.55rem;
  text-align: left;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease, opacity 150ms ease;
}

.pos-product-tile:hover:not(:disabled) {
  border-color: rgba(14, 165, 233, 0.56);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
  transform: translateY(-2px);
}

.pos-product-tile:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.pos-product-image {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
  padding: 0.35rem;
}

.pos-product-image img {
  height: 100%;
  width: 100%;
  object-fit: contain;
  object-position: center;
}

.pos-product-name {
  display: -webkit-box;
  overflow: hidden;
  color: rgb(15 23 42);
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.pos-product-meta {
  overflow: hidden;
  color: rgb(100 116 139);
  font-size: 0.68rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-product-meta-secondary {
  overflow: hidden;
  color: rgb(148 163 184);
  font-size: 0.64rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-product-stock {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  min-height: 1.2rem;
  border-radius: 999px;
  background: rgba(220, 252, 231, 0.92);
  padding: 0 0.45rem;
  color: rgb(21 128 61);
  font-size: 0.64rem;
  font-weight: 800;
}

.pos-product-price {
  color: rgb(4 120 87);
  font-size: 0.82rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.pos-action-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.94);
  box-shadow: 0 -12px 32px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(16px) saturate(160%);
}

.pos-action-inner {
  display: flex;
  min-height: 4rem;
  align-items: center;
  gap: 0.65rem;
  overflow-x: auto;
  padding: 0.65rem 1rem;
}

.pos-action-cancel,
.pos-action-lite,
.pos-action-primary,
.pos-action-cash {
  display: inline-flex;
  min-height: 2.7rem;
  min-width: 7.5rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 8px;
  padding: 0 0.9rem;
  font-size: 0.86rem;
  font-weight: 900;
  white-space: nowrap;
  transition: opacity 150ms ease, transform 150ms ease;
}

.pos-action-cancel:disabled,
.pos-action-lite:disabled,
.pos-action-primary:disabled,
.pos-action-cash:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-action-cancel:active:not(:disabled),
.pos-action-lite:active:not(:disabled),
.pos-action-primary:active:not(:disabled),
.pos-action-cash:active:not(:disabled) {
  transform: scale(0.98);
}

.pos-action-cancel {
  border: 2px solid rgb(251 113 133);
  background: rgba(255, 255, 255, 0.98);
  color: rgb(225 29 72);
}

.pos-action-lite {
  background: rgba(255, 255, 255, 0.98);
  color: rgb(51 65 85);
}

.pos-action-primary {
  background: linear-gradient(135deg, rgb(15 23 42), rgb(30 41 59));
  color: white;
}

.pos-action-cash {
  background: linear-gradient(135deg, rgb(22 163 74), rgb(5 150 105));
  color: white;
}

.sale-line-quantity,
.sale-line-discount {
  display: grid;
  grid-template-columns: minmax(6.2rem, 7rem) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.86));
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.sale-line-quantity__value,
.sale-line-discount__type {
  position: relative;
  min-width: 0;
}

.sale-line-quantity__value::after,
.sale-line-discount__type::after {
  content: "";
  position: absolute;
  top: 0.55rem;
  right: 0;
  bottom: 0.55rem;
  width: 1px;
  background: rgba(148, 163, 184, 0.22);
}

.sale-line-quantity__unit,
.sale-line-discount__value {
  min-width: 0;
}

.sale-line-quantity :deep(.erp-input),
.sale-line-discount :deep(.erp-input) {
  align-items: stretch;
  min-height: 2rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.sale-line-quantity :deep(.erp-input:hover),
.sale-line-discount :deep(.erp-input:hover) {
  border: 0;
  box-shadow: none;
}

.sale-line-quantity :deep(.erp-input:focus),
.sale-line-discount :deep(.erp-input:focus) {
  border: 0;
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.22);
}

.sale-line-quantity__input,
.sale-line-discount__input {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  font-weight: 600;
}

.sale-line-quantity__fallback {
  display: flex;
  min-height: 2rem;
  align-items: center;
  padding: 0 0.75rem;
  color: rgb(15 23 42);
  font-size: 0.8rem;
  font-weight: 600;
}

.sale-line-compact-input {
  min-height: 2rem;
  padding-top: 0.35rem;
  padding-bottom: 0.35rem;
}

.pos-sale-line-quantity,
.pos-sale-line-discount {
  box-shadow: none;
}

.pos-sale-line-uom {
  grid-template-columns: 1fr;
}

.pos-sale-line-uom .sale-line-quantity__unit {
  min-width: 0;
}

.dark .sale-line-quantity,
.dark .sale-line-discount {
  border-color: rgba(51, 65, 85, 0.72);
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.82));
  box-shadow:
    0 12px 26px rgba(2, 6, 23, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.dark .sale-line-quantity__value::after,
.dark .sale-line-discount__type::after {
  background: rgba(71, 85, 105, 0.72);
}

.dark .sale-line-quantity :deep(.erp-input:focus),
.dark .sale-line-discount :deep(.erp-input:focus) {
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.28);
}

.dark .sale-line-quantity__fallback {
  color: rgb(241 245 249);
}

.dark .pos-terminal {
  background:
    radial-gradient(circle at top left, rgba(8, 145, 178, 0.16), transparent 28%),
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 24%),
    linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.96) 48%, rgba(8, 47, 73, 0.92)),
    #020617;
  color: rgb(241 245 249);
}

.dark .pos-terminal-header {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
}

.dark .pos-terminal-button {
  border-color: rgba(71, 85, 105, 0.82);
  background: rgba(15, 23, 42, 0.72);
  color: rgb(226 232 240);
}

.dark .pos-terminal-button:hover {
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(8, 47, 73, 0.62);
  color: rgb(165 243 252);
}

.dark .pos-terminal-icon-button {
  border-color: rgba(71, 85, 105, 0.82);
  background: rgba(15, 23, 42, 0.72);
  color: rgb(226 232 240);
}

.dark .pos-panel {
  border-color: rgba(51, 65, 85, 0.82);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.74));
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.dark .pos-section-copy,
.dark .pos-product-meta-secondary {
  color: rgb(148 163 184);
}

.dark .pos-product-stock {
  background: rgba(6, 78, 59, 0.42);
  color: rgb(134 239 172);
}

.dark .pos-section-title {
  color: rgb(241 245 249);
}

.dark .pos-cart-header,
.dark .pos-total-cell {
  background: rgba(15, 23, 42, 0.9);
}

.dark .pos-cart-header,
.dark .pos-total-cell span {
  color: rgb(148 163 184);
}

.dark .pos-cart-row,
.dark .pos-chip,
.dark .pos-product-tile,
.dark .pos-action-lite,
.dark .pos-action-cancel {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.78);
}

.dark .pos-total-cell strong,
.dark .pos-product-name,
.dark .pos-action-lite {
  color: rgb(241 245 249);
}

.dark .pos-totals-bar {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgb(30 41 59);
}

.dark .pos-total-payable {
  background: rgba(6, 78, 59, 0.46);
}

.dark .pos-chip {
  color: rgb(203 213 225);
}

.dark .pos-chip-active {
  border-color: rgba(34, 211, 238, 0.5);
  background: rgba(8, 47, 73, 0.78);
  color: rgb(165 243 252);
}

.dark .pos-product-image {
  background: rgba(30, 41, 59, 0.9);
}

.dark .pos-action-bar {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.94);
}

@media (max-width: 1024px) {
  .pos-section-heading,
  .pos-panel-topline {
    flex-direction: column;
  }
}

@media (max-width: 1279px) {
  .pos-cart-list {
    max-height: none;
  }
}

@media (max-width: 767px) {
  .pos-terminal-header {
    position: relative;
    flex-direction: column;
    align-items: stretch;
  }

  .pos-terminal-button {
    flex: 1;
  }

  .pos-product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pos-workspace {
    grid-template-columns: minmax(0, 60fr) minmax(24rem, 40fr);
  }

  .pos-totals-bar {
    grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(12rem, 1.25fr);
  }

  .pos-total-payable {
    grid-column: auto;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .pos-product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .pos-product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
