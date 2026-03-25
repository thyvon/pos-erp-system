<template>
  <AppLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :breadcrumbs="breadcrumbs"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          This page is arranged like a classic POS product setup flow: identify the item, classify it, price it, then define stock behavior.
        </div>
        <button type="button" class="erp-button-secondary" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i>
          Back to products
        </button>
      </div>

      <section class="relative overflow-hidden rounded-[5px] border border-slate-200/80 bg-white/75 p-6 shadow-[0_18px_45px_rgba(56,77,112,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
        <LoadingSpinner
          :show="pageLoading"
          title="Loading product"
          message="Pulling product details and catalog options."
        />

        <div
          v-if="loadError"
          class="rounded-[5px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <div class="font-semibold">Unable to load the product form.</div>
          <div class="mt-1">{{ loadError }}</div>
        </div>

        <Form
          v-else-if="!pageLoading"
          v-slot="{ values, setFieldValue }"
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div class="space-y-6">
              <section id="product-general" class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">General information</div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Start with the product identity, type, SKU, and barcode setup.
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="inline-flex rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                      {{ formatType(values.type) }}
                    </span>
                    <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {{ values.barcode_type }}
                    </span>
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div class="xl:col-span-2">
                    <label class="erp-label" for="name">Product name</label>
                    <Field id="name" name="name" class="erp-input" />
                    <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="sku">SKU</label>
                    <Field id="sku" name="sku" class="erp-input" />
                    <div class="erp-helper text-slate-500 dark:text-slate-400">
                      Leave blank to auto-generate from the product name.
                    </div>
                    <ErrorMessage name="sku" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="barcode">Barcode</label>
                    <Field id="barcode" name="barcode" class="erp-input" />
                    <ErrorMessage name="barcode" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label class="erp-label" for="type">Product type</label>
                    <AppSelect
                      :model-value="values.type || null"
                      :options="typeFormOptions"
                      placeholder="Select type"
                      @update:model-value="handleProductTypeChange(values, setFieldValue, $event || 'single')"
                    />
                    <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="barcode_type">Barcode type</label>
                    <AppSelect
                      :model-value="values.barcode_type || null"
                      :options="barcodeTypeOptions"
                      placeholder="Select barcode type"
                      @update:model-value="setFieldValue('barcode_type', $event || 'C128')"
                    />
                    <ErrorMessage name="barcode_type" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div class="md:col-span-2">
                    <label class="erp-label" for="description">Description</label>
                    <Field id="description" name="description" as="textarea" rows="3" class="erp-input min-h-[6rem]" />
                  </div>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label class="erp-label" for="image_url">Image URL</label>
                    <Field id="image_url" name="image_url" class="erp-input" />
                  </div>
                  <div>
                    <label class="erp-label" for="weight">Weight</label>
                    <Field id="weight" name="weight" type="number" min="0" step="0.001" class="erp-input" />
                  </div>
                </div>
              </section>

              <section id="product-pricing" class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="mb-4">
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">Pricing and tax</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <template v-if="values.type === 'variable'">
                      Variable products use variation-level pricing. The parent product price is derived automatically from the variants.
                    </template>
                    <template v-else>
                      Base pricing for this product.
                    </template>
                  </div>
                </div>

                <div v-if="values.type !== 'variable'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label class="erp-label" for="selling_price">Selling price</label>
                    <Field id="selling_price" name="selling_price" type="number" min="0" step="0.01" class="erp-input" />
                    <ErrorMessage name="selling_price" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="purchase_price">Purchase price</label>
                    <Field id="purchase_price" name="purchase_price" type="number" min="0" step="0.01" class="erp-input" />
                    <ErrorMessage name="purchase_price" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="minimum_selling_price">Minimum selling price</label>
                    <Field id="minimum_selling_price" name="minimum_selling_price" type="number" min="0" step="0.01" class="erp-input" />
                  </div>
                  <div>
                    <label class="erp-label" for="profit_margin">Profit margin %</label>
                    <Field id="profit_margin" name="profit_margin" type="number" min="0" step="0.01" class="erp-input" />
                  </div>
                </div>

                <div
                  v-else
                  class="rounded-[5px] border border-cyan-200/70 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/25 dark:text-cyan-200"
                >
                  Product pricing for variable products is controlled entirely by the variation rows below.
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label class="erp-label" for="tax_rate_id">Tax rate</label>
                    <AppSelect
                      :model-value="values.tax_rate_id || null"
                      :options="taxRateOptions"
                      clearable
                      searchable
                      placeholder="No tax rate"
                      search-placeholder="Search tax rates"
                      @update:model-value="setFieldValue('tax_rate_id', $event || '')"
                    />
                  </div>
                  <div>
                    <label class="erp-label" for="tax_type">Tax type</label>
                    <AppSelect
                      :model-value="values.tax_type || null"
                      :options="taxTypeOptions"
                      placeholder="Select tax type"
                      @update:model-value="setFieldValue('tax_type', $event || 'exclusive')"
                    />
                  </div>
                  <div>
                    <label class="erp-label" for="price_group_id">Price group</label>
                    <AppSelect
                      :model-value="values.price_group_id || null"
                      :options="priceGroupOptions"
                      clearable
                      searchable
                      placeholder="No price group"
                      search-placeholder="Search price groups"
                      @update:model-value="setFieldValue('price_group_id', $event || '')"
                    />
                  </div>
                </div>
              </section>

              <section
                v-if="values.type === 'variable'"
                id="product-variations"
                class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
              >
                <div class="mb-4">
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">Product variations</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Select one or more templates and choose values under each template. Rows are generated automatically from the selected combinations.
                  </div>
                </div>

                <div v-if="selectedVariationTemplates(values).length" class="space-y-4">
                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div
                      v-for="template in selectedVariationTemplates(values)"
                      :key="template.id"
                      class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
                    >
                      <label class="erp-label">{{ template.name }} values</label>
                      <AppSelect
                        :model-value="values.variation_value_map?.[template.id] || []"
                        :options="variationValueOptions(template.id)"
                        multiple
                        searchable
                        placeholder="Select values"
                        search-placeholder="Search values"
                        @update:model-value="handleVariationValuesChange(values, setFieldValue, template.id, $event || [])"
                      />
                      <div class="erp-helper text-slate-500 dark:text-slate-400">
                        Pick all values you want included in the matrix.
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="!(values.variations || []).length"
                    class="rounded-[5px] border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200"
                  >
                    Select at least one value from every chosen template to generate variation rows.
                  </div>

                  <div v-else class="space-y-4">
                    <div
                      v-for="(variation, index) in values.variations"
                      :key="variation.id || variation.combination_key || index"
                      class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
                    >
                      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1.2fr)_minmax(14rem,1.6fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(8rem,0.9fr)_minmax(8rem,0.9fr)_minmax(8rem,0.9fr)_auto]">
                        <div class="min-w-0">
                          <label class="erp-label">Variant</label>
                          <Field :name="`variations[${index}].name`" class="erp-input" readonly />
                          <ErrorMessage :name="`variations[${index}].name`" class="erp-helper text-rose-500 dark:text-rose-400" />
                        </div>
                        <div class="min-w-0">
                          <label class="erp-label">Selected values</label>
                          <div class="erp-input flex min-h-[46px] flex-wrap items-center gap-1.5">
                            <span
                              v-for="valueLabel in variationValueLabels(variation.variation_value_ids)"
                              :key="valueLabel"
                              class="inline-flex rounded-[10px] bg-cyan-100 px-2 py-1 text-[11px] font-medium text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300"
                            >
                              {{ valueLabel }}
                            </span>
                          </div>
                        </div>
                        <div class="min-w-0">
                          <label class="erp-label">Variation SKU</label>
                          <Field :name="`variations[${index}].sku`" class="erp-input" />
                          <ErrorMessage :name="`variations[${index}].sku`" class="erp-helper text-rose-500 dark:text-rose-400" />
                        </div>
                        <div class="min-w-0">
                          <label class="erp-label">Barcode</label>
                          <Field :name="`variations[${index}].barcode`" class="erp-input" />
                        </div>
                        <div class="min-w-0">
                          <label class="erp-label">Sell</label>
                          <Field :name="`variations[${index}].selling_price`" type="number" min="0" step="0.01" class="erp-input" />
                        </div>
                        <div class="min-w-0">
                          <label class="erp-label">Buy</label>
                          <Field :name="`variations[${index}].purchase_price`" type="number" min="0" step="0.01" class="erp-input" />
                        </div>
                        <div class="min-w-0">
                          <label class="erp-label">Min</label>
                          <Field :name="`variations[${index}].minimum_selling_price`" type="number" min="0" step="0.01" class="erp-input" />
                        </div>
                        <div class="flex items-end xl:justify-end">
                          <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                            <input
                              type="checkbox"
                              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              :checked="variation.is_active !== false"
                              @change="setFieldValue(`variations[${index}].is_active`, $event.target.checked)"
                            />
                            <span>Active</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-else
                  class="rounded-[5px] border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300"
                >
                  Choose one or more variation templates in the right-side Catalog setup panel to begin.
                </div>

                <ErrorMessage name="variation_template_ids" class="erp-helper text-rose-500 dark:text-rose-400" />
                <ErrorMessage name="variations" class="erp-helper text-rose-500 dark:text-rose-400" />
              </section>

              <section
                v-if="values.type === 'combo'"
                id="product-combo"
                class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
              >
                <div class="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">Combo components</div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Combo products do not track their own stock. Their components do.
                    </div>
                  </div>
                  <button type="button" class="erp-button-secondary" @click="addComboItem(values, setFieldValue)">
                    <i class="fa-solid fa-plus"></i>
                    Add component
                  </button>
                </div>

                <div v-if="values.combo_items?.length" class="space-y-4">
                  <div
                    v-for="(comboItem, index) in values.combo_items"
                    :key="comboItem.id || index"
                    class="grid gap-4 rounded-[5px] border border-slate-200/80 p-4 md:grid-cols-[1.5fr_1.5fr_0.8fr_auto] dark:border-slate-800/80"
                  >
                    <div>
                      <label class="erp-label">Component product</label>
                      <AppSelect
                        :model-value="comboItem.child_product_id || null"
                        :options="comboProductOptions(values.id)"
                        searchable
                        placeholder="Select product"
                        search-placeholder="Search products"
                        @update:model-value="handleComboProductChange(values, setFieldValue, index, $event)"
                      />
                    </div>
                    <div>
                      <label class="erp-label">Component variation</label>
                      <AppSelect
                        :model-value="comboItem.child_variation_id || null"
                        :options="comboVariationOptions(comboItem.child_product_id)"
                        clearable
                        searchable
                        placeholder="Optional variation"
                        search-placeholder="Search variations"
                        :disabled="!comboItem.child_product_id"
                        @update:model-value="setFieldValue(`combo_items[${index}].child_variation_id`, $event || '')"
                      />
                    </div>
                    <div>
                      <label class="erp-label">Quantity</label>
                      <Field :name="`combo_items[${index}].quantity`" type="number" min="0.0001" step="0.0001" class="erp-input" />
                    </div>
                    <div class="flex items-end">
                      <button type="button" class="erp-button-icon" @click="removeComboItem(values, setFieldValue, index)">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <ErrorMessage name="combo_items" class="erp-helper text-rose-500 dark:text-rose-400" />
              </section>

              <section id="product-packaging" class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">Pack sizes</div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Product-level packs handle cases like 24 cans per case and 48 cans per case.
                    </div>
                  </div>
                  <button type="button" class="erp-button-secondary" @click="addPackaging(values, setFieldValue)">
                    <i class="fa-solid fa-plus"></i>
                    Add pack size
                  </button>
                </div>

                <div v-if="values.packagings?.length" class="space-y-4">
                  <div
                    v-for="(packaging, index) in values.packagings"
                    :key="packaging.id || index"
                    class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
                  >
                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label class="erp-label">Pack name</label>
                        <Field :name="`packagings[${index}].name`" class="erp-input" />
                      </div>
                      <div>
                        <label class="erp-label">Short name</label>
                        <Field :name="`packagings[${index}].short_name`" class="erp-input" />
                      </div>
                      <div>
                        <label class="erp-label">Conversion factor</label>
                        <Field :name="`packagings[${index}].conversion_factor`" type="number" min="0.0001" step="0.0001" class="erp-input" />
                      </div>
                      <div>
                        <label class="erp-label">Pack SKU</label>
                        <Field :name="`packagings[${index}].sku`" class="erp-input" />
                      </div>
                    </div>

                    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <label class="erp-label">Pack barcode</label>
                        <Field :name="`packagings[${index}].barcode`" class="erp-input" />
                      </div>
                      <div>
                        <label class="erp-label">Pack selling price</label>
                        <Field :name="`packagings[${index}].selling_price`" type="number" min="0" step="0.01" class="erp-input" />
                      </div>
                      <div>
                        <label class="erp-label">Pack purchase price</label>
                        <Field :name="`packagings[${index}].purchase_price`" type="number" min="0" step="0.01" class="erp-input" />
                      </div>
                      <div class="flex items-end justify-between gap-3">
                        <div class="flex flex-wrap items-center gap-3">
                          <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              :checked="Boolean(packaging.is_default)"
                              @change="setPackagingDefault(values, setFieldValue, index, $event.target.checked)"
                            />
                            <span>Default</span>
                          </label>
                          <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              :checked="packaging.is_active !== false"
                              @change="setFieldValue(`packagings[${index}].is_active`, $event.target.checked)"
                            />
                            <span>Active</span>
                          </label>
                        </div>
                        <button type="button" class="erp-button-icon" @click="removePackaging(values, setFieldValue, index)">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section
                v-if="customFieldDefinitions.length"
                id="product-custom-fields"
                class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
              >
                <div class="mb-4">
                  <div class="text-sm font-semibold text-slate-950 dark:text-white">Custom fields</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Product-specific fields defined by this business.
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div v-for="definition in customFieldDefinitions" :key="definition.id">
                    <label class="erp-label" :for="`custom-${definition.field_name}`">{{ definition.field_label }}</label>
                    <Field
                      v-if="definition.field_type === 'text' || definition.field_type === 'number' || definition.field_type === 'date'"
                      :id="`custom-${definition.field_name}`"
                      :name="`custom_field_${definition.field_name}`"
                      :type="definition.field_type === 'date' ? 'date' : definition.field_type === 'number' ? 'number' : 'text'"
                      class="erp-input"
                    />
                    <AppSelect
                      v-else-if="definition.field_type === 'select'"
                      :model-value="values[`custom_field_${definition.field_name}`] ?? null"
                      :options="(definition.options || []).map((option) => ({ value: option, label: option }))"
                      clearable
                      placeholder="Select option"
                      @update:model-value="setFieldValue(`custom_field_${definition.field_name}`, $event || '')"
                    />
                    <label
                      v-else-if="definition.field_type === 'checkbox'"
                      class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300"
                    >
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values[`custom_field_${definition.field_name}`])"
                        @change="setFieldValue(`custom_field_${definition.field_name}`, $event.target.checked)"
                      />
                      <span>{{ definition.field_label }}</span>
                    </label>
                  </div>
                </div>
              </section>
            </div>

            <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <section class="rounded-[5px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Form navigation</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Jump between sections instead of scrolling through one long form.
                </div>
                <div class="mt-4 grid gap-2">
                  <button type="button" class="rounded-[5px] border border-slate-200/80 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:text-cyan-300" @click="scrollToSection('product-general')">General information</button>
                  <button type="button" class="rounded-[5px] border border-slate-200/80 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:text-cyan-300" @click="scrollToSection('product-pricing')">Pricing and tax</button>
                  <button v-if="values.type === 'variable'" type="button" class="rounded-[5px] border border-slate-200/80 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:text-cyan-300" @click="scrollToSection('product-variations')">Variations</button>
                  <button v-if="values.type === 'combo'" type="button" class="rounded-[5px] border border-slate-200/80 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:text-cyan-300" @click="scrollToSection('product-combo')">Combo components</button>
                  <button type="button" class="rounded-[5px] border border-slate-200/80 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:text-cyan-300" @click="scrollToSection('product-packaging')">Pack sizes</button>
                  <button v-if="customFieldDefinitions.length" type="button" class="rounded-[5px] border border-slate-200/80 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:text-cyan-300" @click="scrollToSection('product-custom-fields')">Custom fields</button>
                </div>
              </section>

              <section class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Catalog setup</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Connect the product to the right category, brand, unit, and variation templates.
                </div>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="erp-label" for="category_id">Category</label>
                    <AppSelect
                      :model-value="values.category_id || null"
                      :options="categoryOptions"
                      clearable
                      searchable
                      placeholder="Select category"
                      search-placeholder="Search categories"
                      @update:model-value="setFieldValue('category_id', $event || '')"
                    />
                  </div>
                  <div>
                    <label class="erp-label" for="brand_id">Brand</label>
                    <AppSelect
                      :model-value="values.brand_id || null"
                      :options="brandOptions"
                      clearable
                      searchable
                      placeholder="Select brand"
                      search-placeholder="Search brands"
                      @update:model-value="setFieldValue('brand_id', $event || '')"
                    />
                  </div>
                  <div>
                    <label class="erp-label" for="unit_id">Base unit</label>
                    <AppSelect
                      :model-value="values.unit_id || null"
                      :options="unitOptions"
                      clearable
                      searchable
                      placeholder="Select unit"
                      search-placeholder="Search units"
                      @update:model-value="handleUnitChange(values, setFieldValue, $event)"
                    />
                    <ErrorMessage name="unit_id" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="sub_unit_id">Generic sub-unit</label>
                    <AppSelect
                      :model-value="values.sub_unit_id || null"
                      :options="subUnitOptions(values.unit_id)"
                      clearable
                      searchable
                      placeholder="Optional sub-unit"
                      search-placeholder="Search sub-units"
                      :disabled="!values.unit_id"
                      @update:model-value="setFieldValue('sub_unit_id', $event || '')"
                    />
                  </div>
                  <div>
                    <label class="erp-label" for="variation_template_ids">Variation templates</label>
                    <AppSelect
                      :model-value="values.variation_template_ids || []"
                      :options="variationTemplateOptions"
                      multiple
                      searchable
                      clearable
                      placeholder="Select templates"
                      search-placeholder="Search templates"
                      :disabled="values.type !== 'variable'"
                      @update:model-value="handleVariationTemplatesChange(values, setFieldValue, $event || [])"
                    />
                    <ErrorMessage name="variation_template_ids" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                </div>
              </section>

              <section class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Selling and stock behavior</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Decide how the product is sold, tracked, and monitored once it is live.
                </div>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="erp-label" for="stock_tracking">Stock tracking</label>
                    <AppSelect
                      :model-value="values.stock_tracking || null"
                      :options="stockTrackingFormOptions"
                      placeholder="Select stock mode"
                      :disabled="!values.track_inventory || ['service', 'combo'].includes(values.type)"
                      @update:model-value="setFieldValue('stock_tracking', $event || 'none')"
                    />
                    <ErrorMessage name="stock_tracking" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="rack_location_id">Rack location</label>
                    <AppSelect
                      :model-value="values.rack_location_id || null"
                      :options="rackLocationOptions"
                      clearable
                      searchable
                      placeholder="No rack location"
                      search-placeholder="Search rack locations"
                      :disabled="!store.formOptions.rack_locations_enabled"
                      @update:model-value="setFieldValue('rack_location_id', $event || '')"
                    />
                    <div v-if="!store.formOptions.rack_locations_enabled" class="erp-helper text-amber-600 dark:text-amber-300">
                      Rack locations are currently disabled in stock settings.
                    </div>
                  </div>
                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <label class="erp-label" for="alert_quantity">Alert quantity</label>
                      <Field id="alert_quantity" name="alert_quantity" type="number" min="0" step="0.001" class="erp-input" />
                    </div>
                    <div>
                      <label class="erp-label" for="max_stock_level">Max stock level</label>
                      <Field id="max_stock_level" name="max_stock_level" type="number" min="0" step="0.001" class="erp-input" />
                    </div>
                  </div>
                  <div class="space-y-3">
                    <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values.track_inventory)"
                        @change="handleTrackInventoryChange(values, setFieldValue, $event.target.checked)"
                      />
                      <span>Track inventory</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values.has_expiry)"
                        :disabled="['service', 'combo'].includes(values.type)"
                        @change="setFieldValue('has_expiry', $event.target.checked)"
                      />
                      <span>Track expiry information</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values.is_for_selling)"
                        @change="setFieldValue('is_for_selling', $event.target.checked)"
                      />
                      <span>Available for selling</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values.is_active)"
                        @change="setFieldValue('is_active', $event.target.checked)"
                      />
                      <span>Product is active</span>
                    </label>
                  </div>
                </div>
              </section>

              <section class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Actions</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Save when the product setup is complete, or go back to the list.
                </div>
                <div class="mt-4 flex flex-col gap-3">
                  <button type="submit" class="erp-button-primary justify-center" :disabled="store.saving || store.optionsLoading">
                    <span
                      v-if="store.saving"
                      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                    ></span>
                    {{ isEditMode ? 'Save product' : 'Create product' }}
                  </button>
                  <button type="button" class="erp-button-secondary justify-center" :disabled="store.saving" @click="goBack">
                    Cancel
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </Form>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { useRoute, useRouter } from 'vue-router'
import AppAlert from '@components/ui/AppAlert.vue'
import LoadingSpinner from '@components/ui/LoadingSpinner.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useProductsStore } from '@stores/products'

const route = useRoute()
const router = useRouter()
const store = useProductsStore()

const product = ref(null)
const formKey = ref(0)
const pageLoading = ref(true)
const loadError = ref('')
const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })

const isEditMode = computed(() => route.name === 'product-edit')
const pageTitle = computed(() => (isEditMode.value ? 'Edit product' : 'Create product'))
const pageSubtitle = computed(() =>
  isEditMode.value
    ? 'Update product details, pricing rules, variations, combos, and pack sizes.'
    : 'Create a new product with the right pricing, stock behavior, and catalog relationships.'
)
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Catalog' },
  { label: 'Products', to: '/catalog/products' },
  { label: isEditMode.value ? 'Edit' : 'Create' },
])

const typeFormOptions = [
  { value: 'single', label: 'Single product' },
  { value: 'variable', label: 'Variable product' },
  { value: 'service', label: 'Service' },
  { value: 'combo', label: 'Combo product' },
]

const barcodeTypeOptions = [
  { value: 'C128', label: 'Code 128' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'QR', label: 'QR code' },
]

const stockTrackingFormOptions = [
  { value: 'none', label: 'None' },
  { value: 'lot', label: 'Lot / Batch' },
  { value: 'serial', label: 'Serial' },
]

const taxTypeOptions = [
  { value: 'exclusive', label: 'Exclusive' },
  { value: 'inclusive', label: 'Inclusive' },
]

const categoryOptions = computed(() =>
  (store.formOptions.categories || []).map((category) => ({
    value: category.id,
    label: category.parent?.name ? `${category.parent.name} / ${category.name}` : category.name,
    description: category.parent?.name || '',
  }))
)

const brandOptions = computed(() =>
  (store.formOptions.brands || []).map((brand) => ({
    value: brand.id,
    label: brand.name,
  }))
)

const unitOptions = computed(() =>
  (store.formOptions.units || []).map((unit) => ({
    value: unit.id,
    label: `${unit.name} (${unit.short_name})`,
    description: unit.sub_units_count ? `${unit.sub_units_count} sub-unit(s)` : '',
  }))
)

const taxRateOptions = computed(() =>
  (store.formOptions.tax_rates || []).map((taxRate) => ({
    value: taxRate.id,
    label: `${taxRate.name} (${taxRate.rate}${taxRate.type === 'percentage' ? '%' : ''})`,
  }))
)

const priceGroupOptions = computed(() =>
  (store.formOptions.price_groups || []).map((priceGroup) => ({
    value: priceGroup.id,
    label: priceGroup.name,
    description: priceGroup.is_default ? 'Default price group' : '',
  }))
)

const variationTemplateOptions = computed(() =>
  (store.formOptions.variation_templates || []).map((template) => ({
    value: template.id,
    label: template.name,
    description: template.values_count ? `${template.values_count} value(s)` : '',
  }))
)

const rackLocationOptions = computed(() =>
  (store.formOptions.rack_locations || []).map((rackLocation) => ({
    value: rackLocation.id,
    label: `${rackLocation.name} (${rackLocation.code})`,
    description: rackLocation.warehouse?.name || '',
  }))
)

const customFieldDefinitions = computed(() => store.formOptions.custom_fields || [])

const comboProductOptions = (currentProductId = null) =>
  (store.formOptions.combo_products || [])
    .filter((item) => item.id !== currentProductId)
    .map((item) => ({
      value: item.id,
      label: `${item.name} (${item.sku})`,
      description: formatType(item.type),
    }))

const comboVariationOptions = (productId) => {
  const selectedProduct = (store.formOptions.combo_products || []).find((item) => item.id === productId)

  return (selectedProduct?.variations || []).map((variation) => ({
    value: variation.id,
    label: `${variation.name} (${variation.sku})`,
  }))
}

const variationValueOptions = (templateId) => {
  const template = (store.formOptions.variation_templates || []).find((item) => item.id === templateId)

  return (template?.values || []).map((value) => ({
    value: value.id,
    label: value.name,
  }))
}

const variationValueLabelMap = computed(() => {
  const labels = {}

  for (const template of store.formOptions.variation_templates || []) {
    for (const value of template.values || []) {
      labels[value.id] = value.name
    }
  }

  return labels
})

const templateIdByValueId = computed(() => {
  const map = {}

  for (const template of store.formOptions.variation_templates || []) {
    for (const value of template.values || []) {
      map[value.id] = template.id
    }
  }

  return map
})

const subUnitOptions = (unitId) => {
  const unit = (store.formOptions.units || []).find((item) => item.id === unitId)

  return (unit?.sub_units || []).map((subUnit) => ({
    value: subUnit.id,
    label: `${subUnit.name} (${subUnit.short_name})`,
    description: `Factor ${subUnit.conversion_factor}`,
  }))
}

const defaultCustomFieldValue = (definition) => {
  if (definition.field_type === 'checkbox') {
    return false
  }

  return ''
}

const resolveVariationTemplateIds = (current) => {
  if (Array.isArray(current?.variation_template_ids) && current.variation_template_ids.length) {
    return current.variation_template_ids
  }

  return current?.variation_template_id ? [current.variation_template_id] : []
}

const buildVariationValueMap = (current) => {
  const templateIds = resolveVariationTemplateIds(current)
  const map = Object.fromEntries(templateIds.map((templateId) => [templateId, []]))

  for (const variation of current?.variations || []) {
    for (const valueId of variation.variation_value_ids || []) {
      const templateId = templateIdByValueId.value[valueId]

      if (!templateId || !templateIds.includes(templateId)) {
        continue
      }

      map[templateId] ??= []

      if (!map[templateId].includes(valueId)) {
        map[templateId].push(valueId)
      }
    }
  }

  return map
}

const formValues = computed(() => {
  const current = product.value
  const customFieldValues = {}

  for (const definition of customFieldDefinitions.value) {
    customFieldValues[`custom_field_${definition.field_name}`] = current?.custom_fields?.[definition.field_name] ?? defaultCustomFieldValue(definition)
  }

  return {
    id: current?.id ?? null,
    category_id: current?.category_id ?? '',
    brand_id: current?.brand_id ?? '',
    unit_id: current?.unit_id ?? '',
    sub_unit_id: current?.sub_unit_id ?? '',
    tax_rate_id: current?.tax_rate_id ?? '',
    rack_location_id: current?.rack_location_id ?? '',
    variation_template_ids: resolveVariationTemplateIds(current),
    variation_value_map: buildVariationValueMap(current),
    price_group_id: current?.price_group_id ?? '',
    name: current?.name ?? '',
    description: current?.description ?? '',
    sku: current?.sku ?? '',
    barcode: current?.barcode ?? '',
    barcode_type: current?.barcode_type ?? 'C128',
    type: current?.type ?? 'single',
    stock_tracking: current?.stock_tracking ?? 'none',
    has_expiry: current?.has_expiry ?? false,
    selling_price: current?.type === 'variable' ? '' : (current?.selling_price ?? '0.00'),
    purchase_price: current?.type === 'variable' ? '' : (current?.purchase_price ?? '0.00'),
    minimum_selling_price: current?.type === 'variable' ? '' : (current?.minimum_selling_price ?? ''),
    profit_margin: current?.profit_margin ?? '',
    tax_type: current?.tax_type ?? 'exclusive',
    track_inventory: current?.track_inventory ?? true,
    alert_quantity: current?.alert_quantity ?? '',
    max_stock_level: current?.max_stock_level ?? '',
    is_for_selling: current?.is_for_selling ?? true,
    is_active: current?.is_active ?? true,
    weight: current?.weight ?? '',
    image_url: current?.image_url ?? '',
    variations: (current?.variations || []).map((variation) => ({
      id: variation.id,
      name: variation.name,
      variation_value_ids: variation.variation_value_ids || [],
      sku: variation.sku,
      barcode: variation.barcode ?? '',
      selling_price: variation.selling_price ?? '',
      purchase_price: variation.purchase_price ?? '',
      minimum_selling_price: variation.minimum_selling_price ?? '',
      is_active: variation.is_active !== false,
    })),
    combo_items: (current?.combo_items || []).map((comboItem) => ({
      id: comboItem.id,
      child_product_id: comboItem.child_product_id,
      child_variation_id: comboItem.child_variation_id ?? '',
      quantity: comboItem.quantity ?? '1.0000',
    })),
    packagings: (current?.packagings || []).map((packaging) => ({
      id: packaging.id,
      name: packaging.name,
      short_name: packaging.short_name ?? '',
      conversion_factor: packaging.conversion_factor ?? '1.0000',
      sku: packaging.sku ?? '',
      barcode: packaging.barcode ?? '',
      selling_price: packaging.selling_price ?? '',
      purchase_price: packaging.purchase_price ?? '',
      is_default: Boolean(packaging.is_default),
      is_active: packaging.is_active !== false,
    })),
    ...customFieldValues,
  }
})

const schema = yup.object({
  name: yup.string().required().max(150),
  sku: yup.string().nullable().max(100),
  type: yup.string().required().oneOf(['single', 'variable', 'service', 'combo']),
  barcode_type: yup.string().required().oneOf(['C128', 'EAN13', 'QR']),
  stock_tracking: yup.string().required().oneOf(['none', 'lot', 'serial']),
  selling_price: yup.number().nullable().transform((value, originalValue) => (originalValue === '' ? null : value)).when('type', {
    is: 'variable',
    then: (baseSchema) => baseSchema.nullable(),
    otherwise: (baseSchema) => baseSchema.typeError('Selling price is required.').required().min(0),
  }),
  purchase_price: yup.number().nullable().transform((value, originalValue) => (originalValue === '' ? null : value)).when('type', {
    is: 'variable',
    then: (baseSchema) => baseSchema.nullable(),
    otherwise: (baseSchema) => baseSchema.typeError('Purchase price is required.').required().min(0),
  }),
  tax_type: yup.string().required().oneOf(['inclusive', 'exclusive']),
  variation_template_ids: yup.array().when('type', {
    is: 'variable',
    then: (baseSchema) => baseSchema.of(yup.string().required()).min(1, 'Select at least one variation template.').required(),
    otherwise: (baseSchema) => baseSchema.default([]),
  }),
  variations: yup.array().when('type', {
    is: 'variable',
    then: (baseSchema) => baseSchema.min(1, 'Select values from each template to generate at least one variation.'),
    otherwise: (baseSchema) => baseSchema,
  }),
  combo_items: yup.array().when('type', {
    is: 'combo',
    then: (baseSchema) => baseSchema.min(1, 'At least one combo component is required.'),
    otherwise: (baseSchema) => baseSchema,
  }),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
}

const scrollToSection = (sectionId) => {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const formatType = (type) => ({
  single: 'Single',
  variable: 'Variable',
  service: 'Service',
  combo: 'Combo',
}[type] || type)

const selectedVariationTemplates = (values) => {
  const templateIds = values.variation_template_ids || []

  return (store.formOptions.variation_templates || []).filter((template) => templateIds.includes(template.id))
}

const variationValueLabels = (valueIds) =>
  (valueIds || []).map((valueId) => variationValueLabelMap.value[valueId] || valueId)

const combinationKey = (valueIds, templateIds) => {
  const ids = orderedVariationValueIds(valueIds, templateIds)
  return ids.join('|')
}

const orderedVariationValueIds = (valueIds, templateIds) => {
  const grouped = {}

  for (const valueId of valueIds || []) {
    const templateId = templateIdByValueId.value[valueId]

    if (!templateId) {
      continue
    }

    grouped[templateId] = valueId
  }

  return templateIds.map((templateId) => grouped[templateId]).filter(Boolean)
}

const buildVariationName = (valueIds) => variationValueLabels(valueIds).join('-')

const cartesianProduct = (groups) =>
  groups.reduce(
    (accumulator, group) =>
      accumulator.flatMap((item) => group.map((value) => [...item, value])),
    [[]]
  )

const buildGeneratedVariations = (currentVariations, templateIds, variationValueMap) => {
  if (!templateIds.length) {
    return []
  }

  const selectedGroups = templateIds.map((templateId) =>
    (variationValueMap?.[templateId] || []).filter(Boolean)
  )

  if (selectedGroups.some((group) => group.length === 0)) {
    return []
  }

  const existingByCombination = new Map(
    (currentVariations || []).map((variation) => [
      combinationKey(variation.variation_value_ids || [], templateIds),
      variation,
    ])
  )

  return cartesianProduct(selectedGroups).map((valueIds) => {
    const orderedIds = orderedVariationValueIds(valueIds, templateIds)
    const key = combinationKey(orderedIds, templateIds)
    const existing = existingByCombination.get(key)

    return {
      id: existing?.id ?? null,
      name: buildVariationName(orderedIds),
      combination_key: key,
      variation_value_ids: orderedIds,
      sku: existing?.sku ?? '',
      barcode: existing?.barcode ?? '',
      selling_price: existing?.selling_price ?? '0.00',
      purchase_price: existing?.purchase_price ?? '0.00',
      minimum_selling_price: existing?.minimum_selling_price ?? '',
      is_active: existing?.is_active !== false,
    }
  })
}

const syncGeneratedVariations = (values, setFieldValue, templateIds, variationValueMap) => {
  setFieldValue(
    'variations',
    buildGeneratedVariations(values.variations || [], templateIds, variationValueMap)
  )
}

const handleVariationTemplatesChange = (values, setFieldValue, templateIds) => {
  const nextTemplateIds = [...new Set(templateIds)]
  const nextValueMap = {}

  for (const templateId of nextTemplateIds) {
    const validValueIds = new Set(variationValueOptions(templateId).map((option) => option.value))
    nextValueMap[templateId] = (values.variation_value_map?.[templateId] || []).filter((valueId) => validValueIds.has(valueId))
  }

  setFieldValue('variation_template_ids', nextTemplateIds)
  setFieldValue('variation_value_map', nextValueMap)
  syncGeneratedVariations(values, setFieldValue, nextTemplateIds, nextValueMap)
}

const handleVariationValuesChange = (values, setFieldValue, templateId, valueIds) => {
  const nextTemplateIds = values.variation_template_ids || []
  const nextValueMap = {
    ...(values.variation_value_map || {}),
    [templateId]: [...new Set(valueIds)],
  }

  setFieldValue('variation_value_map', nextValueMap)
  syncGeneratedVariations(values, setFieldValue, nextTemplateIds, nextValueMap)
}

const addComboItem = (values, setFieldValue) => {
  setFieldValue('combo_items', [
    ...(values.combo_items || []),
    {
      id: null,
      child_product_id: '',
      child_variation_id: '',
      quantity: '1.0000',
    },
  ])
}

const removeComboItem = (values, setFieldValue, index) => {
  setFieldValue('combo_items', (values.combo_items || []).filter((_, itemIndex) => itemIndex !== index))
}

const addPackaging = (values, setFieldValue) => {
  setFieldValue('packagings', [
    ...(values.packagings || []),
    {
      id: null,
      name: '',
      short_name: '',
      conversion_factor: '1.0000',
      sku: '',
      barcode: '',
      selling_price: '',
      purchase_price: '',
      is_default: (values.packagings || []).length === 0,
      is_active: true,
    },
  ])
}

const removePackaging = (values, setFieldValue, index) => {
  setFieldValue('packagings', (values.packagings || []).filter((_, itemIndex) => itemIndex !== index))
}

const setPackagingDefault = (values, setFieldValue, index, checked) => {
  setFieldValue(
    'packagings',
    (values.packagings || []).map((packaging, itemIndex) => ({
      ...packaging,
      is_default: itemIndex === index ? checked : false,
    }))
  )
}

const handleProductTypeChange = (values, setFieldValue, type) => {
  setFieldValue('type', type)

  if (['service', 'combo'].includes(type)) {
    setFieldValue('track_inventory', false)
    setFieldValue('stock_tracking', 'none')
    setFieldValue('has_expiry', false)
  }

  if (type !== 'variable') {
    setFieldValue('variation_template_ids', [])
    setFieldValue('variation_value_map', {})
    setFieldValue('variations', [])
  }

  if (type !== 'combo') {
    setFieldValue('combo_items', [])
  }
}

const handleTrackInventoryChange = (values, setFieldValue, checked) => {
  setFieldValue('track_inventory', checked)

  if (!checked) {
    setFieldValue('stock_tracking', 'none')
  }
}

const handleUnitChange = (values, setFieldValue, unitId) => {
  setFieldValue('unit_id', unitId || '')

  const validSubUnits = new Set(subUnitOptions(unitId).map((option) => option.value))

  if (!validSubUnits.has(values.sub_unit_id)) {
    setFieldValue('sub_unit_id', '')
  }
}

const handleComboProductChange = (values, setFieldValue, index, productId) => {
  setFieldValue(`combo_items[${index}].child_product_id`, productId || '')
  setFieldValue(`combo_items[${index}].child_variation_id`, '')
}

const buildPayload = (values) => {
  const customFields = {}

  for (const definition of customFieldDefinitions.value) {
    const key = `custom_field_${definition.field_name}`
    customFields[definition.field_name] = values[key] ?? defaultCustomFieldValue(definition)
  }

  return {
    category_id: values.category_id || null,
    brand_id: values.brand_id || null,
    unit_id: values.unit_id || null,
    sub_unit_id: values.sub_unit_id || null,
    tax_rate_id: values.tax_rate_id || null,
    rack_location_id: values.rack_location_id || null,
    variation_template_id: values.type === 'variable' ? (values.variation_template_ids?.[0] || null) : null,
    variation_template_ids: values.type === 'variable' ? (values.variation_template_ids || []) : [],
    price_group_id: values.price_group_id || null,
    name: values.name,
    description: values.description || null,
    sku: values.sku,
    barcode: values.barcode || null,
    barcode_type: values.barcode_type,
    type: values.type,
    stock_tracking: values.track_inventory ? values.stock_tracking : 'none',
    has_expiry: Boolean(values.has_expiry),
    selling_price: values.type === 'variable' ? null : (values.selling_price || 0),
    purchase_price: values.type === 'variable' ? null : (values.purchase_price || 0),
    minimum_selling_price: values.type === 'variable' ? null : (values.minimum_selling_price || null),
    profit_margin: values.profit_margin || null,
    tax_type: values.tax_type,
    track_inventory: Boolean(values.track_inventory),
    alert_quantity: values.alert_quantity || null,
    max_stock_level: values.max_stock_level || null,
    is_for_selling: Boolean(values.is_for_selling),
    is_active: Boolean(values.is_active),
    weight: values.weight || null,
    image_url: values.image_url || null,
    custom_fields: customFields,
    variations: values.type === 'variable'
      ? (values.variations || []).map((variation) => ({
          id: variation.id || null,
          name: variation.name,
          variation_value_ids: variation.variation_value_ids || [],
          sku: variation.sku,
          barcode: variation.barcode || null,
          selling_price: variation.selling_price || 0,
          purchase_price: variation.purchase_price || 0,
          minimum_selling_price: variation.minimum_selling_price || null,
          is_active: variation.is_active !== false,
        }))
      : [],
    combo_items: values.type === 'combo'
      ? (values.combo_items || []).map((comboItem) => ({
          id: comboItem.id || null,
          child_product_id: comboItem.child_product_id,
          child_variation_id: comboItem.child_variation_id || null,
          quantity: comboItem.quantity || 1,
        }))
      : [],
    packagings: (values.packagings || []).map((packaging) => ({
      id: packaging.id || null,
      name: packaging.name,
      short_name: packaging.short_name || null,
      conversion_factor: packaging.conversion_factor || 1,
      sku: packaging.sku || null,
      barcode: packaging.barcode || null,
      selling_price: packaging.selling_price || null,
      purchase_price: packaging.purchase_price || null,
      is_default: Boolean(packaging.is_default),
      is_active: packaging.is_active !== false,
    })),
  }
}

const submitForm = async (values) => {
  try {
    const payload = buildPayload(values)

    if (isEditMode.value) {
      await store.updateProduct(product.value.id, payload)
      await router.push({ name: 'products', query: { notice: 'updated' } })
      return
    }

    await store.createProduct(payload)
    await router.push({ name: 'products', query: { notice: 'created' } })
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the product.')
  }
}

const goBack = () => {
  router.push({ name: 'products' })
}

const loadPage = async () => {
  pageLoading.value = true
  loadError.value = ''
  product.value = null

  try {
    await store.fetchFormOptions(true)

    if (isEditMode.value) {
      product.value = await store.fetchProduct(route.params.id)
    }

    formKey.value += 1
  } catch (error) {
    loadError.value = error.response?.data?.message || 'The product could not be loaded.'
  } finally {
    pageLoading.value = false
  }
}

watch(
  () => [route.name, route.params.id],
  async () => {
    await loadPage()
  },
  { immediate: true }
)
</script>
