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

              <div v-if="!cart.length" class="erp-empty-state pos-cart-empty text-sm text-slate-500 dark:text-slate-400">
                {{ t('sales.posPage.emptyCart') }}
              </div>

              <div
                v-else
                class="pos-cart-table"
              >
                <div class="pos-cart-header hidden lg:block">
                  <div class="pos-cart-line-grid">
                    <span>{{ t('sales.documentModal.fields.product') }}</span>
                    <span>{{ t('sales.documentModal.fields.unit') }}</span>
                    <span class="text-center">{{ t('sales.documentModal.fields.quantity') }}</span>
                    <span class="text-right">{{ t('sales.documentModal.fields.unitPrice') }}</span>
                    <span class="text-right">{{ t('sales.documentModal.fields.subtotal') }}</span>
                    <span></span>
                  </div>
                </div>

                <div class="pos-cart-list">
                  <article
                    v-for="item in cart"
                    :key="item.key"
                    class="pos-cart-row"
                  >
                    <div class="pos-cart-line-grid">
                      <div class="pos-line-product-cell">
                        <button type="button" class="pos-line-product-name" @click="openLineModal(item)">
                          {{ item.product_name || t('sales.shared.notRecorded') }}
                          <span v-if="item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ item.variation_name }}</span>
                        </button>
                        <div class="pos-line-product-meta">
                          <span v-if="item.sku" class="erp-badge erp-badge-neutral pos-line-sku-badge">SKU: {{ item.sku }}</span>
                          <span v-for="lot in item.lot_numbers" :key="`${item.key}-${lot}`" class="erp-badge erp-badge-warning">Lot: {{ lot }}</span>
                          <span v-for="serial in item.serial_numbers" :key="`${item.key}-${serial}`" class="erp-badge erp-badge-info">Serial: {{ serial }}</span>
                          <span v-if="item.tracked_expiry_date" class="erp-badge erp-badge-neutral">Exp: {{ item.tracked_expiry_date }}</span>
                          <span v-if="lineDiscountAmount(item) > 0" class="erp-badge erp-badge-danger">
                            -{{ formatAccountingMoney(lineDiscountAmount(item)) }}
                          </span>
                          <span v-if="item.notes" class="erp-badge erp-badge-neutral">Note</span>
                        </div>
                      </div>

                      <div class="pos-line-unit-cell">
                        <div class="sale-line-quantity pos-line-unit-select">
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
                      </div>

                      <div class="pos-line-quantity-cell">
                        <div class="pos-quantity-stepper">
                          <button
                            type="button"
                            class="pos-quantity-stepper-button"
                            :disabled="saving || item.stock_tracking === 'serial'"
                            @click="decrementItem(item)"
                          >
                            <i class="fa-solid fa-minus"></i>
                          </button>
                          <input
                            v-model.number="item.quantity"
                            type="number"
                            :min="item.stock_tracking === 'serial' ? 1 : 0.01"
                            :step="item.stock_tracking === 'serial' ? 1 : 0.01"
                            class="erp-input sale-line-compact-input pos-quantity-stepper-input text-center font-semibold"
                            :disabled="item.stock_tracking === 'serial'"
                            @input="syncTrackedQuantity(item)"
                          />
                          <button
                            type="button"
                            class="pos-quantity-stepper-button"
                            :disabled="saving || item.stock_tracking === 'serial'"
                            @click="incrementItem(item)"
                          >
                            <i class="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>

                      <div class="pos-line-price-cell">
                        <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="erp-input sale-line-compact-input pos-cart-price-input text-right font-semibold" />
                      </div>

                      <div class="pos-line-total-cell">
                        <div class="pos-line-total-primary">
                          {{ formatAccountingMoney(lineTotal(item)) }}
                        </div>
                        <div class="pos-line-total-secondary">
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

                    <p v-if="item.tracked_error" class="pos-line-row-error">
                      {{ item.tracked_error }}
                    </p>
                  </article>
                </div>
              </div>
            </div>

            <div class="pos-pricing-footer">
              <article class="pos-pricing-card pos-pricing-card-discount">
                <div class="pos-pricing-card-heading">
                  <span class="pos-pricing-card-icon">
                    <i class="fa-solid fa-tag"></i>
                  </span>
                  <span>Discount</span>
                </div>

                <div class="pos-pricing-card-body">
                  <div class="pos-pricing-control">
                    <label class="erp-label">Discount mode</label>
                    <AppSelect
                      :model-value="form.discount_scope"
                      :options="discountScopeOptions"
                      @update:model-value="handleDiscountScopeChange"
                    />
                  </div>

                  <div v-if="!showLineDiscountControls" class="pos-pricing-control">
                    <label class="erp-label">{{ t('sales.documentModal.fields.orderDiscountType') }}</label>
                    <AppSelect
                      :model-value="form.discount_type || null"
                      :options="discountTypeOptions"
                      :placeholder="t('sales.documentModal.placeholders.selectDiscountType')"
                      clearable
                      @update:model-value="form.discount_type = $event || ''"
                    />
                  </div>

                  <div v-if="!showLineDiscountControls" class="pos-pricing-control">
                    <label class="erp-label">{{ t('sales.documentModal.fields.orderDiscountAmount') }}</label>
                    <input
                      v-model.number="form.discount_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="erp-input pos-pricing-input"
                      :placeholder="t('sales.documentModal.placeholders.enterDiscount')"
                    />
                  </div>
                </div>
              </article>

              <article class="pos-pricing-card pos-pricing-card-tax">
                <div class="pos-pricing-card-heading">
                  <span class="pos-pricing-card-icon">
                    <i class="fa-solid fa-percent"></i>
                  </span>
                  <span>Tax</span>
                </div>

                <div class="pos-pricing-card-body">
                  <div class="pos-pricing-control">
                    <label class="erp-label">{{ t('sales.documentModal.fields.taxMode') }}</label>
                    <AppSelect
                      :model-value="form.tax_scope || 'line'"
                      :options="taxScopeOptions"
                      @update:model-value="handleTaxScopeChange"
                    />
                  </div>

                  <div v-if="form.tax_scope === 'sale'" class="pos-pricing-control">
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

                  <div v-if="form.tax_scope === 'sale'" class="pos-pricing-control">
                    <label class="erp-label">{{ t('sales.documentModal.fields.saleTaxType') }}</label>
                    <AppSelect
                      :model-value="form.tax_type || null"
                      :options="taxTypeOptions"
                      :placeholder="t('sales.documentModal.placeholders.selectSaleTaxType')"
                      @update:model-value="form.tax_type = $event || 'exclusive'"
                    />
                  </div>
                </div>
              </article>
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
                <strong>{{ formatAccountingMoney(summarySubtotal) }}</strong>
              </div>
              <div class="pos-total-cell pos-total-discount">
                <span>Discount</span>
                <strong>-{{ formatAccountingMoney(totalDiscountAmount) }}</strong>
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
                    :model-value="paymentRows[0]?.method || null"
                    :options="paymentMethodOptions"
                    @update:model-value="paymentRows[0].method = $event || 'cash'"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.paymentAccount') }}</label>
                  <AppSelect
                    :model-value="paymentRows[0]?.payment_account_id || null"
                    :options="paymentAccountOptions"
                    :placeholder="t('sales.salesPage.placeholders.selectPaymentAccount')"
                    searchable
                    @update:model-value="paymentRows[0].payment_account_id = $event || ''"
                  />
                </div>

                <div>
                  <label class="erp-label">{{ t('sales.posPage.fields.paidAmount') }}</label>
                  <input v-model.number="paymentRows[0].amount" type="number" min="0" step="0.01" class="erp-input text-right font-semibold" />
                </div>

                <div class="rounded-[8px] border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-200">
                  <div class="flex items-center justify-between gap-3">
                    <span>{{ t('sales.posPage.summary.change') }}</span>
                    <span class="font-semibold">{{ formatAccountingMoney(changeDue) }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <input v-model="paymentRows[0].reference" type="text" class="erp-input" :placeholder="t('sales.posPage.fields.reference')" />
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
                  :key="product.menu_key || product.id"
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
                  <span class="pos-product-meta" :class="product.sku ? 'pos-product-meta-sku' : ''" :title="product.sku || product.category?.name || t('sales.shared.notRecorded')">
                    {{ product.sku || product.category?.name || t('sales.shared.notRecorded') }}
                  </span>
                  <span class="pos-product-meta-secondary">
                    {{ product.brand?.name || product.unit?.short_name || t('sales.documentModal.fields.unit') }}
                  </span>
                  <span
                    v-if="productRequiresLookup(product)"
                    class="pos-product-stock pos-product-stock-warning"
                  >
                    {{ t('sales.posPage.productBrowser.lookupRequired') }}
                  </span>
                  <span
                    v-else-if="product.available_quantity !== null && product.available_quantity !== undefined && form.warehouse_id"
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

    <SalePaymentModal
      :show="paymentModalOpen"
      :title="t('sales.posPage.actions.multiplePay')"
      icon="payment"
      size="xl"
      :intro-text="'Finalize the payment method, account, and tendered amount before saving this POS sale.'"
      :summary-label="t('sales.posPage.summary.total')"
      :summary-value="grandTotal"
      :form="paymentRows[0]"
      :payments="paymentRows"
      :payment-account-options="paymentAccountOptions"
      :payment-method-options="paymentMethodOptions"
      :account-label="t('sales.posPage.fields.paymentAccount')"
      :method-label="t('sales.posPage.fields.paymentMethod')"
      :amount-label="t('sales.posPage.fields.paidAmount')"
      :payment-date-label="t('sales.salesPage.fields.paymentDate')"
      :reference-label="t('sales.posPage.fields.reference')"
      :note-label="t('sales.posPage.fields.note')"
      :account-placeholder="t('sales.salesPage.placeholders.selectPaymentAccount')"
      :method-placeholder="t('sales.salesPage.placeholders.selectPaymentMethod')"
      :reference-placeholder="t('sales.posPage.fields.reference')"
      :note-placeholder="t('sales.posPage.fields.note')"
      :show-note="false"
      :error="paymentValidationMessage"
      :saving="saving"
      allow-multiple-rows
      :cancel-label="t('sales.shared.actions.cancel')"
      :confirm-label="t('sales.shared.actions.finalizePosSale')"
      @close="paymentModalOpen = false"
      @add-row="addPaymentRow"
      @remove-row="removePaymentRow"
      @confirm="submitFinalized"
    >
      <template #extra>
        <div class="space-y-3">
          <div>
            <label class="erp-label">{{ t('sales.posPage.fields.note') }}</label>
            <input v-model="form.notes" type="text" class="erp-input" :placeholder="t('sales.posPage.fields.note')" />
          </div>

          <div class="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-200">
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('sales.posPage.summary.change') }}</span>
              <span class="font-semibold">{{ formatAccountingMoney(changeDue) }}</span>
            </div>
          </div>
        </div>
      </template>
    </SalePaymentModal>

    <AppModal
      :show="lineModal.show"
      title="Line details"
      icon="POS line"
      size="lg"
      mobile-full-screen
      @close="closeLineModal"
    >
      <div v-if="lineModal.item" class="space-y-4">
        <div class="rounded-[8px] border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/35">
          <div class="font-semibold text-slate-950 dark:text-white">
            {{ lineModal.item.product_name || t('sales.shared.notRecorded') }}
            <span v-if="lineModal.item.variation_name" class="text-slate-500 dark:text-slate-400">/ {{ lineModal.item.variation_name }}</span>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span v-if="lineModal.item.sku" class="erp-badge erp-badge-neutral px-2 text-[11px]">SKU: {{ lineModal.item.sku }}</span>
            <span v-if="selectedUnitOption(lineModal.item)?.label" class="erp-badge erp-badge-info px-2 text-[11px]">
              {{ selectedUnitOption(lineModal.item)?.label }}
            </span>
            <span class="erp-badge erp-badge-neutral px-2 text-[11px]">
              {{ formatAccountingMoney(lineTotal(lineModal.item)) }}
            </span>
          </div>
        </div>

        <section class="pos-line-modal-card">
          <div class="pos-line-modal-heading">
            <span class="pos-line-modal-icon"><i class="fa-solid fa-barcode"></i></span>
            <span>Tracking</span>
          </div>

          <div v-if="lineModal.item.stock_tracking === 'lot' || lineModal.item.stock_tracking === 'serial'" class="grid gap-3 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="erp-label">
                {{ lineModal.item.stock_tracking === 'lot' ? t('sales.posPage.tracking.lot') : t('sales.posPage.tracking.serial') }}
              </label>
              <AppSelect
                v-if="lineModal.item.stock_tracking === 'lot'"
                :model-value="selectedLotId(lineModal.item) || null"
                :options="trackingOptionsFor(lineModal.item)"
                :placeholder="t('sales.posPage.tracking.lotPlaceholder')"
                :empty-text="trackingEmptyText(lineModal.item)"
                searchable
                clearable
                @update:model-value="handleLotSelection(lineModal.item, $event)"
              />
              <AppSelect
                v-else
                :model-value="selectedSerialIds(lineModal.item)"
                :options="trackingOptionsFor(lineModal.item)"
                :placeholder="t('sales.posPage.tracking.serialPlaceholder')"
                :empty-text="trackingEmptyText(lineModal.item)"
                multiple
                searchable
                clearable
                @update:model-value="handleSerialSelection(lineModal.item, $event)"
              />
            </div>

            <div v-if="lineModal.item.stock_tracking === 'lot'">
              <label class="erp-label">{{ t('sales.posPage.tracking.expiry') }}</label>
              <input
                :value="lineModal.item.tracked_expiry_date || ''"
                type="text"
                class="erp-input"
                :placeholder="t('sales.posPage.tracking.expiryPlaceholder')"
                readonly
              />
            </div>
          </div>

          <div v-else class="rounded-[8px] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            No lot or serial tracking is required for this line.
          </div>

          <p v-if="lineModal.item.tracked_error" class="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
            {{ lineModal.item.tracked_error }}
          </p>
        </section>

        <section class="pos-line-modal-card">
          <div class="pos-line-modal-heading">
            <span class="pos-line-modal-icon pos-line-modal-icon-discount"><i class="fa-solid fa-tag"></i></span>
            <span>Line discount</span>
          </div>

          <div v-if="showLineDiscountControls" class="grid gap-3 md:grid-cols-2">
            <div>
              <label class="erp-label">{{ t('sales.documentModal.fields.lineDiscount') }}</label>
              <AppSelect
                :model-value="lineModal.item.discount_type || null"
                :options="discountTypeOptions"
                :placeholder="t('sales.documentModal.placeholders.selectDiscountType')"
                clearable
                @update:model-value="lineModal.item.discount_type = $event || ''"
              />
            </div>
            <div>
              <label class="erp-label">{{ t('sales.documentModal.fields.orderDiscountAmount') }}</label>
              <input
                v-model.number="lineModal.item.discount_amount"
                type="number"
                min="0"
                step="0.01"
                class="erp-input text-right"
                :placeholder="t('sales.documentModal.placeholders.enterDiscount')"
              />
            </div>
          </div>

          <div v-else class="rounded-[8px] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            Discount mode is set to whole invoice, so line discount is not applied.
          </div>
        </section>

        <section class="pos-line-modal-card">
          <div class="pos-line-modal-heading">
            <span class="pos-line-modal-icon pos-line-modal-icon-note"><i class="fa-solid fa-align-left"></i></span>
            <span>Line note / description</span>
          </div>
          <textarea
            v-model="lineModal.item.notes"
            rows="4"
            class="erp-input min-h-[7rem]"
            :placeholder="t('sales.documentModal.fields.lineNote')"
          ></textarea>
        </section>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button type="button" class="erp-button-primary" @click="closeLineModal">Done</button>
        </div>
      </template>
    </AppModal>

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
        <button type="button" class="pos-action-primary" :disabled="saving || !cart.length" @click="openMultiplePay">
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
import * as inventoryApi from '@api/inventory'
import * as productsApi from '@api/products'
import * as salesApi from '@api/sales'
import * as taxRatesApi from '@api/taxRates'
import * as warehousesApi from '@api/warehouses'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import SalePaymentModal from '@components/sales/SalePaymentModal.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import { useAuthStore } from '@stores/auth'
import { formatAccountingMoney } from '@/utils/accounting'
import { formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const BASE_UNIT_OPTION_VALUE = '__base_unit__'
const DEFAULT_DISCOUNT_SCOPE = 'sale'
const DEFAULT_TAX_SCOPE = 'sale'

const loading = ref(true)
const saving = ref(false)
const attemptedSubmit = ref(false)
const paymentModalOpen = ref(false)
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const products = ref([])
const registers = ref([])
const paymentAccounts = ref([])
const taxRates = ref([])
const cart = ref([])
const filterMode = ref('category')
const activeFilterId = ref('')
const productSearch = ref('')

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const lineModal = reactive({ show: false, item: null })
const form = reactive({
  branch_id: '',
  warehouse_id: '',
  customer_id: '',
  cash_register_session_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  discount_scope: DEFAULT_DISCOUNT_SCOPE,
  discount_type: '',
  discount_amount: 0,
  tax_scope: DEFAULT_TAX_SCOPE,
  tax_rate_id: '',
  tax_rate_type: '',
  tax_rate: 0,
  tax_type: 'exclusive',
  notes: '',
})
const createPaymentRow = (overrides = {}) => ({
  payment_account_id: '',
  amount: 0,
  method: 'cash',
  reference: '',
  payment_date: new Date().toISOString().slice(0, 10),
  note: '',
  ...overrides,
})
const paymentRows = ref([createPaymentRow()])

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

const normalizeTrackingText = (value) => String(value || '').trim().toLowerCase()
const formatStockQuantity = (value) => {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return '0'
  }

  return numeric.toFixed(4).replace(/\.?0+$/, '')
}

const productMenuItems = computed(() =>
  products.value.flatMap((product) => {
    const variations = Array.isArray(product.variations)
      ? product.variations.filter((variation) => variation.is_active !== false)
      : []

    if (product.type === 'variable' && variations.length) {
      return variations.map((variation) => ({
        ...product,
        menu_key: `variation:${variation.id}`,
        product_id: product.id,
        variation_id: variation.id,
        product_name: product.name,
        variation_name: variation.name,
        name: `${product.name} / ${variation.name}`,
        sku: variation.sku || product.sku || '',
        image_url: variation.image_url || product.image_url || '',
        selling_price: variation.selling_price ?? product.variable_selling_price_min ?? product.selling_price,
        purchase_price: variation.purchase_price ?? product.variable_purchase_price_min ?? product.purchase_price,
        sub_unit_id: variation.sub_unit_id || '',
        sub_unit: variation.sub_unit || null,
        sub_unit_selling_price: variation.sub_unit_selling_price ?? null,
        minimum_selling_price: variation.minimum_selling_price ?? product.minimum_selling_price ?? 0,
        on_hand_quantity: variation.on_hand_quantity ?? null,
        reserved_quantity: variation.reserved_quantity ?? null,
        available_quantity: variation.available_quantity ?? null,
        is_variation_tile: true,
      }))
    }

    return [{
      ...product,
      menu_key: `product:${product.id}`,
      product_id: product.id,
      variation_id: '',
      product_name: product.name,
      variation_name: '',
      is_variation_tile: false,
    }]
  })
)

const filteredProducts = computed(() => {
  const term = productSearch.value.trim().toLowerCase()

  return productMenuItems.value
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
        product.product_name,
        product.variation_name,
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

const discountScopeOptions = computed(() => [
  { value: 'line', label: t('sales.documentModal.taxScopes.line') },
  { value: 'sale', label: 'Whole invoice' },
])

const taxScopeOptions = computed(() => [
  { value: 'line', label: t('sales.documentModal.taxScopes.line') },
  { value: 'sale', label: t('sales.documentModal.taxScopes.sale') },
])

const taxTypeOptions = computed(() => [
  { value: 'exclusive', label: t('sales.documentModal.taxTypes.exclusive') },
  { value: 'inclusive', label: t('sales.documentModal.taxTypes.inclusive') },
])

const showLineDiscountControls = computed(() => form.discount_scope === 'line')

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
const lineDiscountAmount = (item) =>
  showLineDiscountControls.value
    ? resolveDiscountAmount(item.discount_type, item.discount_amount, lineGross(item))
    : 0

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

const lineNetTotal = (item) => {
  const gross = lineTaxable(item)
  return item.tax_type === 'inclusive' ? gross : gross + lineTaxAmount(item)
}

const lineTotal = (item) =>
  form.tax_scope === 'sale'
    ? lineBaseAmount(item)
    : lineNetTotal(item)

const summarySubtotal = computed(() => cart.value.reduce((carry, item) => carry + lineGross(item), 0))
const subtotal = computed(() => cart.value.reduce((carry, item) => carry + lineBaseAmount(item), 0))
const lineDiscountTotal = computed(() => cart.value.reduce((carry, item) => carry + lineDiscountAmount(item), 0))
const orderDiscountAmount = computed(() =>
  form.discount_scope === 'sale'
    ? resolveDiscountAmount(form.discount_type, form.discount_amount, subtotal.value)
    : 0
)
const totalDiscountAmount = computed(() => lineDiscountTotal.value + orderDiscountAmount.value)
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
const taxTotal = computed(() =>
  form.tax_scope === 'sale'
    ? documentTaxAmount.value
    : cart.value.reduce((carry, item) => carry + lineTaxAmount(item), 0)
)
const grandTotal = computed(() => Math.max(0, subtotal.value - orderDiscountAmount.value) + taxTotal.value)
const totalQuantity = computed(() => cart.value.reduce((carry, item) => carry + Number(item.quantity || 0), 0))
const totalPaid = computed(() => paymentRows.value.reduce((sum, row) => sum + Number(row.amount || 0), 0))
const changeDue = computed(() => Math.max(0, totalPaid.value - grandTotal.value))

const saleTaxRateOptions = computed(() =>
  taxRates.value.map((taxRate) => ({
    value: taxRate.id,
    label: taxRate.name,
    description: taxRate.type === 'fixed'
      ? `${t('sales.documentModal.taxRateTypes.fixed')} • ${formatAccountingMoney(Number(taxRate.rate || 0))}`
      : `${t('sales.documentModal.taxRateTypes.percentage')} • ${Number(taxRate.rate || 0).toFixed(2)}%`,
  }))
)

const normalizedItems = computed(() =>
  cart.value
    .map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id || null,
      sub_unit_id: item.sub_unit_id || null,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      discount_type: showLineDiscountControls.value ? (item.discount_type || null) : null,
      discount_amount: showLineDiscountControls.value ? Number(item.discount_amount || 0) : 0,
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

  const trackedItem = cart.value.find((item) =>
    item.stock_tracking === 'lot'
      ? item.lot_allocations.length === 0
      : item.stock_tracking === 'serial'
        ? item.serial_ids.length === 0
        : false
  )

  if (trackedItem) {
    return trackedItem.stock_tracking === 'lot'
      ? t('sales.posPage.tracking.lotRequired')
      : t('sales.posPage.tracking.serialRequired')
  }

  const trackedError = cart.value.find((item) => item.tracked_error)

  if (trackedError?.tracked_error) {
    return trackedError.tracked_error
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

  const invalidRow = paymentRows.value.find((row) =>
    (Number(row.amount || 0) > 0 || row.payment_account_id || row.reference?.trim() || row.note?.trim())
    && (!row.payment_account_id || Number(row.amount || 0) <= 0 || !row.payment_date)
  )

  if (invalidRow) {
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

const openLineModal = (item) => {
  lineModal.item = item
  lineModal.show = true
}

const closeLineModal = () => {
  lineModal.show = false
  lineModal.item = null
}

const handleDiscountScopeChange = (value) => {
  form.discount_scope = value || 'line'
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

  const selected = taxRates.value.find((taxRate) => taxRate.id === form.tax_rate_id)

  if (!selected) {
    form.tax_rate_type = ''
    form.tax_rate = 0
    return
  }

  form.tax_rate_type = selected.type || 'percentage'
  form.tax_rate = Number(selected.rate || 0)
}

const openMultiplePay = () => {
  attemptedSubmit.value = true

  if (validationMessage.value) {
    showToast('danger', validationMessage.value)
    return
  }

  if (!form.cash_register_session_id) {
    showToast('danger', t('sales.documentModal.validation.missingRegisterSession'))
    return
  }

  if (!paymentRows.value[0].amount || totalPaid.value < Number(grandTotal.value)) {
    paymentRows.value[0].amount = Number((Number(paymentRows.value[0].amount || 0) + (grandTotal.value - totalPaid.value)).toFixed(2))
  }

  paymentModalOpen.value = true
}

const addPaymentRow = () => {
  const lastRow = paymentRows.value[paymentRows.value.length - 1] || {}
  paymentRows.value.push(createPaymentRow({
    payment_account_id: lastRow.payment_account_id || '',
    method: lastRow.method || 'cash',
    payment_date: lastRow.payment_date || form.sale_date,
  }))
}

const removePaymentRow = (index) => {
  if (paymentRows.value.length === 1) {
    return
  }

  paymentRows.value.splice(index, 1)
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

const trackingOptionsFor = (item) => Array.isArray(item?.tracking_options) ? item.tracking_options : []
const trackingRecordsFor = (item) => Array.isArray(item?.tracking_records) ? item.tracking_records : []
const selectedLotId = (item) => item?.lot_allocations?.[0]?.lot_id || ''
const selectedSerialIds = (item) => Array.isArray(item?.serial_ids) ? item.serial_ids : []

const trackingEmptyText = (item) => {
  if (item?.tracking_loading) {
    return 'Loading inventory...'
  }

  return item?.stock_tracking === 'lot'
    ? 'No available lots found.'
    : 'No available serials found.'
}

const clearTrackedSelection = (item) => {
  item.lot_allocations = []
  item.serial_ids = []
  item.lot_numbers = []
  item.serial_numbers = []
  item.tracked_expiry_date = ''
  item.tracked_error = ''
}

const lotOptionDescription = (lot) => {
  const parts = [`Avail: ${formatStockQuantity(lot.qty_available ?? lot.qty_on_hand ?? 0)}`]

  if (lot.expiry_date) {
    parts.push(`Expiry: ${lot.expiry_date}`)
  }

  return parts.join(' • ')
}

const serialOptionDescription = (serial) => {
  const parts = [serial.status || 'in_stock']

  if (serial.unit_cost !== null && serial.unit_cost !== undefined) {
    parts.push(formatAccountingMoney(Number(serial.unit_cost || 0)))
  }

  return parts.join(' • ')
}

const loadTrackingOptionsForItem = async (item) => {
  if (!['lot', 'serial'].includes(item?.stock_tracking) || !form.warehouse_id || !item.product_id) {
    item.tracking_options = []
    item.tracking_records = []
    return
  }

  item.tracking_loading = true
  item.tracked_error = ''

  const params = {
    warehouse_id: form.warehouse_id,
    product_id: item.product_id,
    variation_id: item.variation_id || undefined,
    per_page: 100,
  }

  try {
    if (item.stock_tracking === 'lot') {
      const response = await inventoryApi.getStockLots({
        ...params,
        status: 'active',
      })
      const lots = (Array.isArray(response.data?.data) ? response.data.data : [])
        .filter((lot) => Number(lot.qty_available ?? lot.qty_on_hand ?? 0) > 0)

      item.tracking_records = lots
      item.tracking_options = lots.map((lot) => ({
        value: lot.id,
        label: lot.lot_number,
        description: lotOptionDescription(lot),
        keywords: [
          lot.lot_number,
          lot.product?.name,
          lot.variation?.name,
        ].filter(Boolean).join(' '),
      }))
      return
    }

    const response = await inventoryApi.getStockSerials(params)
    const serials = (Array.isArray(response.data?.data) ? response.data.data : [])
      .filter((serial) => ['in_stock', 'returned'].includes(serial.status))

    item.tracking_records = serials
    item.tracking_options = serials.map((serial) => ({
      value: serial.id,
      label: serial.serial_number,
      description: serialOptionDescription(serial),
      keywords: [
        serial.serial_number,
        serial.product?.name,
        serial.variation?.name,
        serial.status,
      ].filter(Boolean).join(' '),
    }))
  } catch (error) {
    item.tracking_records = []
    item.tracking_options = []
    item.tracked_error = error.response?.data?.message || t('sales.posPage.toast.failed')
  } finally {
    item.tracking_loading = false
  }
}

const handleLotSelection = (item, lotId) => {
  clearTrackedSelection(item)

  if (!lotId) {
    return
  }

  const lot = trackingRecordsFor(item).find((candidate) => candidate.id === lotId)

  if (!lot) {
    item.tracked_error = t('sales.posPage.tracking.lotNotFound')
    return
  }

  item.lot_allocations = [{ lot_id: lot.id, quantity: Number(item.quantity || 0) }]
  item.lot_numbers = [lot.lot_number].filter(Boolean)
  item.tracked_expiry_date = lot.expiry_date || ''

  if (!Number(item.unit_cost || 0) && lot.unit_cost) {
    item.unit_cost = Number(lot.unit_cost)
  }
}

const handleSerialSelection = (item, serialIds) => {
  clearTrackedSelection(item)

  const ids = Array.isArray(serialIds) ? serialIds : []
  const serials = ids
    .map((serialId) => trackingRecordsFor(item).find((candidate) => candidate.id === serialId))
    .filter(Boolean)

  item.serial_ids = serials.map((serial) => serial.id)
  item.serial_numbers = serials.map((serial) => serial.serial_number).filter(Boolean)

  if (item.serial_ids.length) {
    item.quantity = item.serial_ids.length
  }

  if (!Number(item.unit_cost || 0) && serials[0]?.unit_cost) {
    item.unit_cost = Number(serials[0].unit_cost)
  }
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
      existing.manual_serial_input = existing.serial_numbers.join(', ')
      existing.quantity = existing.serial_ids.length
    } else {
      existing.quantity = Number(existing.quantity || 0) + 1
      if (match.lot_id && existing.lot_allocations.length === 1) {
        existing.manual_lot_input = match.lot_number || existing.manual_lot_input
        existing.lot_numbers = match.lot_number ? [match.lot_number] : existing.lot_numbers
        existing.tracked_expiry_date = match.expiry_date || existing.tracked_expiry_date
      }
    }

    syncTrackedQuantity(existing)
    loadTrackingOptionsForItem(existing)
    return
  }

  const tax = deriveProductTax(match.product_id)
  const product = productMap.value.get(match.product_id)
  const lookupUnitState = buildLookupUnitState(match)

  const line = {
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
    manual_lot_input: match.lot_number || '',
    manual_serial_input: match.serial_number || '',
    tracked_expiry_date: match.expiry_date || '',
    tracked_error: '',
    notes: '',
    tracking_options: [],
    tracking_records: [],
    tracking_loading: false,
    ...lookupUnitState,
    ...tax,
  }

  cart.value.push(line)
  loadTrackingOptionsForItem(line)
}

const addProductTile = (product) => {
  if (productRequiresLookup(product)) {
    showToast('danger', t('sales.posPage.toast.lookupRequired'))
    return
  }

  addLookupItem({
    product_id: product.product_id || product.id,
    variation_id: product.variation_id || '',
    product_name: product.product_name || product.name,
    variation_name: product.variation_name || '',
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

const productRequiresLookup = (product) =>
  !product?.variation_id && product?.type === 'variable' && Number(product?.variations_count || 0) > 0

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

  if (lineModal.item?.key === key) {
    closeLineModal()
  }
}

const clearCart = () => {
  cart.value = []
  closeLineModal()
  paymentRows.value = [createPaymentRow({
    payment_date: form.sale_date,
  })]
  form.discount_scope = DEFAULT_DISCOUNT_SCOPE
  form.discount_type = ''
  form.discount_amount = 0
  form.tax_scope = DEFAULT_TAX_SCOPE
  form.tax_rate_id = ''
  form.tax_rate_type = ''
  form.tax_rate = 0
  form.tax_type = 'exclusive'
  form.notes = ''
  attemptedSubmit.value = false
  paymentModalOpen.value = false
}

const buildPayload = (type) => ({
  branch_id: form.branch_id,
  warehouse_id: form.warehouse_id,
  customer_id: form.customer_id || null,
  type,
  sale_date: form.sale_date,
  due_date: null,
  cash_register_session_id: type === 'pos_sale' ? form.cash_register_session_id || null : null,
  discount_type: form.discount_scope === 'sale' ? (form.discount_type || null) : null,
  discount_amount: form.discount_scope === 'sale' ? Number(form.discount_amount || 0) : 0,
  tax_scope: form.tax_scope || 'line',
  tax_rate_id: form.tax_scope === 'sale' ? (form.tax_rate_id || null) : null,
  tax_rate_type: form.tax_scope === 'sale' ? (form.tax_rate_type || null) : null,
  tax_rate: form.tax_scope === 'sale' ? Number(form.tax_rate || 0) : 0,
  tax_type: form.tax_scope === 'sale' ? (form.tax_type || null) : null,
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

    const payments = paymentRows.value
      .map((row) => ({
        payment_account_id: row.payment_account_id || '',
        amount: Number(row.amount || 0),
        method: row.method || 'cash',
        payment_date: row.payment_date || form.sale_date,
        reference: row.reference?.trim() || '',
        note: row.note?.trim() || '',
      }))
      .filter((row) => row.payment_account_id && row.amount > 0)

    for (const payment of payments) {
      await salesApi.recordSalePayment(sale.id, {
        payment_account_id: payment.payment_account_id,
        amount: payment.amount,
        method: payment.method,
        payment_date: payment.payment_date,
        reference: payment.reference || null,
        note: payment.note || null,
      })
    }

    paymentModalOpen.value = false
    showToast('success', t('sales.posPage.toast.finalized'))
    clearCart()
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.posPage.toast.failed'))
  } finally {
    saving.value = false
  }
}

const submitCash = () => {
  paymentRows.value = [createPaymentRow({
    method: 'cash',
    amount: Number(grandTotal.value.toFixed(2)),
    payment_date: form.sale_date,
    note: form.notes,
  })]
  submitFinalized()
}

const submitCard = () => {
  paymentRows.value = [createPaymentRow({
    method: 'card',
    amount: Number(grandTotal.value.toFixed(2)),
    payment_date: form.sale_date,
    note: form.notes,
  })]
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

const loadTaxRates = async () => {
  const response = await taxRatesApi.getTaxRates({ per_page: 250, is_active: true })
  taxRates.value = response.data.data
}

watch(grandTotal, (value) => {
  if (!paymentRows.value[0]?.amount || totalPaid.value < Number(value)) {
    paymentRows.value[0].amount = Number((Number(paymentRows.value[0].amount || 0) + (value - totalPaid.value)).toFixed(2))
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
      loadTaxRates(),
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

.pos-sale-panel {
  position: relative;
  z-index: 20;
  overflow: visible;
}

.pos-cart-panel {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 22rem;
  flex: 1;
  flex-direction: column;
  overflow: visible;
  padding: 0;
}

.pos-cart-panel .pos-panel-topline {
  margin-bottom: 0;
  padding: 0.85rem 0.9rem 0.55rem;
}

.pos-cart-header {
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.98);
  min-width: 44rem;
  padding: 0.3rem 0.45rem;
  color: rgb(100 116 139);
  font-size: 0.62rem;
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

.pos-cart-table {
  width: 100%;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-gutter: stable;
}

.pos-cart-list {
  display: flex;
  max-height: none;
  min-height: 0;
  min-width: 44rem;
  flex-direction: column;
  gap: 0.22rem;
  overflow: visible;
  padding: 0.35rem;
}

.pos-cart-line-grid {
  display: grid;
  grid-template-columns:
    minmax(15rem, 1.8fr)
    minmax(6.5rem, 0.65fr)
    6.5rem
    6.2rem
    6.6rem
    2rem;
  align-items: center;
  gap: 0.35rem;
  min-width: 44rem;
}

.pos-cart-row {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88));
  padding: 0.3rem 0.4rem;
  box-shadow: none;
}

.pos-line-product-cell,
.pos-line-unit-cell,
.pos-line-quantity-cell,
.pos-line-price-cell,
.pos-line-total-cell {
  min-width: 0;
}

.pos-line-product-name {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  color: rgb(15 23 42);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.2;
  text-align: left;
  overflow-wrap: anywhere;
  white-space: normal;
  transition: color 150ms ease;
}

.pos-line-product-name:hover {
  color: rgb(3 105 161);
}

.pos-line-product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.22rem;
  overflow: visible;
  margin-top: 0.16rem;
}

.pos-line-product-meta .erp-badge {
  min-height: 1rem;
  max-width: none;
  flex: 0 0 auto;
  overflow: visible;
  padding: 0 0.32rem;
  font-size: 0.58rem;
  font-weight: 800;
  white-space: nowrap;
}

.pos-line-product-meta .pos-line-sku-badge {
  max-width: none;
  flex: 0 0 auto;
}

.pos-line-empty-value {
  display: flex;
  min-height: 1.75rem;
  align-items: center;
  justify-content: center;
  color: rgb(148 163 184);
  font-size: 0.75rem;
  font-weight: 700;
}

.pos-line-total-cell {
  text-align: right;
}

.pos-line-total-primary {
  color: rgb(15 23 42);
  font-size: 0.78rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  white-space: nowrap;
}

.pos-line-total-secondary {
  margin-top: 0.05rem;
  color: rgb(148 163 184);
  font-size: 0.62rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  white-space: nowrap;
}

.pos-line-row-error {
  margin: 0.22rem 0 0;
  color: rgb(225 29 72);
  font-size: 0.68rem;
  font-weight: 700;
}

.pos-quantity-stepper {
  display: grid;
  grid-template-columns: 1.55rem minmax(0, 1fr) 1.55rem;
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
}

.pos-quantity-stepper-button {
  display: inline-flex;
  min-height: 1.75rem;
  align-items: center;
  justify-content: center;
  color: rgb(71 85 105);
  font-size: 0.62rem;
  transition: background-color 150ms ease, color 150ms ease, opacity 150ms ease;
}

.pos-quantity-stepper-button:hover:not(:disabled) {
  background: rgb(224 242 254);
  color: rgb(3 105 161);
}

.pos-quantity-stepper-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.pos-quantity-stepper-input {
  min-width: 0;
  border: 0;
  border-right: 1px solid rgba(226, 232, 240, 0.88);
  border-left: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  appearance: textfield;
  -moz-appearance: textfield;
}

.pos-quantity-stepper-input::-webkit-inner-spin-button,
.pos-quantity-stepper-input::-webkit-outer-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.pos-quantity-stepper-input:focus {
  border-color: rgba(226, 232, 240, 0.88);
  box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.24);
}

.pos-cart-price-input {
  min-height: 1.75rem;
  padding: 0.22rem 0.42rem;
  font-size: 0.75rem;
}

.pos-cart-delete {
  display: inline-flex;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(254, 205, 211, 1);
  border-radius: 6px;
  color: rgb(225 29 72);
  font-size: 0.72rem;
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

.pos-pricing-footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.pos-pricing-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.78);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88));
  padding: 0.65rem;
}

.pos-pricing-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: rgb(14 165 233);
}

.pos-pricing-card-discount::before {
  background: rgb(244 63 94);
}

.pos-pricing-card-tax::before {
  background: rgb(14 165 233);
}

.pos-pricing-card-heading {
  display: flex;
  align-items: center;
  gap: 0.42rem;
  margin-bottom: 0.55rem;
  color: rgb(15 23 42);
  font-size: 0.78rem;
  font-weight: 900;
}

.pos-pricing-card-icon {
  display: inline-flex;
  height: 1.35rem;
  width: 1.35rem;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(14, 165, 233, 0.12);
  color: rgb(3 105 161);
  font-size: 0.65rem;
}

.pos-pricing-card-discount .pos-pricing-card-icon {
  background: rgba(244, 63, 94, 0.1);
  color: rgb(225 29 72);
}

.pos-pricing-card-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
}

.pos-pricing-control {
  min-width: 0;
}

.pos-pricing-control .erp-label {
  margin-bottom: 0.25rem;
  font-size: 0.64rem;
}

.pos-pricing-control :deep(.erp-input),
.pos-pricing-input {
  min-height: 1.9rem;
  padding: 0.25rem 0.48rem;
  font-size: 0.76rem;
}

.pos-line-modal-card {
  border: 1px solid rgba(203, 213, 225, 0.78);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88));
  padding: 0.9rem;
}

.pos-line-modal-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  color: rgb(15 23 42);
  font-size: 0.85rem;
  font-weight: 900;
}

.pos-line-modal-icon {
  display: inline-flex;
  height: 1.55rem;
  width: 1.55rem;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(14, 165, 233, 0.12);
  color: rgb(3 105 161);
  font-size: 0.7rem;
}

.pos-line-modal-icon-discount {
  background: rgba(244, 63, 94, 0.1);
  color: rgb(225 29 72);
}

.pos-line-modal-icon-note {
  background: rgba(16, 185, 129, 0.12);
  color: rgb(4 120 87);
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

.pos-total-discount strong {
  color: rgb(225 29 72);
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
  gap: 0.5rem;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.pos-product-tile {
  display: grid;
  min-height: 7.3rem;
  grid-template-rows: 2.75rem auto auto auto;
  gap: 0.2rem;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88));
  padding: 0.42rem;
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
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.pos-product-meta {
  overflow: hidden;
  color: rgb(100 116 139);
  font-size: 0.6rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-product-meta-sku {
  display: block;
  line-height: 1.1;
  overflow-wrap: anywhere;
  white-space: normal;
}

.pos-product-meta-secondary {
  overflow: hidden;
  color: rgb(148 163 184);
  font-size: 0.58rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-product-stock {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  min-height: 1.05rem;
  border-radius: 999px;
  background: rgba(220, 252, 231, 0.92);
  padding: 0 0.34rem;
  color: rgb(21 128 61);
  font-size: 0.56rem;
  font-weight: 800;
}

.pos-product-stock-warning {
  background: rgba(254, 243, 199, 0.92);
  color: rgb(180 83 9);
}

.pos-product-price {
  color: rgb(4 120 87);
  font-size: 0.72rem;
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
  grid-template-columns: minmax(4.7rem, 5.2rem) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 6px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.86));
  box-shadow: none;
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
  top: 0.42rem;
  right: 0;
  bottom: 0.42rem;
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
  min-height: 1.75rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 0.72rem;
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
  min-height: 1.75rem;
  padding: 0.2rem 0.42rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.sale-line-quantity__fallback {
  display: flex;
  min-height: 1.75rem;
  align-items: center;
  overflow: hidden;
  padding: 0 0.42rem;
  color: rgb(15 23 42);
  font-size: 0.72rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sale-line-compact-input {
  min-height: 1.75rem;
  padding: 0.2rem 0.42rem;
  font-size: 0.75rem;
}

.pos-sale-line-quantity,
.pos-sale-line-discount {
  grid-template-columns: minmax(4.6rem, 5rem) minmax(0, 1fr);
  box-shadow: none;
}

.pos-line-unit-select {
  width: 100%;
  grid-template-columns: 1fr;
}

.pos-line-unit-select .sale-line-quantity__unit {
  min-width: 0;
}

.pos-line-tracking-select {
  min-width: 0;
  width: 100%;
}

.pos-line-unit-select :deep(.erp-input),
.pos-line-tracking-select :deep(.erp-input) {
  min-height: 1.75rem;
  padding: 0.2rem 0.34rem;
  gap: 0.25rem;
  font-size: 0.72rem;
}

.pos-line-tracking-select :deep(.flex.flex-wrap) {
  flex-wrap: nowrap;
  overflow: hidden;
}

.pos-line-tracking-select :deep(.erp-badge) {
  max-width: 4.2rem;
  padding: 0 0.28rem;
  font-size: 0.58rem;
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

.dark .pos-product-stock-warning {
  background: rgba(120, 53, 15, 0.38);
  color: rgb(253 224 71);
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
.dark .pos-pricing-card,
.dark .pos-line-modal-card,
.dark .pos-chip,
.dark .pos-product-tile,
.dark .pos-action-lite,
.dark .pos-action-cancel {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.78);
}

.dark .pos-total-cell strong,
.dark .pos-line-product-name,
.dark .pos-line-total-primary,
.dark .pos-pricing-card-heading,
.dark .pos-line-modal-heading,
.dark .pos-product-name,
.dark .pos-action-lite {
  color: rgb(241 245 249);
}

.dark .pos-line-total-secondary,
.dark .pos-line-empty-value {
  color: rgb(148 163 184);
}

.dark .pos-quantity-stepper {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.76);
}

.dark .pos-quantity-stepper-button {
  color: rgb(203 213 225);
}

.dark .pos-quantity-stepper-button:hover:not(:disabled) {
  background: rgba(8, 47, 73, 0.72);
  color: rgb(165 243 252);
}

.dark .pos-quantity-stepper-input {
  border-color: rgba(51, 65, 85, 0.82);
}

.dark .pos-total-discount strong {
  color: rgb(253 164 175);
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

  .pos-pricing-footer {
    grid-template-columns: 1fr;
  }

  .pos-pricing-card-body {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1024px) {
  .pos-workspace {
    grid-template-columns: minmax(0, 60fr) minmax(24rem, 40fr);
  }

  .pos-product-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pos-totals-bar {
    grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(12rem, 1.25fr);
  }

  .pos-total-payable {
    grid-column: auto;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .pos-product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pos-pricing-card-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .pos-product-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
