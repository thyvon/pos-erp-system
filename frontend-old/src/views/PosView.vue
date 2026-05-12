<template>
  <div class="pos-terminal min-h-screen">
    <header class="pos-terminal-header">
      <div class="pos-header-content">
        <div class="pos-header-main">
          <div class="pos-header-breadcrumb">
            <RouterLink to="/dashboard" class="pos-breadcrumb-link">
              {{ t('layout.nav.dashboard.label') }}
            </RouterLink>
            <span class="pos-breadcrumb-separator">/</span>
            <RouterLink to="/sales" class="pos-breadcrumb-link">
              {{ t('layout.nav.sales.label') }}
            </RouterLink>
          </div>

          <div class="pos-header-title-section">
            <h1 class="pos-header-title">
              {{ t('sales.posPage.title') }}
            </h1>
            <div class="pos-header-badges">
              <span
                class="pos-header-badge"
                :class="
                  form.cash_register_session_id
                    ? 'pos-header-badge-success'
                    : 'pos-header-badge-warning'
                "
              >
                <i class="fa-solid fa-cash-register"></i>
                {{
                  form.cash_register_session_id
                    ? t('sales.posPage.registerReady')
                    : t('sales.posPage.noRegister')
                }}
              </span>
            </div>
          </div>

          <p class="pos-header-subtitle">
            {{ t('sales.posPage.subtitle') }}
          </p>
        </div>

        <div class="pos-header-actions">
          <button
            type="button"
            class="pos-header-button pos-header-button-icon"
            :title="t('sales.posPage.actions.clearCart')"
            :disabled="!cart.length"
            @click="clearCart"
          >
            <i class="fa-solid fa-broom"></i>
            <span class="pos-header-button-tooltip">{{
              t('sales.posPage.actions.clearCart')
            }}</span>
          </button>

          <RouterLink to="/sales/registers" class="pos-header-button">
            <i class="fa-solid fa-cash-register"></i>
            <span>{{ t('layout.nav.cashRegisters.label') }}</span>
          </RouterLink>

          <button
            type="button"
            class="pos-header-button pos-header-button-exit"
            @click="exitPos"
          >
            <i class="fa-solid fa-up-right-from-square"></i>
            <span>{{ t('sales.posPage.actions.exit') }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="w-full space-y-4 px-3 py-3 sm:px-4 sm:py-4 xl:px-5">
      <AppAlert
        v-model:show="alert.show"
        :type="alert.type"
        :title="alert.title"
        :message="alert.message"
      />

      <PageBlurSkeleton v-if="loading" variant="form" />

      <template v-else>
        <section class="pos-workspace">
          <div class="pos-sale-side">
            <div class="pos-panel pos-sale-panel">
              <div class="pos-section-heading">
                <div>
                  <h2 class="pos-section-title">Sale Setup</h2>
                  <p class="pos-section-copy">
                    Set the branch, warehouse, register, and customer first.
                    Then scan or search products to build the sale.
                  </p>
                </div>
              </div>

              <div class="pos-setup-grid">
                <div>
                  <label class="erp-label">{{
                    t('sales.posPage.fields.branch')
                  }}</label>
                  <AppSelect
                    :model-value="form.branch_id || null"
                    :options="branchOptions"
                    :placeholder="
                      t('sales.documentModal.placeholders.selectBranch')
                    "
                    searchable
                    @update:model-value="handleBranchChange"
                  />
                </div>

                <div>
                  <label class="erp-label">{{
                    t('sales.posPage.fields.warehouse')
                  }}</label>
                  <AppSelect
                    :model-value="form.warehouse_id || null"
                    :options="warehouseOptions"
                    :placeholder="
                      form.branch_id
                        ? t('sales.documentModal.placeholders.selectWarehouse')
                        : t(
                            'sales.documentModal.placeholders.selectBranchFirst',
                          )
                    "
                    :disabled="!form.branch_id"
                    searchable
                    @update:model-value="form.warehouse_id = $event || ''"
                  />
                </div>

                <div>
                  <label class="erp-label">{{
                    t('sales.posPage.fields.register')
                  }}</label>
                  <AppSelect
                    :model-value="form.cash_register_session_id || null"
                    :options="registerOptions"
                    :placeholder="
                      registerOptions.length
                        ? t(
                            'sales.documentModal.placeholders.selectRegisterSession',
                          )
                        : t('sales.documentModal.placeholders.noOpenSessions')
                    "
                    clearable
                    searchable
                    @update:model-value="
                      form.cash_register_session_id = $event || ''
                    "
                  />
                </div>

                <div>
                  <label class="erp-label">{{
                    t('sales.posPage.fields.customer')
                  }}</label>
                  <AppSelect
                    :model-value="form.customer_id || null"
                    :options="customerOptions"
                    :placeholder="
                      t('sales.documentModal.placeholders.optionalCustomer')
                    "
                    clearable
                    searchable
                    @update:model-value="form.customer_id = $event || ''"
                  />
                </div>
              </div>

              <div class="pos-scan-block">
                <label class="erp-label">{{
                  t('sales.posPage.scanTitle')
                }}</label>
                <p class="pos-scan-hint">
                  {{
                    form.warehouse_id
                      ? t('sales.posPage.subtitle')
                      : t('sales.posPage.noWarehouseHint')
                  }}
                </p>
                <InventoryProductLookup
                  :warehouse-id="form.warehouse_id"
                  :disabled="!form.warehouse_id"
                  :helper-text="''"
                  @select="addLookupItem"
                />
              </div>

              <div
                v-if="!form.warehouse_id"
                class="mt-3 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200"
              >
                {{ t('sales.posPage.noWarehouseHint') }}
              </div>
            </div>

            <div class="pos-panel pos-cart-panel">
              <div class="pos-panel-topline">
                <div>
                  <h2 class="pos-section-title">
                    {{ t('sales.posPage.cartTitle') }}
                  </h2>
                  <p class="pos-section-copy">
                    Review quantity, unit, pricing, and discount before payment.
                  </p>
                </div>
              </div>

              <div
                v-if="!cart.length"
                class="erp-empty-state pos-cart-empty text-sm text-slate-500 dark:text-slate-400"
              >
                {{ t('sales.posPage.emptyCart') }}
              </div>

              <table v-else class="pos-cart-table">
                <thead class="pos-cart-header">
                  <tr class="pos-cart-line-grid">
                    <th>{{ t('sales.documentModal.fields.product') }}</th>
                    <th>{{ t('sales.documentModal.fields.unit') }}</th>
                    <th class="text-center">{{
                      t('sales.documentModal.fields.quantity')
                    }}</th>
                    <th class="text-right">{{
                      t('sales.documentModal.fields.unitPrice')
                    }}</th>
                    <th class="text-right">{{
                      t('sales.documentModal.fields.subtotal')
                    }}</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody class="pos-cart-list">
                  <template v-for="item in cart" :key="item.key">
                    <tr class="pos-cart-row">
                      <td class="pos-line-product-cell">
                        <div class="pos-line-product-row">
                          <button
                            type="button"
                            class="pos-line-product-name"
                            @click="openLineModal(item)"
                          >
                            {{
                              item.product_name || t('sales.shared.notRecorded')
                            }}
                            <span
                              v-if="item.variation_name"
                              class="text-slate-500 dark:text-slate-400"
                              >/ {{ item.variation_name }}</span
                            >
                          </button>
                          <button
                            type="button"
                            class="pos-line-edit-icon"
                            :title="t('sales.documentModal.editLine')"
                            @click="openLineModal(item)"
                          >
                            <i class="fa-solid fa-edit"></i>
                          </button>
                        </div>
                        <div class="pos-line-product-meta">
                          <span
                            v-if="item.sku"
                            class="erp-badge erp-badge-neutral pos-line-sku-badge"
                            >SKU: {{ item.sku }}</span
                          >
                          <span
                            v-for="lot in item.lot_numbers"
                            :key="`${item.key}-${lot}`"
                            class="erp-badge erp-badge-warning"
                            >Lot: {{ lot }}</span
                          >
                          <span
                            v-for="serial in item.serial_numbers"
                            :key="`${item.key}-${serial}`"
                            class="erp-badge erp-badge-info"
                            >Serial: {{ serial }}</span
                          >
                          <span
                            v-if="item.tracked_expiry_date"
                            class="erp-badge erp-badge-neutral"
                            >Exp: {{ item.tracked_expiry_date }}</span
                          >
                          <span
                            v-if="lineDiscountAmount(item) > 0"
                            class="erp-badge erp-badge-danger"
                          >
                            -{{
                              formatAccountingMoney(lineDiscountAmount(item))
                            }}
                          </span>
                          <span
                            v-if="item.notes"
                            class="erp-badge erp-badge-neutral"
                            >Note</span
                          >
                        </div>
                      </td>

                      <td class="pos-line-unit-cell">
                        <div class="sale-line-quantity pos-line-unit-select">
                          <div class="sale-line-quantity__unit !col-span-2">
                            <AppSelect
                              v-if="unitOptionsFor(item).length"
                              :model-value="selectedUnitValue(item)"
                              :options="unitOptionsFor(item)"
                              :placeholder="
                                t('sales.documentModal.fields.unit')
                              "
                              @update:model-value="
                                handleLineUnitChange(item, $event)
                              "
                            />
                            <div v-else class="sale-line-quantity__fallback">
                              {{
                                selectedUnitOption(item)?.label ||
                                t('sales.documentModal.baseUnit')
                              }}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td class="pos-line-quantity-cell">
                        <div class="pos-quantity-stepper">
                          <button
                            type="button"
                            class="pos-quantity-stepper-button"
                            :disabled="
                              saving || item.stock_tracking === 'serial'
                            "
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
                            :disabled="
                              saving || item.stock_tracking === 'serial'
                            "
                            @click="incrementItem(item)"
                          >
                            <i class="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </td>

                      <td class="pos-line-price-cell">
                        <input
                          v-model.number="item.unit_price"
                          type="number"
                          min="0"
                          step="0.01"
                          class="erp-input sale-line-compact-input pos-cart-price-input text-right font-semibold"
                        />
                      </td>

                      <td class="pos-line-total-cell">
                        <div class="pos-line-total-primary">
                          {{ formatAccountingMoney(lineTotal(item)) }}
                        </div>
                        <div class="pos-line-total-secondary">
                          {{ formatAccountingMoney(lineGross(item)) }}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          class="pos-cart-delete"
                          :disabled="saving"
                          :title="t('sales.documentModal.removeLine')"
                          @click="removeItem(item.key)"
                        >
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="item.tracked_error" :key="`${item.key}-error`">
                      <td colspan="6" class="pos-line-row-error">
                        {{ item.tracked_error }}
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>

              <div v-if="cart.length" class="pos-cart-summary-footer">

                <div class="pos-cart-summary-row">
                  <div class="pos-cart-summary-item">
                    <span class="pos-cart-summary-label">{{
                      t('sales.posPage.summary.subtotal')
                    }}</span>
                    <strong class="pos-cart-summary-value">{{
                      formatAccountingMoney(summarySubtotal)
                    }}</strong>
                  </div>

                  <div 
                    class="pos-cart-summary-item pos-cart-summary-clickable"
                    @click="openDiscountModal"
                  >
                    <span class="pos-cart-summary-label">{{
                      t('sales.documentModal.fields.lineDiscount')
                    }}</span>
                    <strong class="pos-cart-summary-value"
                      >-{{ formatAccountingMoney(totalDiscountAmount) }}</strong
                    >
                  </div>

                  <div 
                    class="pos-cart-summary-item pos-cart-summary-clickable"
                    @click="openTaxModal"
                  >
                    <span class="pos-cart-summary-label">{{
                      t('sales.posPage.summary.tax')
                    }}</span>
                    <strong class="pos-cart-summary-value">{{
                      formatAccountingMoney(taxTotal)
                    }}</strong>
                  </div>

                  <div class="pos-cart-summary-item pos-cart-summary-total">
                    <span class="pos-cart-summary-label">{{
                      t('sales.posPage.summary.total')
                    }}</span>
                    <strong class="pos-cart-summary-value">{{
                      formatAccountingMoney(grandTotal)
                    }}</strong>
                  </div>
                </div>

                <section class="pos-checkout-section">
                  <div class="pos-checkout-heading" @click="checkoutCollapsed = !checkoutCollapsed">
                    <span class="pos-checkout-title">{{
                      t('sales.posPage.checkout')
                    }}</span>
                    <span class="pos-checkout-hint">{{
                      t('sales.posPage.subtitle')
                    }}</span>
                    <i :class="checkoutCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'" class="pos-collapse-icon"></i>
                  </div>

                  <div v-show="!checkoutCollapsed" class="pos-checkout-body">

                  <!-- Sell Note -->
                  <div class="pos-sell-note">
                    <label class="erp-label">{{
                      t('sales.posPage.fields.note')
                    }}</label>
                    <textarea
                      v-model="form.notes"
                      rows="2"
                      class="erp-input pos-sell-note-input"
                      :placeholder="t('sales.posPage.fields.note')"
                    ></textarea>
                  </div>

                  <!-- Payment Table -->
                  <div class="pos-payment-table">
                    <div class="pos-payment-header">
                      <div class="pos-payment-grid">
                        <span>{{ t('sales.shared.methods.payment') }}</span>
                        <span>{{
                          t('sales.posPage.fields.paymentAccount')
                        }}</span>
                        <span class="text-right">{{
                          t('sales.posPage.fields.paidAmount')
                        }}</span>
                        <span>{{ t('sales.salesPage.fields.reference') }}</span>
                        <span></span>
                      </div>
                    </div>

                    <div class="pos-payment-list">
                      <div
                        v-for="(payment, index) in paymentRows"
                        :key="payment.key || index"
                        class="pos-payment-row"
                      >
                        <div class="pos-payment-grid">
                          <div class="pos-payment-method">
                            <AppSelect
                              :model-value="payment.method || null"
                              :options="paymentMethodOptions"
                              :placeholder="
                                t(
                                  'sales.salesPage.placeholders.selectPaymentMethod',
                                )
                              "
                              @update:model-value="
                                payment.method = $event || 'cash'
                              "
                            />
                          </div>
                          <div class="pos-payment-account">
                            <AppSelect
                              :model-value="payment.payment_account_id || null"
                              :options="paymentAccountOptions"
                              :placeholder="
                                t(
                                  'sales.salesPage.placeholders.selectPaymentAccount',
                                )
                              "
                              searchable
                              @update:model-value="
                                payment.payment_account_id = $event || ''
                              "
                            />
                          </div>
                          <div class="pos-payment-amount">
                            <input
                              v-model.number="payment.amount"
                              type="number"
                              min="0"
                              step="0.01"
                              class="erp-input pos-payment-amount-input text-right font-semibold"
                              :placeholder="'0.00'"
                            />
                          </div>
                          <div class="pos-payment-reference">
                            <input
                              v-model="payment.reference"
                              type="text"
                              class="erp-input pos-payment-reference-input"
                              :placeholder="t('sales.posPage.fields.reference')"
                            />
                          </div>
                          <div class="pos-payment-actions">
                            <button
                              type="button"
                              class="pos-payment-remove"
                              :disabled="paymentRows.length === 1"
                              :title="t('sales.documentModal.removeLine')"
                              @click="removePaymentRow(index)"
                            >
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Add Payment Button -->
                    <div class="pos-payment-add">
                      <button
                        type="button"
                        class="pos-payment-add-button"
                        :disabled="saving"
                        @click="addPaymentRow"
                      >
                        <i class="fa-solid fa-plus"></i>
                        <span>{{ t('sales.posPage.actions.addPayment') }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Payment Summary -->
                  <div class="pos-payment-summary">
                    <div class="pos-payment-summary-row">
                      <span class="pos-payment-summary-label">{{
                        t('sales.posPage.summary.total')
                      }}</span>
                      <strong class="pos-payment-summary-value">{{
                        formatAccountingMoney(grandTotal)
                      }}</strong>
                    </div>
                    <div class="pos-payment-summary-row">
                      <span class="pos-payment-summary-label">{{
                        t('sales.posPage.summary.totalPaid')
                      }}</span>
                      <strong class="pos-payment-summary-value">{{
                        formatAccountingMoney(totalPaid)
                      }}</strong>
                    </div>
                    <div
                      class="pos-payment-summary-row pos-payment-summary-change"
                    >
                      <span class="pos-payment-summary-label">{{
                        t('sales.posPage.summary.change')
                      }}</span>
                      <strong class="pos-payment-summary-value">{{
                        formatAccountingMoney(changeDue)
                      }}</strong>
                    </div>
                  </div>

                  <!-- Checkout Actions -->
                  <div class="pos-checkout-actions">
                    <button
                      type="button"
                      class="pos-checkout-button pos-checkout-button-cash"
                      :disabled="saving || !cart.length"
                      @click="submitCash"
                    >
                      <span
                        v-if="saving"
                        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      ></span>
                      <i v-else class="fa-solid fa-money-bill-wave"></i>
                      <span>{{ t('sales.posPage.actions.cash') }}</span>
                    </button>
                    <button
                      type="button"
                      class="pos-checkout-button pos-checkout-button-card"
                      :disabled="saving || !cart.length"
                      @click="submitCard"
                    >
                      <i class="fa-solid fa-credit-card"></i>
                      <span>{{ t('sales.posPage.actions.card') }}</span>
                    </button>
                    <button
                      type="button"
                      class="pos-checkout-button pos-checkout-button-primary"
                      :disabled="saving || !cart.length"
                      @click="submitFinalized"
                    >
                      <i class="fa-solid fa-money-check-dollar"></i>
                      <span>{{
                        t('sales.shared.actions.finalizePosSale')
                      }}</span>
                    </button>
                  </div>
                  </div>
                </section>
              </div>
            </div>

            <div
              v-if="checkoutMessage"
              class="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
            >
              {{ checkoutMessage }}
            </div>
          </div>

          <aside class="pos-product-side">
            <div class="pos-panel pos-product-panel">
              <div class="pos-section-heading">
                <div>
                  <h2 class="pos-section-title">Product Browser</h2>
                  <p class="pos-section-copy">
                    Filter by category or brand, then tap a tile to add it to
                    the current sale.
                  </p>
                </div>
                <div class="pos-inline-stats">
                  <span class="pos-inline-stat"
                    >{{ filteredProducts.length }}
                    {{ t('sales.posPage.summary.items') }}</span
                  >
                  <span
                    class="pos-inline-stat"
                    :class="form.warehouse_id ? 'pos-inline-stat-active' : ''"
                  >
                    {{
                      form.warehouse_id
                        ? selectedWarehouse?.name ||
                          t('sales.posPage.fields.warehouse')
                        : t('sales.posPage.noWarehouseHint')
                    }}
                  </span>
                </div>
              </div>

              <div class="pos-browser-toolbar">
                <div class="pos-browser-mode">
                  <button
                    type="button"
                    class="pos-filter-button"
                    :class="
                      filterMode === 'category'
                        ? 'pos-filter-button-active'
                        : ''
                    "
                    @click="filterMode = 'category'"
                  >
                    <i class="fa-solid fa-layer-group"></i>
                    {{ t('sales.posPage.productBrowser.categories') }}
                  </button>
                  <button
                    type="button"
                    class="pos-filter-button"
                    :class="
                      filterMode === 'brand' ? 'pos-filter-button-active' : ''
                    "
                    @click="filterMode = 'brand'"
                  >
                    <i class="fa-solid fa-award"></i>
                    {{ t('sales.posPage.productBrowser.brands') }}
                  </button>
                </div>

                <div class="pos-browser-search">
                  <input
                    v-model="productSearch"
                    type="text"
                    class="erp-input"
                    :placeholder="
                      t('sales.posPage.productBrowser.searchProducts')
                    "
                  />
                </div>
              </div>

              <div class="pos-chip-strip">
                <button
                  type="button"
                  class="pos-chip"
                  :class="activeFilterId === '' ? 'pos-chip-active' : ''"
                  @click="clearProductFilter"
                >
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

              <div
                v-if="filteredProducts.length === 0"
                class="erp-empty-state py-12 text-sm text-slate-500 dark:text-slate-400"
              >
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
                  <div class="pos-product-image-container">
                    <span v-if="product.image_url" class="pos-product-image">
                      <img :src="product.image_url" :alt="product.name" />
                    </span>
                    <span
                      v-else
                      class="pos-product-image pos-product-image-empty"
                    >
                      <i class="fa-solid fa-box-open"></i>
                    </span>
                  </div>

                  <div class="pos-product-content">
                    <div class="pos-product-header">
                      <span class="pos-product-name">{{ product.name }}</span>
                      <span
                        v-if="product.variation_name"
                        class="pos-product-variation"
                        >{{ product.variation_name }}</span
                      >
                    </div>

                    <div class="pos-product-footer">
                      <span
                        v-if="productRequiresLookup(product)"
                        class="pos-product-stock pos-product-stock-warning"
                      >
                        <i class="fa-solid fa-search"></i>
                      </span>
                      <span
                        v-else-if="
                          product.available_quantity !== null &&
                          product.available_quantity !== undefined &&
                          form.warehouse_id
                        "
                        class="pos-product-stock"
                        :class="
                          product.available_quantity > 0
                            ? 'pos-product-stock-available'
                            : 'pos-product-stock-low'
                        "
                      >
                        <i class="fa-solid fa-cube"></i>
                        {{ product.available_quantity }}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </section>
      </template>
    </main>

    <AppModal
      :show="lineModal.show"
      title="Edit Line Item"
      icon="fa-solid fa-edit"
      @close="closeLineModal"
    >
      <div v-if="lineModal.item" class="pos-line-modal-compact">
        <!-- Product Header -->
        <div class="pos-line-modal-header">
          <div class="pos-line-modal-product-info">
            <div class="pos-line-modal-product-name">
              {{ lineModal.item.product_name || t('sales.shared.notRecorded') }}
              <span
                v-if="lineModal.item.variation_name"
                class="pos-line-modal-variation"
                >/ {{ lineModal.item.variation_name }}</span
              >
            </div>
            <div class="pos-line-modal-badges">
              <span
                v-if="lineModal.item.sku"
                class="pos-line-modal-badge"
                >SKU: {{ lineModal.item.sku }}</span
              >
              <span
                v-if="selectedUnitOption(lineModal.item)?.label"
                class="pos-line-modal-badge pos-line-modal-badge-unit"
              >
                {{ selectedUnitOption(lineModal.item)?.label }}
              </span>
              <span class="pos-line-modal-badge pos-line-modal-badge-price">
                {{ formatAccountingMoney(lineTotal(lineModal.item)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Compact Form Grid -->
        <div class="pos-line-modal-grid">
          <!-- Tracking Section -->
          <div
            v-if="
              lineModal.item.stock_tracking === 'lot' ||
              lineModal.item.stock_tracking === 'serial'
            "
            class="pos-line-modal-section"
          >
            <div class="pos-line-modal-section-header">
              <i class="fa-solid fa-barcode"></i>
              <span>{{
                lineModal.item.stock_tracking === 'lot'
                  ? t('sales.posPage.tracking.lot')
                  : t('sales.posPage.tracking.serial')
              }}</span>
            </div>
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
              @update:model-value="
                handleSerialSelection(lineModal.item, $event)
              "
            />
            <input
              v-if="lineModal.item.stock_tracking === 'lot'"
              :value="lineModal.item.tracked_expiry_date || ''"
              type="text"
              class="erp-input pos-line-modal-expiry"
              :placeholder="t('sales.posPage.tracking.expiryPlaceholder')"
              readonly
            />
          </div>

          <!-- Discount Section -->
          <div
            v-if="showLineDiscountControls"
            class="pos-line-modal-section"
          >
            <div class="pos-line-modal-section-header">
              <i class="fa-solid fa-tag"></i>
              <span>{{ t('sales.documentModal.fields.lineDiscount') }}</span>
            </div>
            <div class="pos-line-modal-discount-grid">
              <AppSelect
                :model-value="lineModal.item.discount_type || null"
                :options="discountTypeOptions"
                :placeholder="
                  t('sales.documentModal.placeholders.selectDiscountType')
                "
                clearable
                @update:model-value="
                  lineModal.item.discount_type = $event || ''
                "
              />
              <input
                v-model.number="lineModal.item.discount_amount"
                type="number"
                min="0"
                step="0.01"
                class="erp-input text-right"
                :placeholder="
                  t('sales.documentModal.placeholders.enterDiscount')
                "
              />
            </div>
          </div>

          <!-- Tax Section -->
          <div class="pos-line-modal-section">
            <div class="pos-line-modal-section-header">
              <i class="fa-solid fa-percent"></i>
              <span>{{ t('sales.documentModal.fields.saleTax') }}</span>
            </div>
            <AppSelect
              :model-value="lineModal.item.tax_rate_id || null"
              :options="saleTaxRateOptions"
              :placeholder="
                t('sales.documentModal.placeholders.selectSaleTax')
              "
              :empty-text="t('sales.documentModal.placeholders.noTaxes')"
              searchable
              clearable
              @update:model-value="
                handleLineTaxRateChange(lineModal.item, $event)
              "
            />
            <div
              v-if="lineModal.item.tax_rate_id"
              class="pos-line-modal-tax-info"
            >
              <div class="pos-line-modal-tax-details">
                <div class="pos-line-modal-tax-name">
                  {{ lineModal.item.tax_rate_name || 'Tax' }}
                </div>
                <div class="pos-line-modal-tax-rate">
                  {{
                    lineModal.item.tax_rate_type === 'fixed'
                      ? formatAccountingMoney(lineModal.item.tax_rate)
                      : `${Number(lineModal.item.tax_rate || 0).toFixed(2)}%`
                  }}
                  ·
                  {{
                    lineModal.item.tax_type === 'inclusive'
                      ? t('sales.documentModal.taxTypes.inclusive')
                      : t('sales.documentModal.taxTypes.exclusive')
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Note Section -->
          <div class="pos-line-modal-section pos-line-modal-section-full">
            <div class="pos-line-modal-section-header">
              <i class="fa-solid fa-align-left"></i>
              <span>{{ t('sales.documentModal.fields.lineNote') }}</span>
            </div>
            <textarea
              v-model="lineModal.item.notes"
              rows="2"
              class="erp-input pos-line-modal-textarea"
              :placeholder="t('sales.documentModal.fields.lineNote')"
            ></textarea>
          </div>
        </div>

        <!-- Error Message -->
        <p
          v-if="lineModal.item.tracked_error"
          class="pos-line-modal-error"
        >
          {{ lineModal.item.tracked_error }}
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="erp-btn erp-btn-primary erp-btn-sm"
          @click="closeLineModal"
        >
          {{ t('shared.actions.done') }}
        </button>
      </template>
    </AppModal>

    <div class="pos-action-bar">
      <div class="pos-action-inner">
        <div class="pos-action-buttons">
          <button
            type="button"
            class="pos-action-cancel"
            :disabled="saving || !cart.length"
            @click="clearCart"
          >
            <i class="fa-solid fa-window-close"></i>
            {{ t('sales.posPage.actions.clearCart') }}
          </button>
          <button
            type="button"
            class="pos-action-lite"
            :disabled="saving || !cart.length"
            @click="submitSuspended"
          >
            <i class="fa-solid fa-pause"></i>
            {{ t('sales.posPage.actions.suspend') }}
          </button>
          <button
            type="button"
            class="pos-action-lite"
            :disabled="saving || !cart.length"
            @click="submitCard"
          >
            <i class="fa-solid fa-credit-card"></i>
            {{ t('sales.posPage.actions.card') }}
          </button>
          <button
            type="button"
            class="pos-action-primary"
            :disabled="saving || !cart.length"
            @click="openMultiplePay"
          >
            <i class="fa-solid fa-money-check-dollar"></i>
            {{ t('sales.posPage.actions.multiplePay') }}
          </button>
          <button
            type="button"
            class="pos-action-cash"
            :disabled="saving || !cart.length"
            @click="submitCash"
          >
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
  </div>

  <!-- Discount Modal -->
  <AppModal
    v-model:show="discountModalOpen"
    :title="t('sales.documentModal.fields.lineDiscount')"
    size="md"
    @close="closeDiscountModal"
  >
    <div class="space-y-6">
      <div class="pos-cart-pricing-control">
        <label class="erp-label">{{
          t('sales.posPage.pricing.discountMode')
        }}</label>
        <div class="pos-radio-group">
          <label class="pos-radio">
            <input
              v-model="form.discount_scope"
              type="radio"
              value="line"
            />
            <span>{{
              discountScopeOptions[0]?.label || 'Line'
            }}</span>
          </label>
          <label class="pos-radio">
            <input
              v-model="form.discount_scope"
              type="radio"
              value="sale"
              checked
            />
            <span>{{
              discountScopeOptions[1]?.label || 'Whole invoice'
            }}</span>
          </label>
        </div>
      </div>

      <div
        v-if="form.discount_scope === 'sale'"
        class="grid gap-3 sm:grid-cols-2"
      >
        <div class="pos-cart-pricing-control">
          <label class="erp-label">{{
            t('sales.documentModal.fields.orderDiscountType')
          }}</label>
          <AppSelect
            :model-value="form.discount_type || null"
            :options="discountTypeOptions"
            :placeholder="
              t(
                'sales.documentModal.placeholders.selectDiscountType',
              )
            "
            clearable
            @update:model-value="
              form.discount_type = $event || ''
            "
          />
        </div>

        <div class="pos-cart-pricing-control">
          <label class="erp-label">{{
            t('sales.documentModal.fields.orderDiscountAmount')
          }}</label>
          <input
            v-model.number="form.discount_amount"
            type="number"
            min="0"
            step="0.01"
            class="erp-input"
            :placeholder="
              t(
                'sales.documentModal.placeholders.enterDiscount',
              )
            "
          />
        </div>
      </div>

      <div
        v-else
        class="rounded-[10px] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
      >
        {{ t('sales.posPage.pricing.lineDiscountModeHint') }}
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="erp-btn erp-btn-secondary"
        @click="closeDiscountModal"
      >
        {{ t('shared.actions.close') }}
      </button>
    </template>
  </AppModal>

  <!-- Tax Modal -->
  <AppModal
    v-model:show="taxModalOpen"
    :title="t('sales.documentModal.fields.tax')"
    size="md"
    @close="closeTaxModal"
  >
    <div class="space-y-6">
      <div class="pos-cart-pricing-control">
        <label class="erp-label">{{
          t('sales.documentModal.fields.taxMode')
        }}</label>
        <div class="pos-radio-group">
          <label class="pos-radio">
            <input
              v-model="form.tax_scope"
              type="radio"
              value="line"
              @change="
                handleTaxScopeChange($event.target.value)
              "
            />
            <span>{{
              taxScopeOptions[0]?.label || 'Line'
            }}</span>
          </label>
          <label class="pos-radio">
            <input
              v-model="form.tax_scope"
              type="radio"
              value="sale"
              checked
              @change="
                handleTaxScopeChange($event.target.value)
              "
            />
            <span>{{
              taxScopeOptions[1]?.label || 'Sale'
            }}</span>
          </label>
        </div>
      </div>

      <div
        v-if="form.tax_scope === 'sale'"
        class="grid gap-3 sm:grid-cols-2"
      >
        <div class="pos-cart-pricing-control">
          <label class="erp-label">{{
            t('sales.documentModal.fields.saleTax')
          }}</label>
          <AppSelect
            :model-value="form.tax_rate_id || null"
            :options="saleTaxRateOptions"
            :placeholder="
              t(
                'sales.documentModal.placeholders.selectSaleTax',
              )
            "
            :search-placeholder="
              t('sales.documentModal.placeholders.searchTaxes')
            "
            :empty-text="
              t('sales.documentModal.placeholders.noTaxes')
            "
            searchable
            clearable
            @update:model-value="handleSaleTaxRateChange"
          />
        </div>

        <div class="pos-cart-pricing-control">
          <label class="erp-label">{{
            t('sales.documentModal.fields.saleTaxType')
          }}</label>
          <AppSelect
            :model-value="form.tax_type || null"
            :options="taxTypeOptions"
            :placeholder="
              t(
                'sales.documentModal.placeholders.selectSaleTaxType',
              )
            "
            @update:model-value="
              form.tax_type = $event || 'exclusive'
            "
          />
        </div>
      </div>

      <div
        v-else
        class="rounded-[10px] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400"
      >
        {{ t('sales.posPage.pricing.lineTaxModeHint') }}
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="erp-btn erp-btn-secondary"
        @click="closeTaxModal"
      >
        {{ t('shared.actions.close') }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import * as accountingApi from '@api/accounting'
import * as brandsApi from '@api/brands'
import * as categoriesApi from '@api/categories'
import * as branchesApi from '@api/branches'
import * as customersApi from '@api/customers'
import * as inventoryApi from '@api/inventory'
import * as productsApi from '@api/products'
import * as salesApi from '@api/sales'
import * as taxRatesApi from '@api/taxRates'
import * as warehousesApi from '@api/warehouses'
import InventoryProductLookup from '@components/inventory/InventoryProductLookup.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@stores/auth'
import { usePosStore, toFiniteNumber } from '@stores/pos'
import { formatAccountingMoney } from '@/utils/accounting'
import { formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const BASE_UNIT_OPTION_VALUE = '__base_unit__'

const loading = ref(true)
const saving = ref(false)
const attemptedSubmit = ref(false)
const paymentModalOpen = ref(false)
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const products = ref([])
const categories = ref([])
const brands = ref([])
const registers = ref([])
const paymentAccounts = ref([])
const taxRates = ref([])
const posStore = usePosStore()
// `form` is a reactive() object — access it directly so property mutations stay reactive.
// Other state (cart, paymentRows) and all computeds come from storeToRefs.
const form = posStore.form
const {
  cart,
  paymentRows,
  showLineDiscountControls,
  summarySubtotal,
  subtotal,
  lineDiscountTotal,
  orderDiscountAmount,
  totalDiscountAmount,
  documentTaxAmount,
  taxTotal,
  grandTotal,
  totalQuantity,
  totalPaid,
  changeDue,
} = storeToRefs(posStore)
const {
  createPaymentRow,
  lineGross,
  lineDiscountAmount,
  lineTaxable,
  lineBaseAmount,
  lineTaxAmount,
  lineNetTotal,
  lineTotal,
  clearCart: storeClearCart,
  deriveProductTax,
} = posStore

const filterMode = ref('category')
const activeFilterId = ref('')
const productSearch = ref('')

// Collapsible sections state
const discountCollapsed = ref(false)
const taxCollapsed = ref(false)
const checkoutCollapsed = ref(false)

// Modal state
const discountModalOpen = ref(false)
const taxModalOpen = ref(false)

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const lineModal = reactive({ show: false, item: null })

const productMap = computed(
  () => new Map(products.value.map((product) => [product.id, product])),
)

const categoryFilters = computed(() =>
  categories.value.map((c) => ({ id: c.id, name: c.name })),
)
const brandFilters = computed(() =>
  brands.value.map((b) => ({ id: b.id, name: b.name })),
)
const activeFilters = computed(() =>
  filterMode.value === 'brand' ? brandFilters.value : categoryFilters.value,
)

const productPrice = (product) =>
  toFiniteNumber(
    product.selling_price ??
      product.variable_selling_price_min ??
      product.sub_unit_selling_price,
    0,
  )

const normalizeTrackingText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
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
        selling_price:
          variation.selling_price ??
          product.variable_selling_price_min ??
          product.selling_price,
        purchase_price:
          variation.purchase_price ??
          product.variable_purchase_price_min ??
          product.purchase_price,
        sub_unit_id: variation.sub_unit_id || '',
        sub_unit: variation.sub_unit || null,
        sub_unit_selling_price: variation.sub_unit_selling_price ?? null,
        minimum_selling_price:
          variation.minimum_selling_price ?? product.minimum_selling_price ?? 0,
        on_hand_quantity: variation.on_hand_quantity ?? null,
        reserved_quantity: variation.reserved_quantity ?? null,
        available_quantity: variation.available_quantity ?? null,
        is_variation_tile: true,
      }))
    }

    return [
      {
        ...product,
        menu_key: `product:${product.id}`,
        product_id: product.id,
        variation_id: '',
        product_name: product.name,
        variation_name: '',
        is_variation_tile: false,
      },
    ]
  }),
)

const filteredProducts = computed(() => productMenuItems.value)

const branchOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  })),
)

const warehouseOptions = computed(() =>
  warehouses.value
    .filter(
      (warehouse) => !form.branch_id || warehouse.branch_id === form.branch_id,
    )
    .map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
      description: warehouse.branch?.name || warehouse.code || '',
    })),
)

const selectedWarehouse = computed(
  () =>
    warehouses.value.find((warehouse) => warehouse.id === form.warehouse_id) ||
    null,
)

const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    value: customer.id,
    label: customer.name,
    description: customer.phone || customer.code || '',
  })),
)

const registerOptions = computed(() =>
  registers.value
    .filter(
      (register) => !form.branch_id || register.branch_id === form.branch_id,
    )
    .map((register) => ({
      value: register.current_open_session.id,
      label: register.name,
      description: `${register.branch?.name || t('sales.shared.notRecorded')} • ${formatHumanDateTime(register.current_open_session.opened_at)}`,
    })),
)

const paymentAccountOptions = computed(() =>
  paymentAccounts.value.map((account) => ({
    value: account.id,
    label: account.name,
    description: account.account_type || account.type || '',
  })),
)

const paymentMethodOptions = computed(() => [
  { value: 'cash', label: t('sales.shared.methods.cash') },
  { value: 'card', label: t('sales.shared.methods.card') },
  { value: 'bank_transfer', label: t('sales.shared.methods.bank_transfer') },
  { value: 'cheque', label: t('sales.shared.methods.cheque') },
  { value: 'other', label: t('sales.shared.methods.other') },
])

const defaultPaymentAccountId = computed(
  () => paymentAccountOptions.value[0]?.value || '',
)

const quickPay = reactive({
  method: 'cash',
  payment_account_id: '',
  amount: 0,
})

watch(
  [grandTotal, defaultPaymentAccountId],
  () => {
    if (!quickPay.payment_account_id && defaultPaymentAccountId.value) {
      quickPay.payment_account_id = defaultPaymentAccountId.value
    }

    const numericAmount = Number(quickPay.amount || 0)
    if (!numericAmount && Number(grandTotal.value) > 0) {
      quickPay.amount = Number(Number(grandTotal.value).toFixed(2))
    }
  },
  { immediate: true },
)

const discountTypeOptions = computed(() => [
  { value: 'fixed', label: t('sales.documentModal.discountTypes.fixed') },
  {
    value: 'percentage',
    label: t('sales.documentModal.discountTypes.percentage'),
  },
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

const saleTaxRateOptions = computed(() =>
  taxRates.value.map((taxRate) => ({
    value: taxRate.id,
    label: taxRate.name,
    description:
      taxRate.type === 'fixed'
        ? `${t('sales.documentModal.taxRateTypes.fixed')} • ${formatAccountingMoney(Number(taxRate.rate || 0))}`
        : `${t('sales.documentModal.taxRateTypes.percentage')} • ${Number(taxRate.rate || 0).toFixed(2)}%`,
  })),
)

const normalizedItems = computed(() =>
  cart.value
    .map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id || null,
      sub_unit_id: item.sub_unit_id || null,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      discount_type: showLineDiscountControls.value
        ? item.discount_type || null
        : null,
      discount_amount: showLineDiscountControls.value
        ? Number(item.discount_amount || 0)
        : 0,
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
    .filter((item) => item.product_id && item.quantity > 0),
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
        : false,
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

  const invalidRow = paymentRows.value.find(
    (row) =>
      (Number(row.amount || 0) > 0 ||
        row.payment_account_id ||
        row.reference?.trim() ||
        row.note?.trim()) &&
      (!row.payment_account_id ||
        Number(row.amount || 0) <= 0 ||
        !row.payment_date),
  )

  if (invalidRow) {
    return t('sales.posPage.paymentRequired')
  }

  return ''
})

const checkoutMessage = computed(
  () => validationMessage.value || paymentValidationMessage.value,
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = t(
    type === 'danger'
      ? 'sales.shared.toast.errorTitle'
      : 'sales.shared.toast.successTitle',
  )
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
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

const openDiscountModal = () => {
  discountModalOpen.value = true
}

const closeDiscountModal = () => {
  discountModalOpen.value = false
}

const openTaxModal = () => {
  taxModalOpen.value = true
}

const closeTaxModal = () => {
  taxModalOpen.value = false
}

// Pricing controls are now inline (no modal).

const handleDiscountScopeChange = (value) => {
  form.discount_scope = value || 'sale'
}

const handleTaxScopeChange = (value) => {
  form.tax_scope = value || 'sale'

  if (form.tax_scope !== 'sale') {
    form.tax_rate_id = ''
    form.tax_rate_type = ''
    form.tax_rate = 0
    form.tax_type = 'exclusive'
  }
}

const handleSaleTaxRateChange = (value) => {
  form.tax_rate_id = value || ''

  const selected = taxRates.value.find(
    (taxRate) => taxRate.id === form.tax_rate_id,
  )

  if (!selected) {
    form.tax_rate_type = ''
    form.tax_rate = 0
    return
  }

  form.tax_rate_type = selected.type || 'percentage'
  form.tax_rate = Number(selected.rate || 0)
}

const handleLineTaxRateChange = (item, value) => {
  item.tax_rate_id = value || ''

  if (!item.tax_rate_id) {
    item.tax_rate_name = ''
    item.tax_rate_type = ''
    item.tax_rate = 0
    item.tax_type = ''
    return
  }

  const selected = taxRates.value.find(
    (taxRate) => taxRate.id === item.tax_rate_id,
  )

  if (!selected) {
    item.tax_rate_name = ''
    item.tax_rate_type = ''
    item.tax_rate = 0
    return
  }

  item.tax_rate_name = selected.name || ''
  item.tax_rate_type = selected.type || 'percentage'
  item.tax_rate = Number(selected.rate || 0)

  if (!item.tax_type) {
    item.tax_type = 'exclusive'
  }
}

const openMultiplePay = () => {
  attemptedSubmit.value = true

  if (validationMessage.value) {
    showToast('danger', validationMessage.value)
    return
  }

  if (!form.cash_register_session_id) {
    showToast(
      'danger',
      t('sales.documentModal.validation.missingRegisterSession'),
    )
    return
  }

  if (
    !paymentRows.value[0].amount ||
    totalPaid.value < Number(grandTotal.value)
  ) {
    paymentRows.value[0].amount = Number(
      (
        Number(paymentRows.value[0].amount || 0) +
        (grandTotal.value - totalPaid.value)
      ).toFixed(2),
    )
  }

  if (defaultPaymentAccountId.value) {
    for (const row of paymentRows.value) {
      if (!row.payment_account_id) {
        row.payment_account_id = defaultPaymentAccountId.value
      }
    }
  }

  paymentModalOpen.value = true
}

const submitQuickPay = async () => {
  attemptedSubmit.value = true

  if (validationMessage.value) {
    showToast('danger', validationMessage.value)
    return
  }

  if (!form.cash_register_session_id) {
    showToast(
      'danger',
      t('sales.documentModal.validation.missingRegisterSession'),
    )
    return
  }

  const paymentAccountId =
    quickPay.payment_account_id || defaultPaymentAccountId.value || ''

  paymentRows.value = [
    createPaymentRow({
      payment_account_id: paymentAccountId,
      method: quickPay.method || 'cash',
      amount: Number(
        (quickPay.amount || Number(grandTotal.value || 0)).toFixed(2),
      ),
      payment_date: form.sale_date,
      note: form.notes,
    }),
  ]

  if (paymentValidationMessage.value) {
    showToast('danger', paymentValidationMessage.value)
    return
  }

  await submitFinalized()
}

const addPaymentRow = () => {
  const lastRow = paymentRows.value[paymentRows.value.length - 1] || {}
  paymentRows.value.push(
    createPaymentRow({
      payment_account_id: lastRow.payment_account_id || '',
      method: lastRow.method || 'cash',
      payment_date: lastRow.payment_date || form.sale_date,
    }),
  )
}

const removePaymentRow = (index) => {
  if (paymentRows.value.length === 1) {
    return
  }

  paymentRows.value.splice(index, 1)
}

const handleBranchChange = (value) => {
  form.branch_id = value || ''

  if (
    !warehouses.value.some(
      (warehouse) =>
        warehouse.id === form.warehouse_id &&
        warehouse.branch_id === form.branch_id,
    )
  ) {
    form.warehouse_id = ''
  }

  if (
    !registers.value.some(
      (register) =>
        register.current_open_session?.id === form.cash_register_session_id &&
        register.branch_id === form.branch_id,
    )
  ) {
    form.cash_register_session_id = ''
  }
}

const buildUnitOptionLabel = (unit) => {
  if (!unit) {
    return t('sales.documentModal.baseUnit')
  }

  return unit.short_name ? `${unit.name} (${unit.short_name})` : unit.name
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
  const stockTracking =
    match.stock_tracking || product?.stock_tracking || 'none'
  const baseUnitPrice = toFiniteNumber(
    match.selling_price ??
      product?.selling_price ??
      product?.variable_selling_price_min,
    0,
  )
  const subUnitPrice = resolveSubUnitPrice(
    match.sub_unit_selling_price ?? product?.sub_unit_selling_price,
    baseUnitPrice,
    subUnit,
  )

  return {
    sub_unit_id: '',
    base_unit_price: baseUnitPrice,
    sub_unit_price: subUnitPrice,
    minimum_selling_price: toFiniteNumber(
      match.minimum_selling_price ?? product?.minimum_selling_price,
      0,
    ),
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

const unitOptionsFor = (item) =>
  Array.isArray(item?.unit_options) ? item.unit_options : []
const selectedUnitValue = (item) => item.sub_unit_id || BASE_UNIT_OPTION_VALUE

const selectedUnitOption = (item) =>
  unitOptionsFor(item).find(
    (option) => option.value === selectedUnitValue(item),
  ) ||
  unitOptionsFor(item)[0] ||
  null

const handleLineUnitChange = (item, value) => {
  const selected = unitOptionsFor(item).find((option) => option.value === value)

  if (!selected) {
    item.sub_unit_id = ''
    return
  }

  item.sub_unit_id = selected.sub_unit_id || ''
  item.unit_price = toFiniteNumber(selected.price, item.unit_price)
}

const trackingOptionsFor = (item) =>
  Array.isArray(item?.tracking_options) ? item.tracking_options : []
const trackingRecordsFor = (item) =>
  Array.isArray(item?.tracking_records) ? item.tracking_records : []
const selectedLotId = (item) => item?.lot_allocations?.[0]?.lot_id || ''
const selectedSerialIds = (item) =>
  Array.isArray(item?.serial_ids) ? item.serial_ids : []

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
  const parts = [
    `Avail: ${formatStockQuantity(lot.qty_available ?? lot.qty_on_hand ?? 0)}`,
  ]

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
  if (
    !['lot', 'serial'].includes(item?.stock_tracking) ||
    !form.warehouse_id ||
    !item.product_id
  ) {
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
      const lots = (
        Array.isArray(response.data?.data) ? response.data.data : []
      ).filter((lot) => Number(lot.qty_available ?? lot.qty_on_hand ?? 0) > 0)

      item.tracking_records = lots
      item.tracking_options = lots.map((lot) => ({
        value: lot.id,
        label: lot.lot_number,
        description: lotOptionDescription(lot),
        keywords: [lot.lot_number, lot.product?.name, lot.variation?.name]
          .filter(Boolean)
          .join(' '),
      }))
      return
    }

    const response = await inventoryApi.getStockSerials(params)
    const serials = (
      Array.isArray(response.data?.data) ? response.data.data : []
    ).filter((serial) => ['in_stock', 'returned'].includes(serial.status))

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
      ]
        .filter(Boolean)
        .join(' '),
    }))
  } catch (error) {
    item.tracking_records = []
    item.tracking_options = []
    item.tracked_error =
      error.response?.data?.message || t('sales.posPage.toast.failed')
  } finally {
    item.tracking_loading = false
  }
}

const handleLotSelection = (item, lotId) => {
  clearTrackedSelection(item)

  if (!lotId) {
    return
  }

  const lot = trackingRecordsFor(item).find(
    (candidate) => candidate.id === lotId,
  )

  if (!lot) {
    item.tracked_error = t('sales.posPage.tracking.lotNotFound')
    return
  }

  item.lot_allocations = [
    { lot_id: lot.id, quantity: Number(item.quantity || 0) },
  ]
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
    .map((serialId) =>
      trackingRecordsFor(item).find((candidate) => candidate.id === serialId),
    )
    .filter(Boolean)

  item.serial_ids = serials.map((serial) => serial.id)
  item.serial_numbers = serials
    .map((serial) => serial.serial_number)
    .filter(Boolean)

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
        if (
          match.serial_number &&
          !existing.serial_numbers.includes(match.serial_number)
        ) {
          existing.serial_numbers.push(match.serial_number)
        }
      }
      existing.manual_serial_input = existing.serial_numbers.join(', ')
      existing.quantity = existing.serial_ids.length
    } else {
      existing.quantity = Number(existing.quantity || 0) + 1
      if (match.lot_id && existing.lot_allocations.length === 1) {
        existing.manual_lot_input =
          match.lot_number || existing.manual_lot_input
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
    lot_allocations: match.lot_id
      ? [{ lot_id: match.lot_id, quantity: 1 }]
      : [],
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
  !product?.variation_id &&
  product?.type === 'variable' &&
  Number(product?.variations_count || 0) > 0

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
  storeClearCart()
  closeLineModal()
  paymentModalOpen.value = false
  attemptedSubmit.value = false
}

const buildPayload = (type) => ({
  branch_id: form.branch_id,
  warehouse_id: form.warehouse_id,
  customer_id: form.customer_id || null,
  type,
  sale_date: form.sale_date,
  due_date: null,
  cash_register_session_id:
    type === 'pos_sale' ? form.cash_register_session_id || null : null,
  discount_type:
    form.discount_scope === 'sale' ? form.discount_type || null : null,
  discount_amount:
    form.discount_scope === 'sale' ? Number(form.discount_amount || 0) : 0,
  tax_scope: form.tax_scope || 'sale',
  tax_rate_id: form.tax_scope === 'sale' ? form.tax_rate_id || null : null,
  tax_rate_type: form.tax_scope === 'sale' ? form.tax_rate_type || null : null,
  tax_rate: form.tax_scope === 'sale' ? Number(form.tax_rate || 0) : 0,
  tax_type: form.tax_scope === 'sale' ? form.tax_type || null : null,
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
    showToast(
      'danger',
      error.response?.data?.message || t('sales.posPage.toast.failed'),
    )
  } finally {
    saving.value = false
  }
}

const submitFinalized = async () => {
  attemptedSubmit.value = true

  if (validationMessage.value) {
    showToast('danger', validationMessage.value)
    return
  }

  // Validate payments
  const validPayments = paymentRows.value.filter(
    (row) => row.payment_account_id && Number(row.amount || 0) > 0,
  )

  if (validPayments.length === 0) {
    showToast('danger', 'At least one valid payment is required')
    return
  }

  if (Number(totalPaid.value) < Number(grandTotal.value)) {
    showToast('danger', 'Total paid amount must be at least the sale total')
    return
  }

  saving.value = true

  try {
    const created = await salesApi.createSale(buildPayload('pos_sale'))
    const sale = created.data.data
    await salesApi.completeSale(sale.id)

    const payments = validPayments.map((row) => ({
      payment_account_id: row.payment_account_id,
      amount: Number(row.amount || 0),
      method: row.method || 'cash',
      payment_date: row.payment_date || form.sale_date,
      reference: row.reference?.trim() || '',
      note: row.note?.trim() || '',
    }))

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

    showToast('success', t('sales.posPage.toast.finalized'))
    clearCart()
  } catch (error) {
    showToast(
      'danger',
      error.response?.data?.message || t('sales.posPage.toast.failed'),
    )
  } finally {
    saving.value = false
  }
}

const submitCash = () => {
  // Add or update cash payment row
  if (paymentRows.value.length === 0) {
    paymentRows.value = [
      createPaymentRow({
        method: 'cash',
        amount: Number(grandTotal.value.toFixed(2)),
        payment_date: form.sale_date,
        note: form.notes,
      }),
    ]
  } else {
    // Update first row to cash
    paymentRows.value[0].method = 'cash'
    paymentRows.value[0].amount = Number(grandTotal.value.toFixed(2))
  }

  // Auto-submit
  submitFinalized()
}

const submitCard = () => {
  // Add or update card payment row
  if (paymentRows.value.length === 0) {
    paymentRows.value = [
      createPaymentRow({
        method: 'card',
        amount: Number(grandTotal.value.toFixed(2)),
        payment_date: form.sale_date,
        note: form.notes,
      }),
    ]
  } else {
    // Update first row to card
    paymentRows.value[0].method = 'card'
    paymentRows.value[0].amount = Number(grandTotal.value.toFixed(2))
  }

  // Auto-submit
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
    : allWarehouses.filter((warehouse) =>
        auth.allowedBranches.some(
          (branch) => branch.id === warehouse.branch_id,
        ),
      )
}

const loadCustomers = async () => {
  const response = await customersApi.getCustomers({
    per_page: 250,
    status: 'active',
  })
  customers.value = response.data.data
}

let searchTimeout
const debouncedLoadProducts = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadProducts()
  }, 300)
}

const loadCategories = async () => {
  const response = await categoriesApi.getCategories({ per_page: 100 })
  categories.value = response.data.data
}

const loadBrands = async () => {
  const response = await brandsApi.getBrands({ per_page: 100 })
  brands.value = response.data.data
}

const loadProducts = async () => {
  if (!form.warehouse_id) {
    products.value = []
    return
  }

  const response = await productsApi.getProducts({
    per_page: 60,
    warehouse_id: form.warehouse_id,
    search: productSearch.value || undefined,
    category_id:
      filterMode.value === 'category'
        ? activeFilterId.value || undefined
        : undefined,
    brand_id:
      filterMode.value === 'brand'
        ? activeFilterId.value || undefined
        : undefined,
  })
  products.value = response.data.data.filter(
    (product) => product.is_active && product.is_for_selling !== false,
  )
}

const loadRegisters = async () => {
  const response = await salesApi.getCashRegisters({
    per_page: 250,
    status: 'active',
  })
  registers.value = response.data.data.filter(
    (register) => register.current_open_session,
  )
}

const loadPaymentAccounts = async () => {
  const response = await accountingApi.getPaymentAccounts({
    per_page: 250,
    status: 'active',
  })
  paymentAccounts.value = response.data.data
}

const loadTaxRates = async () => {
  const response = await taxRatesApi.getTaxRates({
    per_page: 250,
    is_active: true,
  })
  taxRates.value = response.data.data
}

watch(filterMode, () => {
  activeFilterId.value = ''
})

watch(
  () => form.warehouse_id,
  async () => {
    if (loading.value) return
    await loadProducts()
  },
)

watch([productSearch, activeFilterId, filterMode], () => {
  if (loading.value) return
  debouncedLoadProducts()
})

onMounted(async () => {
  loading.value = true

  try {
    await Promise.all([
      loadBranches(),
      loadWarehouses(),
      loadCustomers(),
      loadCategories(),
      loadBrands(),
      loadProducts(),
      loadRegisters(),
      loadPaymentAccounts(),
      loadTaxRates(),
    ])

    if (branches.value.length === 1) {
      form.branch_id = branches.value[0].id
    }
  } catch (error) {
    showToast(
      'danger',
      error.response?.data?.message || t('sales.formPage.loadErrorMessage'),
    )
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pos-terminal {
  background:
    radial-gradient(
      circle at top left,
      rgba(99, 102, 241, 0.08),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.08),
      transparent 24%
    ),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.98),
      rgba(249, 250, 251, 0.96) 45%,
      rgba(250, 252, 250, 0.92)
    ),
    #ffffff;
  color: rgb(17 24 39);
  padding-bottom: 6.25rem;
}

.pos-terminal-header {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.98),
      rgba(249, 250, 251, 0.92)
    ),
    linear-gradient(135deg, rgba(99, 102, 241, 0.02), transparent 40%);
  padding: 1.5rem;
  box-shadow:
    0 4px 24px rgba(17, 24, 39, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(24px) saturate(180%);
}

.pos-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  max-width: 100%;
}

.pos-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.pos-header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pos-breadcrumb-link {
  color: rgb(107, 114, 128);
  text-decoration: none;
  transition: color 150ms ease;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.pos-breadcrumb-link:hover {
  color: rgb(79, 70, 229);
  background: rgba(99, 102, 241, 0.05);
}

.pos-breadcrumb-separator {
  color: rgb(156, 163, 175);
  opacity: 0.7;
}

.pos-header-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.pos-header-title {
  color: rgb(17, 24, 39);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
  letter-spacing: -0.025em;
}

.pos-header-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pos-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border: 1px solid;
  transition: all 150ms ease;
}

.pos-header-badge-success {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.9),
    rgba(22, 163, 74, 0.8)
  );
  color: white;
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.pos-header-badge-warning {
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.9),
    rgba(217, 119, 6, 0.8)
  );
  color: white;
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.pos-header-subtitle {
  color: rgb(107, 114, 128);
  font-size: 0.9375rem;
  line-height: 1.4;
  margin: 0;
}

.pos-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.pos-terminal-button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 1.125rem;
  color: rgb(55, 65, 81);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.pos-terminal-button:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(248, 250, 252, 0.95);
  color: rgb(79, 70, 229);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.pos-header-button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0 1.125rem;
  color: rgb(55, 65, 81);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
}

.pos-header-button:hover {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(248, 250, 252, 0.95);
  color: rgb(79, 70, 229);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.12);
}

.pos-header-button-icon {
  width: 2.75rem;
  padding: 0;
  gap: 0;
}

.pos-header-button-icon:hover:not(:disabled) {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(254, 242, 242, 0.95);
  color: rgb(220, 38, 38);
}

.pos-header-button-exit {
  border-color: rgba(107, 114, 128, 0.4);
  background: rgba(249, 250, 251, 0.9);
  color: rgb(107, 114, 128);
}

.pos-header-button-exit:hover {
  border-color: rgba(107, 114, 128, 0.6);
  background: rgba(243, 244, 246, 0.95);
  color: rgb(55, 65, 81);
}

.pos-header-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-header-button-tooltip {
  position: absolute;
  bottom: -2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgb(17, 24, 39);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;
  z-index: 50;
}

.pos-header-button-icon:hover .pos-header-button-tooltip {
  opacity: 1;
}

.pos-terminal-icon-button {
  display: inline-flex;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: rgb(55, 65, 81);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.pos-terminal-icon-button:hover:not(:disabled) {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(254, 242, 242, 0.95);
  color: rgb(220, 38, 38);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.pos-terminal-icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-panel {
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.92)
  );
  padding: 1.25rem;
  box-shadow:
    0 4px 24px rgba(17, 24, 39, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
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

.pos-inline-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: flex-end;
}

.pos-inline-stat {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  max-width: 100%;
  border: 1px solid rgba(203, 213, 225, 0.72);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  padding: 0 0.75rem;
  color: rgb(71 85 105);
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.pos-inline-stat-active {
  border-color: rgba(14, 165, 233, 0.3);
  background: rgba(224, 242, 254, 0.94);
  color: rgb(3 105 161);
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
  color: rgb(17 24 39);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.pos-section-copy {
  margin-top: 0.25rem;
  color: rgb(107, 114, 128);
  font-size: 0.8125rem;
  line-height: 1.5;
  font-weight: 400;
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

.pos-setup-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.pos-scan-block {
  margin-top: 0.95rem;
  border-top: 1px solid rgba(226, 232, 240, 0.92);
  padding-top: 0.95rem;
}

.pos-scan-hint {
  margin: 0.2rem 0 0.75rem;
  color: rgb(100 116 139);
  font-size: 0.78rem;
  line-height: 1.45;
}

@media (min-width: 768px) {
  .pos-setup-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .pos-setup-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
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
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  background: transparent;
}
.pos-cart-list {
  display: table-row-group;
}

.pos-cart-header {
  background: rgba(248, 250, 252, 0.98);
  color: rgb(100 116 139);
}

.pos-cart-header th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 2px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.98);
}

.pos-cart-row {
  border: 2px solid rgba(226, 232, 240, 0.95);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.92)
  );
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  margin-bottom: 0;
}

.pos-cart-row:hover {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.12);
  transform: translateY(-2px);
}

.pos-cart-row td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  border: none;
}

.pos-cart-row td:first-child {
  border-radius: 8px 0 0 8px;
  padding-left: 1rem;
}

.pos-cart-row td:last-child {
  border-radius: 0 8px 8px 0;
  padding-right: 1rem;
}


.pos-line-product-cell {
  min-width: 15rem;
  max-width: 1.8fr;
  padding: 0.75rem 1rem;
}

.pos-line-unit-cell {
  min-width: 6.5rem;
  max-width: 0.65fr;
  padding: 0.75rem 1rem;
}

.pos-line-quantity-cell {
  width: 10rem;
  text-align: center;
  min-width: 10rem;
  padding: 0.75rem 1rem;
}

.pos-line-price-cell {
  width: 8rem;
  text-align: right;
  min-width: 8rem;
  padding: 0.75rem 1rem;
}

.pos-line-discount-cell {
  width: 6rem;
  text-align: right;
  min-width: 6rem;
  padding: 0.75rem 1rem;
}

.pos-line-total-cell {
  width: 6.6rem;
  text-align: right;
  padding: 0.75rem 1rem;
}

.pos-line-product-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.pos-line-product-name {
  display: block;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0;
  color: rgb(15 23 42);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: left;
  transition: color 120ms ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-line-edit-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 4px;
  background: rgba(248, 250, 252, 0.8);
  color: rgb(99, 102, 241);
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.pos-line-edit-icon:hover {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.05);
  color: rgb(79, 70, 229);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

.pos-line-edit-icon:active {
  transform: translateY(0);
  box-shadow: none;
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
  color: rgb(225 29 72);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  background: rgba(254, 242, 242, 0.8);
  border-radius: 0 0 8px 8px;
  border: 1px solid rgba(252, 165, 165, 0.5);
  border-top: 2px solid rgba(252, 165, 165, 0.7);
}

/* Compact Line Modal Styles */
.pos-line-modal-compact {
  padding: 0;
}

.pos-line-modal-header {
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
  border-radius: 8px 8px 0 0;
}

.pos-product-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pos-product-name {
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgb(15 23 42);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-product-variation {
  font-size: 0.625rem;
  color: rgb(107 114 128);
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pos-line-modal-product-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pos-line-modal-product-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgb(15, 23, 42);
  line-height: 1.4;
}

.pos-line-modal-variation {
  color: rgb(107, 114, 128);
  font-weight: 500;
}

.pos-line-modal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.pos-line-modal-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 4px;
  background: rgba(241, 245, 249, 0.9);
  color: rgb(71, 85, 105);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.pos-line-modal-badge-unit {
  background: rgba(219, 234, 254, 0.9);
  color: rgb(37, 99, 235);
  border-color: rgba(191, 219, 254, 0.8);
}

.pos-line-modal-badge-price {
  background: rgba(220, 252, 231, 0.9);
  color: rgb(34, 197, 94);
  border-color: rgba(187, 247, 208, 0.8);
}

.pos-line-modal-grid {
  padding: 1rem 1.25rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.pos-line-modal-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pos-line-modal-section-full {
  grid-column: 1 / -1;
}

.pos-line-modal-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(71, 85, 105);
  margin-bottom: 0.25rem;
}

.pos-line-modal-section-header i {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  color: rgb(99, 102, 241);
  border-radius: 4px;
  font-size: 0.7rem;
}

.pos-line-modal-discount-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.pos-line-modal-expiry {
  font-size: 0.75rem;
  background: rgba(248, 250, 252, 0.8);
  border-color: rgba(226, 232, 240, 0.8);
}

.pos-line-modal-tax-info {
  margin-top: 0.25rem;
}

.pos-line-modal-tax-details {
  padding: 0.5rem;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 6px;
  font-size: 0.75rem;
}

.pos-line-modal-tax-name {
  font-weight: 600;
  color: rgb(6, 182, 212);
}

.pos-line-modal-tax-rate {
  color: rgb(71, 85, 105);
  opacity: 0.8;
}

.pos-line-modal-textarea {
  min-height: 3.5rem;
  resize: vertical;
  font-size: 0.8rem;
}

.pos-line-modal-error {
  margin: 0 1.25rem 1rem;
  padding: 0.5rem 0.75rem;
  background: rgba(254, 242, 242, 0.9);
  border: 1px solid rgba(252, 165, 165, 0.3);
  border-radius: 6px;
  color: rgb(220, 38, 38);
  font-size: 0.75rem;
  font-weight: 600;
}

.pos-cart-summary-clickable {
  cursor: pointer;
  transition: all 150ms ease;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: -0.25rem;
}

.pos-cart-summary-clickable:hover {
  background: rgba(99, 102, 241, 0.05);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.pos-cart-summary-clickable:active {
  transform: translateY(0);
}

.pos-quantity-stepper {
  display: grid;
  grid-template-columns: 1.75rem minmax(0, 1fr) 1.75rem;
  overflow: hidden;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 6px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  height: 2.5rem;
  margin: 0;
}

.pos-quantity-stepper-button {
  display: inline-flex;
  min-height: 2.5rem;
  height: 2.5rem;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgb(107, 114, 128);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 120ms ease;
}

.pos-quantity-stepper-button:hover:not(:disabled) {
  background: linear-gradient(135deg, rgb(248, 250, 252), rgb(241, 245, 249));
}

.pos-quantity-stepper-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.pos-quantity-stepper-input {
  min-width: 0;
  height: 2.5rem;
  border: 0;
  border-right: 1px solid rgba(229, 231, 235, 0.8);
  border-left: 1px solid rgba(229, 231, 235, 0.8);
  background: transparent;
  padding: 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  color: rgb(17, 24, 39);
  outline: none;
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
  height: 2.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 6px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  outline: none;
  transition: all 120ms ease;
  margin: 0;
}

.pos-cart-discount-input {
  height: 2.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 6px;
  background: rgba(254, 242, 242, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  outline: none;
  transition: all 120ms ease;
  margin: 0;
}

.pos-cart-discount-input:focus {
  border-color: rgba(252, 165, 165, 0.5);
  box-shadow: 0 0 0 2px rgba(252, 165, 165, 0.1);
}

.pos-cart-delete {
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(252, 165, 165, 0.8);
  border-radius: 10px;
  color: rgb(220, 38, 38);
  font-size: 0.75rem;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(254, 242, 242, 0.8);
  font-weight: 500;
}

.pos-cart-delete:hover:not(:disabled) {
  border-color: rgb(248, 113, 113);
  background: rgb(254, 226, 226);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
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

.pos-checkout-rail {
  display: grid;
  gap: 0.9rem;
}

.pos-pricing-modal-grid {
  display: grid;
  gap: 1rem;
}

.pos-cart-summary-footer {
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.72);
  padding: 0.85rem 0.9rem;
}

.pos-cart-summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  align-items: stretch;
}

.pos-cart-summary-item {
  display: grid;
  align-content: center;
  gap: 0.125rem;
  min-height: 3.5rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.95)
  );
  padding: 0.75rem 1rem;
  text-align: right;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.pos-cart-summary-label {
  color: rgb(107, 114, 128);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-cart-summary-value {
  color: rgb(17 24 39);
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pos-cart-summary-button {
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.pos-cart-summary-button:hover {
  border-color: rgba(14, 165, 233, 0.28);
  background: rgba(224, 242, 254, 0.55);
}

.pos-cart-summary-button:active {
  transform: scale(0.99);
}

.pos-cart-summary-total {
  border-color: rgba(99, 102, 241, 0.3);
  background: linear-gradient(
    135deg,
    rgba(238, 242, 255, 0.8),
    rgba(224, 231, 255, 0.7)
  );
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.pos-quick-checkout {
  margin-top: 0.75rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.95)
  );
  padding: 0.875rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.pos-quick-checkout-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.pos-quick-checkout-title {
  color: rgb(17 24 39);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.pos-quick-checkout-hint {
  color: rgb(100 116 139);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pos-quick-checkout-grid {
  margin-top: 0.55rem;
  display: grid;
  gap: 0.55rem;
  grid-template-columns: 1fr;
  align-items: end;
}

.pos-quick-checkout-action {
  display: flex;
  justify-content: flex-end;
}

.pos-quick-checkout-button {
  display: inline-flex;
  min-height: 2.75rem;
  min-width: 9rem;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105));
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  letter-spacing: -0.01em;
  position: relative;
  overflow: hidden;
}

.pos-quick-checkout-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.pos-quick-checkout-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, rgb(5, 150, 105), rgb(4, 120, 87));
}

.pos-quick-checkout-button:active:not(:disabled) {
  transform: scale(0.96);
}

@media (min-width: 640px) {
  .pos-quick-checkout-grid {
    grid-template-columns: 1.1fr 1.4fr 0.8fr auto;
  }
}

.pos-cart-pricing-controls {
  margin-bottom: 0.65rem;
  display: grid;
  gap: 0.55rem;
}

.pos-cart-pricing-section {
  border: 1px solid rgba(203, 213, 225, 0.72);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.66);
  padding: 0.55rem 0.6rem;
}

.pos-cart-pricing-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  padding: 0.25rem;
  border-radius: 8px;
  transition: background-color 200ms ease;
}

.pos-cart-pricing-heading:hover {
  background: rgba(249, 250, 251, 0.8);
}

.dark .pos-cart-pricing-heading:hover {
  background: rgba(31, 41, 55, 0.8);
}

.pos-cart-pricing-title {
  color: rgb(15 23 42);
  font-size: 0.74rem;
  font-weight: 900;
}

.pos-cart-pricing-body {
  margin-top: 0.45rem;
  display: grid;
  gap: 0.5rem;
  overflow: hidden;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 1000px;
}

.pos-cart-pricing-body.collapsed {
  max-height: 0;
  margin-top: 0;
  opacity: 0;
}

.pos-collapse-icon {
  color: rgb(107, 114, 128);
  font-size: 0.75rem;
  transition: transform 200ms ease;
}

.pos-cart-pricing-heading:hover .pos-collapse-icon {
  color: rgb(79, 70, 229);
}

.dark .pos-collapse-icon {
  color: rgb(156, 163, 175);
}

.dark .pos-cart-pricing-heading:hover .pos-collapse-icon {
  color: rgb(165, 180, 252);
}

.pos-cart-pricing-control :deep(.erp-label) {
  font-size: 0.68rem;
}

.pos-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pos-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.92);
  padding: 0.24rem 0.55rem;
  color: rgb(51 65 85);
  font-size: 0.68rem;
  font-weight: 800;
  cursor: pointer;
  user-select: none;
}

.pos-radio input {
  accent-color: rgb(14 165 233);
}

@media (min-width: 1024px) {
  .pos-cart-pricing-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .pos-cart-summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.pos-summary-card {
  width: min(100%, 28rem);
  border: 1px solid rgba(203, 213, 225, 0.82);
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96),
    rgba(248, 250, 252, 0.9)
  );
  padding: 1rem 1rem 0.9rem;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.pos-summary-list {
  display: grid;
  gap: 0.2rem;
}

.pos-summary-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  min-height: 2.5rem;
  padding: 0.45rem 0;
  border-bottom: 1px dashed rgba(203, 213, 225, 0.9);
}

.pos-summary-main {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.45rem;
}

.pos-summary-label {
  color: rgb(71 85 105);
  font-size: 0.78rem;
  font-weight: 700;
}

.pos-summary-value {
  color: rgb(15 23 42);
  font-size: 0.92rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.pos-summary-row-button {
  width: 100%;
  border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  text-align: left;
  transition:
    color 150ms ease,
    transform 150ms ease;
}

.pos-summary-row-button:hover {
  transform: translateX(2px);
}

.pos-summary-row-button small {
  color: rgb(14 116 144);
  font-size: 0.68rem;
  font-weight: 700;
}

.pos-summary-row-discount .pos-summary-value {
  color: rgb(225 29 72);
}

.pos-summary-total {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 1rem;
  margin-top: 0.8rem;
  padding-top: 0.85rem;
  border-top: 2px solid rgba(148, 163, 184, 0.22);
}

.pos-summary-total-label {
  color: rgb(15 23 42);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pos-summary-total-value {
  color: rgb(4 120 87);
  font-size: 1.9rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: right;
}

.pos-pricing-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.78);
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94),
    rgba(248, 250, 252, 0.88)
  );
  padding: 0.65rem;
}

.pos-pricing-card-active {
  border-color: rgba(14, 165, 233, 0.34);
  box-shadow:
    0 24px 52px rgba(14, 165, 233, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.pos-pricing-card::before {
  content: '';
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
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94),
    rgba(248, 250, 252, 0.88)
  );
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
  transition:
    transform 150ms ease,
    filter 150ms ease;
}

.pos-filter-button:hover {
  filter: brightness(1.04);
}

.pos-filter-button-active {
  box-shadow:
    0 14px 30px rgba(14, 116, 144, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.pos-filter-button:active {
  transform: scale(0.98);
}

.pos-browser-toolbar {
  display: grid;
  gap: 0.75rem;
  align-items: center;
}

.pos-browser-mode {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.pos-browser-search {
  min-width: 0;
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
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 18rem);
  gap: 0.4rem;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
}

.pos-product-tile {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 5rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.95)
  );
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0;
}

.pos-product-tile:hover:not(:disabled) {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow:
    0 8px 20px rgba(99, 102, 241, 0.15),
    0 2px 8px rgba(99, 102, 241, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    linear-gradient(135deg, rgba(99, 102, 241, 0.04), transparent 45%);
}

.pos-product-tile:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  filter: grayscale(0.4) brightness(0.95);
}

.pos-product-image-container {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 8px;
  overflow: hidden;
  background: rgb(248, 250, 252);
  border: 1px solid rgba(229, 231, 235, 0.4);
  flex-shrink: 0;
}

.pos-product-image {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.25rem;
}

.pos-product-image img {
  height: 100%;
  width: 100%;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 300ms ease;
}

.pos-product-tile:hover .pos-product-image img {
  transform: scale(1.05);
}

.pos-product-image-empty {
  font-size: 1.2rem;
  color: rgb(156, 163, 175);
}

.pos-variation-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.9),
    rgba(139, 92, 246, 0.8)
  );
  color: white;
  font-size: 0.625rem;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.pos-product-content {
  display: flex;
  flex-direction: row;
  flex: 1;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
}

.pos-product-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pos-product-name {
  display: -webkit-box;
  overflow: hidden;
  color: rgb(17 24 39);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  letter-spacing: -0.005em;
}

.pos-product-variation {
  color: rgb(99, 102, 241);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
}

.pos-product-meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pos-product-sku {
  color: rgb(107, 114, 128);
  font-size: 0.6875rem;
  font-weight: 500;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background: rgba(243, 244, 246, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 6px;
  border: 1px solid rgba(229, 231, 235, 0.6);
  display: inline-block;
  width: fit-content;
}

.pos-product-category {
  color: rgb(107, 114, 128);
  font-size: 0.6875rem;
  font-weight: 500;
}

.pos-product-brand {
  color: rgb(148, 163, 184);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pos-product-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 0;
}

.pos-product-stock-info {
  flex: 1;
  margin-right: 0.5rem;
}

.pos-product-stock {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 8px;
  background: rgba(220, 252, 231, 0.9);
  color: rgb(21 128 61);
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(34, 197, 94, 0.2);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.pos-product-stock-available {
  background: rgba(220, 252, 231, 0.9);
  color: rgb(21 128 61);
  border-color: rgba(34, 197, 94, 0.2);
}

.pos-product-stock-low {
  background: rgba(254, 243, 199, 0.9);
  color: rgb(180 83 9);
  border-color: rgba(245, 158, 11, 0.2);
}

.pos-product-stock-warning {
  background: rgba(254, 243, 199, 0.9);
  color: rgb(180 83 9);
  border-color: rgba(245, 158, 11, 0.2);
}

.pos-product-price {
  color: rgb(16, 185, 129);
  font-size: 0.9375rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
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
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
}

.pos-action-buttons {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  justify-content: flex-end;
}

.pos-action-cancel,
.pos-action-lite,
.pos-action-primary,
.pos-action-cash {
  display: inline-flex;
  min-height: 3rem;
  min-width: 8rem;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border-radius: 12px;
  padding: 0 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  letter-spacing: -0.01em;
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
  transform: scale(0.96);
}

.pos-action-cancel {
  border: 2px solid rgb(252, 165, 165);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(254, 242, 242, 0.95)
  );
  color: rgb(220, 38, 38);
  position: relative;
  overflow: hidden;
}

.pos-action-lite {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.95)
  );
  color: rgb(55, 65, 81);
  border: 1px solid rgba(229, 231, 235, 0.6);
  position: relative;
  overflow: hidden;
}

.pos-action-primary {
  background: linear-gradient(135deg, rgb(79, 70, 229), rgb(99, 102, 241));
  color: white;
  border: 1px solid rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.pos-action-cash {
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105));
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

@media (max-width: 640px) {
  .pos-action-buttons {
    width: 100%;
  }

  .pos-action-cancel,
  .pos-action-lite,
  .pos-action-primary,
  .pos-action-cash {
    flex: 1 1 10rem;
    min-width: 0;
  }
}

.sale-line-quantity,
.sale-line-discount {
  display: grid;
  grid-template-columns: minmax(4.7rem, 5.2rem) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 6px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.92),
    rgba(248, 250, 252, 0.86)
  );
  box-shadow: none;
}

.sale-line-quantity__value,
.sale-line-discount__type {
  position: relative;
  min-width: 0;
}

.sale-line-quantity__value::after,
.sale-line-discount__type::after {
  content: '';
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
  height: 2.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 6px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  outline: none;
  transition: all 120ms ease;
  margin: 0;
}

.pos-sale-line-quantity,
.pos-sale-line-discount {
  grid-template-columns: minmax(4.6rem, 5rem) minmax(0, 1fr);
  box-shadow: none;
}

.pos-line-unit-select {
  width: 100%;
  grid-template-columns: 1fr;
  margin: 0;
}

.pos-line-unit-select .AppSelect {
  height: 2.5rem;
  margin: 0;
}

.pos-line-unit-select .AppSelect .app-select-trigger {
  height: 2.5rem;
  min-height: 2.5rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 6px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 120ms ease;
  margin: 0;
}

.pos-line-unit-select .AppSelect .app-select-trigger:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.pos-line-unit-select .AppSelect .app-select-trigger:focus {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
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
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.92),
    rgba(15, 23, 42, 0.82)
  );
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
    radial-gradient(
      circle at top left,
      rgba(99, 102, 241, 0.08),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.08),
      transparent 24%
    ),
    linear-gradient(
      135deg,
      rgba(17, 24, 39, 0.98),
      rgba(31, 41, 55, 0.96) 48%,
      rgba(17, 24, 39, 0.92)
    ),
    #111827;
  color: rgb(243 244 246);
}

.dark .pos-terminal-header {
  border-color: rgba(75, 85, 99, 0.8);
  background: rgba(17, 24, 39, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.dark .pos-terminal-button {
  border-color: rgba(75, 85, 99, 0.8);
  background: rgba(31, 41, 55, 0.9);
  color: rgb(209, 213, 219);
}

.dark .pos-terminal-button:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(55, 65, 81, 0.8);
  color: rgb(165, 180, 252);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.dark .pos-inline-stat,
.dark .pos-action-summary {
  border-color: rgba(51, 65, 85, 0.82);
  background: rgba(15, 23, 42, 0.74);
}

.dark .pos-inline-stat-active {
  border-color: rgba(34, 211, 238, 0.35);
  background: rgba(8, 47, 73, 0.72);
}

.dark .pos-summary-card {
  border-color: rgba(51, 65, 85, 0.82);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.82),
    rgba(15, 23, 42, 0.74)
  );
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.dark .pos-summary-row {
  border-bottom-color: rgba(71, 85, 105, 0.56);
}

.dark .pos-summary-label {
  color: rgb(148 163 184);
}

.dark .pos-summary-value,
.dark .pos-summary-total-label {
  color: rgb(241 245 249);
}

.dark .pos-summary-row-button small {
  color: rgb(103 232 249);
}

.dark .pos-summary-row-button:hover {
  color: rgb(165 243 252);
}

.dark .pos-summary-row-discount .pos-summary-value {
  color: rgb(253 164 175);
}

.dark .pos-summary-total {
  border-top-color: rgba(71, 85, 105, 0.72);
}

.dark .pos-summary-total-value {
  color: rgb(110 231 183);
}

.dark .pos-action-summary-label {
  color: rgb(148 163 184);
}

.dark .pos-action-summary-value {
  color: rgb(241 245 249);
}

.dark .pos-terminal-icon-button {
  border-color: rgba(71, 85, 105, 0.82);
  background: rgba(15, 23, 42, 0.72);
  color: rgb(226 232 240);
}

.dark .pos-panel {
  border-color: rgba(75, 85, 99, 0.8);
  background: linear-gradient(
    180deg,
    rgba(31, 41, 55, 0.98),
    rgba(17, 24, 39, 0.92)
  );
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.dark .pos-section-copy,
.dark .pos-product-meta-secondary {
  color: rgb(156, 163, 175);
}

.dark .pos-scan-block {
  border-top-color: rgba(51, 65, 85, 0.86);
}

.dark .pos-scan-hint {
  color: rgb(148 163 184);
}

.dark .pos-pricing-card-active {
  border-color: rgba(34, 211, 238, 0.36);
  box-shadow:
    0 24px 52px rgba(8, 145, 178, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
  color: rgb(243 244 246);
}

.dark .pos-cart-header {
  background: rgba(15, 23, 42, 0.9);
}

.dark .pos-cart-header {
  color: rgb(148 163 184);
}

.dark .pos-cart-row,
.dark .pos-pricing-card,
.dark .pos-line-modal-card,
.dark .pos-chip,
.dark .pos-product-tile,
.dark .pos-action-lite,
.dark .pos-action-cancel {
  border-color: rgba(75, 85, 99, 0.8);
  background: linear-gradient(
    180deg,
    rgba(31, 41, 55, 0.98),
    rgba(17, 24, 39, 0.95)
  );
}

.dark .pos-summary-value,
.dark .pos-line-product-name,
.dark .pos-line-total-primary,
.dark .pos-pricing-card-heading,
.dark .pos-line-modal-heading,
.dark .pos-product-name,
.dark .pos-product-name {
  color: rgb(243 244 246);
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
  border-color: rgba(75, 85, 99, 0.8);
  background: rgba(17, 24, 39, 0.95);
}

@media (max-width: 1024px) {
  .pos-section-heading,
  .pos-panel-topline {
    flex-direction: column;
  }

  .pos-inline-stats {
    justify-content: flex-start;
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

  .pos-browser-toolbar,
  .pos-browser-mode,
  .pos-checkout-rail {
    grid-template-columns: 1fr;
  }

  .pos-summary-card {
    width: 100%;
  }

  .pos-pricing-footer {
    grid-template-columns: 1fr;
  }

  .pos-pricing-card-body {
    grid-template-columns: 1fr;
  }

  .pos-cart-table {
    overflow-x: auto;
    border-spacing: 0 0.25rem;
  }

  .pos-cart-list {
    display: table-row-group;
  }

  .pos-cart-row {
    display: table-row;
    margin-bottom: 0.25rem;
  }

  .pos-cart-row td {
    display: table-cell;
    padding: 0.5rem 0.75rem;
  }

  .pos-line-product-cell {
    display: table-cell;
    width: auto;
    min-width: 12rem;
  }

  .pos-line-unit-cell,
  .pos-line-quantity-cell,
  .pos-line-price-cell,
  .pos-line-total-cell {
    display: table-cell;
    width: auto;
    min-width: 6rem;
  }

  .pos-cart-delete {
    text-align: right;
  }

  .pos-cart-header th {
    padding: 0.5rem 0.75rem;
  }

  .pos-action-inner {
    flex-wrap: wrap;
    padding: 0.75rem;
  }

  .pos-action-summary {
    min-width: 0;
    flex: 1 0 100%;
  }

  .pos-action-cancel,
  .pos-action-lite,
  .pos-action-primary,
  .pos-action-cash {
    min-width: 0;
    flex: 1 1 calc(50% - 0.4rem);
  }
}

@media (min-width: 1024px) {
  .pos-workspace {
    grid-template-columns: minmax(0, 75fr) minmax(18rem, 25fr);
  }

  .pos-product-panel {
    position: sticky;
    top: 5.7rem;
  }

  .pos-product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: calc(100vh - 19rem);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .pos-checkout-rail {
    grid-template-columns: 1fr;
  }

  .pos-product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pos-pricing-card-body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .pos-pricing-modal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .pos-product-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .pos-product-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/* Checkout Section Styles */
.pos-checkout-section {
  margin-top: 0.75rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 16px;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.95)
  );
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.pos-checkout-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0;
  cursor: pointer;
  user-select: none;
  padding: 0.5rem 0.25rem;
  transition: all 200ms ease;
}

.pos-checkout-heading:hover {
  background: rgba(248, 250, 252, 0.5);
  border-radius: 8px;
}

.pos-checkout-body {
  padding-top: 1rem;
}

.pos-checkout-title {
  color: rgb(17, 24, 39);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.pos-checkout-hint {
  color: rgb(107, 114, 128);
  font-size: 0.75rem;
  font-weight: 600;
}

.pos-payment-table {
  margin-bottom: 1rem;
}

.pos-payment-header {
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  background: rgba(249, 250, 251, 0.8);
  padding: 0.625rem 0.875rem;
  border-radius: 10px 10px 0 0;
}

.pos-payment-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 1fr 1fr 2.5rem;
  gap: 0.75rem;
  align-items: center;
}

.pos-payment-header .pos-payment-grid {
  color: rgb(107, 114, 128);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.pos-payment-list {
  max-height: 12rem;
  overflow-y: auto;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 0 0 10px 10px;
  background: rgba(255, 255, 255, 0.5);
}

.pos-payment-row {
  border-bottom: 1px solid rgba(229, 231, 235, 0.4);
  padding: 0.625rem 0.875rem;
}

.pos-payment-row:last-child {
  border-bottom: none;
}

.pos-payment-method,
.pos-payment-account,
.pos-payment-amount,
.pos-payment-reference {
  min-width: 0;
}

.pos-payment-actions {
  display: flex;
  justify-content: center;
}

.pos-payment-remove {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(252, 165, 165, 0.8);
  border-radius: 8px;
  background: rgba(254, 242, 242, 0.8);
  color: rgb(220, 38, 38);
  font-size: 0.75rem;
}

.pos-payment-remove:hover:not(:disabled) {
  background: rgb(254, 226, 226);
  transform: scale(1.1);
}

.pos-payment-remove:disabled {
  opacity: 0.5;
}

.pos-payment-add {
  padding: 0.75rem;
  border-top: 1px solid rgba(229, 231, 235, 0.6);
  background: rgba(249, 250, 251, 0.5);
}

.pos-payment-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0 1rem;
  border: 1px dashed rgba(99, 102, 241, 0.5);
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.8);
  color: rgb(79, 70, 229);
  font-size: 0.875rem;
  font-weight: 600;
  width: 100%;
}

.pos-payment-add-button:hover:not(:disabled) {
  border-color: rgba(99, 102, 241, 0.8);
  background: rgba(238, 242, 255, 0.9);
}

.pos-payment-summary {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.8),
    rgba(241, 245, 249, 0.7)
  );
}

.pos-payment-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(229, 231, 235, 0.4);
}

.pos-payment-summary-row:last-child {
  border-bottom: none;
}

.pos-payment-summary-change {
  border-top: 2px solid rgba(16, 185, 129, 0.3);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    rgba(5, 150, 105, 0.05)
  );
  border-radius: 8px;
  padding: 0.75rem;
  margin: 0.75rem -1rem -0.5rem -1rem;
}

.pos-payment-summary-label {
  color: rgb(107, 114, 128);
  font-size: 0.875rem;
  font-weight: 600;
}

.pos-payment-summary-value {
  color: rgb(17, 24, 39);
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.pos-payment-summary-change .pos-payment-summary-value {
  color: rgb(16, 185, 129);
  font-size: 1.125rem;
}

.pos-checkout-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.pos-checkout-button {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  border-radius: 12px;
  padding: 0 1.125rem;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  letter-spacing: -0.01em;
  position: relative;
  overflow: hidden;
}

.pos-checkout-button-cash {
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105));
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pos-checkout-button-cash:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, rgb(5, 150, 105), rgb(4, 120, 87));
}

.pos-checkout-button-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(249, 250, 251, 0.95)
  );
  color: rgb(55, 65, 81);
  border: 1px solid rgba(229, 231, 235, 0.6);
}

.pos-checkout-button-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1),
    rgba(248, 250, 252, 0.98)
  );
}

.pos-checkout-button-primary {
  background: linear-gradient(135deg, rgb(79, 70, 229), rgb(99, 102, 241));
  color: white;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.pos-checkout-button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
  background: linear-gradient(135deg, rgb(67, 56, 202), rgb(99, 102, 241));
}

.pos-checkout-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pos-checkout-button:active:not(:disabled) {
  transform: scale(0.96);
}

/* Dark mode styles for checkout */
.dark .pos-checkout-section {
  border-color: rgba(75, 85, 99, 0.8);
  background: linear-gradient(
    135deg,
    rgba(31, 41, 55, 0.98),
    rgba(17, 24, 39, 0.95)
  );
}

.dark .pos-checkout-title {
  color: rgb(243, 244, 246);
}

.dark .pos-checkout-hint {
  color: rgb(156, 163, 175);
}

.dark .pos-sell-note-input {
  background: rgba(31, 41, 55, 0.9);
  border-color: rgba(75, 85, 99, 0.8);
  color: rgb(243, 244, 246);
}

.dark .pos-payment-header {
  background: rgba(31, 41, 55, 0.8);
  border-color: rgba(75, 85, 99, 0.8);
}

.dark .pos-payment-list {
  background: rgba(17, 24, 39, 0.5);
  border-color: rgba(75, 85, 99, 0.6);
}

.dark .pos-payment-row:hover {
  background: rgba(31, 41, 55, 0.8);
}

.dark .pos-payment-amount-input,
.dark .pos-payment-reference-input {
  background: rgba(31, 41, 55, 0.9);
  border-color: rgba(75, 85, 99, 0.8);
  color: rgb(243, 244, 246);
}

.dark .pos-payment-summary {
  background: linear-gradient(
    135deg,
    rgba(31, 41, 55, 0.8),
    rgba(17, 24, 39, 0.7)
  );
  border-color: rgba(75, 85, 99, 0.6);
}

.dark .pos-payment-summary-label {
  color: rgb(156, 163, 175);
}

.dark .pos-payment-summary-value {
  color: rgb(243, 244, 246);
}

.dark .pos-checkout-button-card {
  background: linear-gradient(
    135deg,
    rgba(31, 41, 55, 0.98),
    rgba(17, 24, 39, 0.95)
  );
  color: rgb(209, 213, 219);
  border-color: rgba(75, 85, 99, 0.8);
}

.dark .pos-checkout-button-card:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(55, 65, 81, 0.98),
    rgba(31, 41, 55, 0.95)
  );
}

/* Responsive design */
@media (max-width: 768px) {
  .pos-payment-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .pos-payment-header .pos-payment-grid {
    display: none;
  }

  .pos-checkout-actions {
    grid-template-columns: 1fr;
  }

  .pos-payment-method,
  .pos-payment-account,
  .pos-payment-amount,
  .pos-payment-reference {
    grid-column: 1;
  }

  .pos-payment-actions {
    grid-column: 1;
    justify-content: flex-end;
  }
}
</style>
