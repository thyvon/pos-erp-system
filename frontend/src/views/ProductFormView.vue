<template>
  <AppLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :breadcrumbs="breadcrumbs"
  >
    <div class="space-y-5">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          Update the product details, pricing, and catalog information. For variable products, manage variations in the section below.
        </div>
        <button type="button" class="erp-button-secondary" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i>
          Back to products
        </button>
      </div>

      <section class="relative overflow-hidden rounded-[5px] border border-slate-200/80 bg-white/75 p-4 lg:p-5 shadow-[0_18px_45px_rgba(56,77,112,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
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
          <div class="space-y-5">
              <section id="product-general" class="erp-form-section">
                <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-slate-950 dark:text-white">General information</div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Start with the product identity, description, and media details.
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

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div class="xl:col-span-2">
                    <label class="erp-label" for="name">Product name <span class="text-rose-500">*</span></label>
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
                </div>

                <div class="mt-4 space-y-4">
                  <div class="grid gap-4 md:grid-cols-2 xl:max-w-3xl">
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
                    <div>
                      <label class="erp-label" for="type">Product type <span class="text-rose-500">*</span></label>
                      <AppSelect
                        :model-value="values.type || null"
                        :options="typeFormOptions"
                        placeholder="Select type"
                        @update:model-value="handleProductTypeChange(values, setFieldValue, $event || 'single')"
                      />
                      <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
                    </div>
                  </div>

                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Product type changes variations, combo items, and stock behavior.
                  </div>

                  <div>
                    <label class="erp-label" for="description">Description</label>
                    <RichTextEditor
                      :model-value="values.description || ''"
                      placeholder="Write a product description, highlights, or selling notes."
                      @update:model-value="setFieldValue('description', $event)"
                    />
                  </div>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
                  <div>
                    <label class="erp-label" for="image_file">Product image</label>
                    <input
                      id="image_file"
                      type="file"
                      accept="image/*"
                      class="erp-input file:mr-3 file:rounded-[5px] file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-cyan-700 dark:file:bg-cyan-950/40 dark:file:text-cyan-200"
                      @change="handleProductImageChange(setFieldValue, $event)"
                    />
                    <div class="erp-helper text-slate-500 dark:text-slate-400">
                      JPG, PNG, WEBP up to 5MB.
                    </div>
                    <div
                      v-if="values.image_preview_url"
                      class="mt-3 flex items-center gap-3 rounded-[5px] border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-900/60"
                    >
                      <img
                        :src="values.image_preview_url"
                        alt="Product preview"
                        class="h-16 w-16 rounded-[5px] object-cover"
                      />
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        Product image preview
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="erp-label" for="weight">Weight</label>
                    <Field id="weight" name="weight" type="number" min="0" step="0.001" class="erp-input" />
                  </div>
                </div>
              </section>

              <section class="erp-form-section">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Catalog setup</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Classify the product before you set prices, stock rules, or variations.
                </div>
                <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <div v-if="supportsUnits(values.type)" class="xl:col-span-1">
                    <label class="erp-label" for="unit_id">Base unit <span class="text-rose-500">*</span></label>
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
                  <div v-if="supportsUnits(values.type)" class="xl:col-span-1">
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
                  <div
                    v-if="!supportsUnits(values.type)"
                    class="rounded-[5px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 md:col-span-2 xl:col-span-2 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    Services do not require unit or variation-template setup.
                  </div>
                </div>
              </section>

              <section id="product-pricing" class="erp-form-section">
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
                    <label class="erp-label" for="selling_price">Base sell price <span class="text-rose-500">*</span></label>
                    <Field id="selling_price" name="selling_price" type="number" min="0" step="0.01" class="erp-input" @input="handleBaseSellingPriceInput(values, setFieldValue, $event)" />
                    <ErrorMessage name="selling_price" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <label class="erp-label" for="purchase_price">Base buy price <span class="text-rose-500">*</span></label>
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

                <div v-if="values.type === 'single'" class="mt-4 rounded-[5px] border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-900/50">
                  <div class="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Optional selling sub-unit. Stock remains in the base unit, while sell/buy prices below apply only to the selected sub-unit.
                  </div>
                  <label class="mb-4 flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      :checked="Boolean(values.use_sub_unit)"
                      @change="handleUseSubUnitToggle(values, setFieldValue, $event.target.checked)"
                    />
                    <span>Use sub-unit pricing for this product</span>
                  </label>

                  <div v-if="values.use_sub_unit" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <label class="erp-label" for="sub_unit_id">Sub-unit</label>
                      <AppSelect
                        :model-value="values.sub_unit_id || null"
                        :options="subUnitOptions(values.unit_id)"
                        clearable
                        searchable
                        placeholder="Select sub-unit"
                        search-placeholder="Search sub-units"
                        :disabled="!values.unit_id"
                        @update:model-value="handleProductConversionUnitChange(values, setFieldValue, $event)"
                      />
                      <div class="erp-helper text-slate-500 dark:text-slate-400">
                        Choose the alternate selling unit under the selected base unit.
                      </div>
                    </div>
                    <div>
                      <label class="erp-label" for="sub_unit_selling_price">Sub-unit sell price</label>
                      <Field id="sub_unit_selling_price" name="sub_unit_selling_price" type="number" min="0" step="0.01" class="erp-input" :disabled="!values.sub_unit_id" />
                    </div>
                    <div>
                      <label class="erp-label" for="sub_unit_purchase_price">Sub-unit buy price</label>
                      <Field id="sub_unit_purchase_price" name="sub_unit_purchase_price" type="number" min="0" step="0.01" class="erp-input" :disabled="!values.sub_unit_id" />
                    </div>
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
                    <label class="erp-label" for="tax_type">Tax type <span class="text-rose-500">*</span></label>
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
            class="erp-form-section"
            >
            <div class="mb-4">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Product variations</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select one or more templates and choose values under each template. Rows are generated automatically from the selected combinations.
                </div>
            </div>

            <div class="mb-4 max-w-xl">
                <label class="erp-label" for="variation_template_ids">Variation templates <span class="text-rose-500">*</span></label>
                <AppSelect
                :model-value="values.variation_template_ids || []"
                :options="variationTemplateOptions"
                multiple
                searchable
                clearable
                placeholder="Select templates"
                search-placeholder="Search templates"
                @update:model-value="handleVariationTemplatesChange(values, setFieldValue, $event || [])"
                />
                <ErrorMessage name="variation_template_ids" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div v-if="selectedVariationTemplates(values).length" class="space-y-4">
                <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    :checked="Boolean(values.use_sub_unit)"
                    @change="handleUseSubUnitToggle(values, setFieldValue, $event.target.checked)"
                  />
                  <span>Use sub-unit pricing for generated variations</span>
                </label>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div
                    v-for="template in selectedVariationTemplates(values)"
                    :key="template.id"
                    class="erp-form-subcard"
                >
                    <label class="erp-label">{{ template.name }} values <span class="text-rose-500">*</span></label>
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

                <div v-else class="overflow-x-auto rounded-[5px] border border-slate-200/80 dark:border-slate-800/80">

                <!-- Header row -->
                <div
                  class="grid gap-3 border-b border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/50 dark:text-slate-400"
                  :class="values.use_sub_unit
                    ? 'grid-cols-[minmax(13rem,1.25fr)_minmax(9rem,0.9fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(10rem,0.9fr)_minmax(8rem,0.75fr)_minmax(6rem,0.55fr)]'
                    : 'grid-cols-[minmax(13rem,1.25fr)_minmax(9rem,0.9fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(10rem,0.9fr)_minmax(8rem,0.75fr)_minmax(6rem,0.55fr)]'"
                >
                    <div>Selected values</div>
                    <div>Variation SKU</div>
                    <template v-if="values.use_sub_unit">
                      <div>Sub-unit</div>
                    </template>
                    <div>Base sell <span class="text-rose-500">*</span></div>
                    <div>Base buy <span class="text-rose-500">*</span></div>
                    <template v-if="values.use_sub_unit">
                      <div>Sub sell</div>
                      <div>Sub buy</div>
                    </template>
                    <div>Min</div>
                    <div>Image</div>
                    <div class="text-center">Active</div>
                    <div class="text-left">Action</div>
                </div>
                <div
                    v-for="(variation, index) in values.variations"
                    :key="variation.id || variation.combination_key || index"
                    class="border-b border-slate-200/80 last:border-b-0 dark:border-slate-800/80"
                >
                    <Field :name="`variations[${index}].name`" type="hidden" />
                    <div
                      class="grid gap-3 px-3 py-2.5"
                      :class="values.use_sub_unit
                        ? 'grid-cols-[minmax(13rem,1.25fr)_minmax(9rem,0.9fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(10rem,0.9fr)_minmax(8rem,0.75fr)_minmax(6rem,0.55fr)]'
                        : 'grid-cols-[minmax(13rem,1.25fr)_minmax(9rem,0.9fr)_minmax(8rem,0.75fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(10rem,0.9fr)_minmax(8rem,0.75fr)_minmax(6rem,0.55fr)]'"
                    >
                    <div class="min-w-0">
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
                        <Field :name="`variations[${index}].sku`" class="erp-input" />
                        <div class="erp-helper text-slate-500 dark:text-slate-400">Auto if blank.</div>
                        <ErrorMessage :name="`variations[${index}].sku`" class="erp-helper text-rose-500 dark:text-rose-400" />
                    </div>
                    <template v-if="values.use_sub_unit">
                      <div class="min-w-0">
                          <AppSelect
                            :model-value="variation.sub_unit_id || null"
                            :options="subUnitOptions(values.unit_id)"
                            clearable
                            searchable
                            placeholder="Sub-unit"
                            search-placeholder="Search sub-units"
                            :disabled="!values.unit_id"
                            @update:model-value="handleVariationConversionUnitChange(values, setFieldValue, index, $event)"
                          />
                      </div>
                    </template>
                    <div class="min-w-0">
                        <Field :name="`variations[${index}].selling_price`" type="number" min="0" step="0.01" class="erp-input" @input="handleVariationSellingPriceInput(values, setFieldValue, index, $event)" />
                    </div>
                    <div class="min-w-0">
                        <Field :name="`variations[${index}].purchase_price`" type="number" min="0" step="0.01" class="erp-input" />
                    </div>
                    <template v-if="values.use_sub_unit">
                      <div class="min-w-0">
                          <Field :name="`variations[${index}].sub_unit_selling_price`" type="number" min="0" step="0.01" class="erp-input" :disabled="!variation.sub_unit_id" />
                      </div>
                      <div class="min-w-0">
                          <Field :name="`variations[${index}].sub_unit_purchase_price`" type="number" min="0" step="0.01" class="erp-input" :disabled="!variation.sub_unit_id" />
                      </div>
                    </template>
                    <div class="min-w-0">
                        <Field :name="`variations[${index}].minimum_selling_price`" type="number" min="0" step="0.01" class="erp-input" />
                    </div>
                    <div class="min-w-0">
                        <input
                          type="file"
                          accept="image/*"
                          class="erp-input mb-2 file:mr-2 file:rounded-[5px] file:border-0 file:bg-cyan-50 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-cyan-700 dark:file:bg-cyan-950/40 dark:file:text-cyan-200"
                          @change="handleVariationImageChange(values, setFieldValue, index, $event)"
                        />
                        <div v-if="variation.image_preview_url" class="mb-2">
                          <img :src="variation.image_preview_url" alt="Variation preview" class="h-12 w-12 rounded-[5px] object-cover" />
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-3 xl:justify-end">
                        <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                        <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            :checked="variation.is_active !== false"
                            @change="setFieldValue(`variations[${index}].is_active`, $event.target.checked)"
                        />
                        </label>
                        <button type="button" class="erp-button-icon text-rose-500" @click="removeVariation(values, setFieldValue, index)">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    </div>
                </div>

                </div>
            </div>

            <div
                v-else
                class="rounded-[5px] border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300"
            >
                Choose one or more variation templates above to begin.
            </div>

            <ErrorMessage name="variation_template_ids" class="erp-helper text-rose-500 dark:text-rose-400" />
            <ErrorMessage name="variations" class="erp-helper text-rose-500 dark:text-rose-400" />
            </section>

              <section
                v-if="values.type === 'combo'"
                id="product-combo"
                class="erp-form-section"
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
                    class="grid gap-3 rounded-[5px] border border-slate-200/80 p-3 md:grid-cols-[1.5fr_1.5fr_0.8fr_auto] dark:border-slate-800/80"
                  >
                    <div>
                      <label class="erp-label">Component product <span class="text-rose-500">*</span></label>
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
                      <label class="erp-label">Quantity <span class="text-rose-500">*</span></label>
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

              <section
                v-if="customFieldDefinitions.length"
                id="product-custom-fields"
                class="erp-form-section"
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

              <section class="erp-form-section">
                <div class="text-sm font-semibold text-slate-950 dark:text-white">Selling and stock behavior</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Decide how the product is sold, tracked, and monitored once it is live.
                </div>
                <div class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
                  <div class="space-y-4">
                  <div v-if="supportsInventorySetup(values.type)" class="space-y-3">
                    <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values.track_inventory)"
                        @change="handleTrackInventoryChange(values, setFieldValue, $event.target.checked)"
                      />
                      <span>Track inventory</span>
                    </label>
                  </div>
                  <template v-if="supportsInventorySetup(values.type)">
                  <div v-if="values.track_inventory">
                    <label class="erp-label" for="stock_tracking">Stock tracking</label>
                    <AppSelect
                      :model-value="values.stock_tracking || null"
                      :options="stockTrackingFormOptions"
                      placeholder="Select stock mode"
                      @update:model-value="setFieldValue('stock_tracking', $event || 'none')"
                    />
                    <ErrorMessage name="stock_tracking" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>
                  <div
                    v-else
                    class="rounded-[5px] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300"
                  >
                    Turn on <span class="font-medium">Track inventory</span> to configure stock mode, rack location, and stock alerts.
                  </div>
                  <div v-if="values.track_inventory">
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
                  <div v-if="values.track_inventory" class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <label class="erp-label" for="alert_quantity">Alert quantity</label>
                      <Field id="alert_quantity" name="alert_quantity" type="number" min="0" step="0.001" class="erp-input" />
                    </div>
                    <div>
                      <label class="erp-label" for="max_stock_level">Max stock level</label>
                      <Field id="max_stock_level" name="max_stock_level" type="number" min="0" step="0.001" class="erp-input" />
                    </div>
                  </div>
                  </template>
                  <div
                    v-else
                    class="rounded-[5px] border border-cyan-200/70 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/25 dark:text-cyan-200"
                  >
                    <template v-if="values.type === 'combo'">
                      Combo products do not track their own stock. Inventory is controlled by their component products.
                    </template>
                    <template v-else>
                      Services do not use stock tracking, expiry, or rack location controls.
                    </template>
                  </div>
                  </div>
                  <div class="space-y-3">
                    <label v-if="supportsInventorySetup(values.type) && values.track_inventory" class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        :checked="Boolean(values.has_expiry)"
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
                <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" class="erp-button-secondary justify-center sm:min-w-[10rem]" :disabled="store.saving" @click="goBack">
                    Cancel
                  </button>
                  <button type="submit" class="erp-button-primary justify-center sm:min-w-[12rem]" :disabled="store.saving || store.optionsLoading">
                    <span
                      v-if="store.saving"
                      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
                    ></span>
                    {{ isEditMode ? 'Save product' : 'Create product' }}
                  </button>
                </div>
              </section>
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
import RichTextEditor from '@components/ui/RichTextEditor.vue'
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
    ? 'Update product details, pricing rules, variations, combos, and conversion factors.'
    : 'Create a new product with the right pricing, stock behavior, and conversion factors.'
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
  }))
}

const findSubUnit = (unitId, subUnitId) => {
  if (!unitId || !subUnitId) {
    return null
  }

  const unit = (store.formOptions.units || []).find((item) => item.id === unitId)

  return (unit?.sub_units || []).find((subUnit) => subUnit.id === subUnitId) || null
}

const factorFromSubUnit = (unitId, subUnitId) => {
  const subUnit = findSubUnit(unitId, subUnitId)

  if (!subUnit?.conversion_factor) {
    return '1.0000'
  }

  return Number(subUnit.conversion_factor).toFixed(4)
}

const selectedTaxRate = (taxRateId) =>
  (store.formOptions.tax_rates || []).find((taxRate) => taxRate.id === taxRateId) || null

const isBlankPrice = (value) => value === '' || value === null || value === undefined

const derivedSubSellPrice = (baseSellPrice, unitId, subUnitId) => {
  if (isBlankPrice(baseSellPrice) || !subUnitId) {
    return ''
  }

  const factor = Number(factorFromSubUnit(unitId, subUnitId) || 1)
  const base = Number(baseSellPrice || 0)
  const derived = base * factor

  return Number.isFinite(derived) ? derived.toFixed(2) : ''
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
    barcode_type: current?.barcode_type ?? 'C128',
    use_sub_unit: current?.type === 'variable'
      ? (current?.variations || []).some((variation) => Boolean(variation.sub_unit_id))
      : Boolean(current?.sub_unit_id),
    sub_unit_id: current?.sub_unit_id ?? '',
    type: current?.type ?? 'single',
    stock_tracking: current?.stock_tracking ?? 'none',
    has_expiry: current?.has_expiry ?? false,
    selling_price: current?.type === 'variable' ? '' : (current?.selling_price ?? '0.00'),
    purchase_price: current?.type === 'variable' ? '' : (current?.purchase_price ?? '0.00'),
    sub_unit_selling_price: current?.type === 'variable' ? '' : (current?.sub_unit_selling_price ?? ''),
    sub_unit_purchase_price: current?.type === 'variable' ? '' : (current?.sub_unit_purchase_price ?? ''),
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
    image_file: null,
    image_preview_url: current?.image_url ?? '',
    variations: (current?.variations || []).map((variation) => ({
      id: variation.id,
      name: variation.name,
      variation_value_ids: variation.variation_value_ids || [],
      sku: variation.sku,
      image_url: variation.image_url ?? '',
      image_file: null,
      image_preview_url: variation.image_url ?? '',
      sub_unit_id: variation.sub_unit_id ?? '',
      selling_price: variation.selling_price ?? '',
      purchase_price: variation.purchase_price ?? '',
      sub_unit_selling_price: variation.sub_unit_selling_price ?? '',
      sub_unit_purchase_price: variation.sub_unit_purchase_price ?? '',
      minimum_selling_price: variation.minimum_selling_price ?? '',
      is_active: variation.is_active !== false,
    })),
    combo_items: (current?.combo_items || []).map((comboItem) => ({
      id: comboItem.id,
      child_product_id: comboItem.child_product_id,
      child_variation_id: comboItem.child_variation_id ?? '',
      quantity: comboItem.quantity ?? '1.0000',
    })),
    ...customFieldValues,
  }
})

const schema = yup.object({
  name: yup.string().required().max(150),
  sku: yup.string().nullable().max(100),
  type: yup.string().required().oneOf(['single', 'variable', 'service', 'combo']),
  barcode_type: yup.string().required().oneOf(['C128', 'EAN13', 'QR']),
  unit_id: yup.string().nullable().when('type', {
    is: (type) => type !== 'service',
    then: (baseSchema) => baseSchema.required('Base unit is required.'),
    otherwise: (baseSchema) => baseSchema.nullable(),
  }),
  stock_tracking: yup.string().required().oneOf(['none', 'lot', 'serial']),
  profit_margin: yup.number().nullable().min(0).max(999999.99)
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
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

const formatType = (type) => ({
  single: 'Single',
  variable: 'Variable',
  service: 'Service',
  combo: 'Combo',
}[type] || type)

const supportsUnits = (type) => type !== 'service'
const supportsInventorySetup = (type) => !['service', 'combo'].includes(type)

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
      image_url: existing?.image_url ?? '',
      image_file: null,
      image_preview_url: existing?.image_url ?? '',
      sub_unit_id: existing?.sub_unit_id ?? '',
      selling_price: existing?.selling_price ?? '0.00',
      purchase_price: existing?.purchase_price ?? '0.00',
      sub_unit_selling_price: existing?.sub_unit_selling_price ?? '',
      sub_unit_purchase_price: existing?.sub_unit_purchase_price ?? '',
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

const removeVariation = (values, setFieldValue, index) => {
  setFieldValue('variations', (values.variations || []).filter((_, itemIndex) => itemIndex !== index))
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

const toPreviewUrl = (file) => {
  if (!(file instanceof File)) {
    return ''
  }

  return URL.createObjectURL(file)
}

const handleProductImageChange = (setFieldValue, event) => {
  const file = event.target.files?.[0] ?? null
  setFieldValue('image_file', file)
  setFieldValue('image_preview_url', file ? toPreviewUrl(file) : '')
}

const handleVariationImageChange = (values, setFieldValue, index, event) => {
  const file = event.target.files?.[0] ?? null
  const nextVariations = [...(values.variations || [])]
  const currentVariation = nextVariations[index]

  if (!currentVariation) {
    return
  }

  nextVariations[index] = {
    ...currentVariation,
    image_file: file,
    image_preview_url: file ? toPreviewUrl(file) : '',
  }

  setFieldValue('variations', nextVariations)
}

const handleUnitChange = (values, setFieldValue, unitId) => {
  setFieldValue('unit_id', unitId || '')

  const validSubUnits = new Set(subUnitOptions(unitId).map((option) => option.value))

  if (!validSubUnits.has(values.sub_unit_id)) {
    setFieldValue('sub_unit_id', '')
  }

  if (!validSubUnits.has(values.sub_unit_id)) {
    setFieldValue('sub_unit_id', '')
    setFieldValue('sub_unit_selling_price', '')
    setFieldValue('sub_unit_purchase_price', '')
  }

  const nextVariations = (values.variations || []).map((variation) => {
    if (validSubUnits.has(variation.sub_unit_id)) {
      return variation
    }

    return {
      ...variation,
      sub_unit_id: '',
      sub_unit_selling_price: '',
      sub_unit_purchase_price: '',
    }
  })

  setFieldValue('variations', nextVariations)
}

const handleUseSubUnitToggle = (values, setFieldValue, checked) => {
  setFieldValue('use_sub_unit', checked)

  if (checked) {
    return
  }

  setFieldValue('sub_unit_id', '')
  setFieldValue('sub_unit_selling_price', '')
  setFieldValue('sub_unit_purchase_price', '')

  const nextVariations = (values.variations || []).map((variation) => ({
    ...variation,
    sub_unit_id: '',
    sub_unit_selling_price: '',
    sub_unit_purchase_price: '',
  }))

  setFieldValue('variations', nextVariations)
}

const handleProductConversionUnitChange = (values, setFieldValue, subUnitId) => {
  setFieldValue('sub_unit_id', subUnitId || '')

  if (!subUnitId) {
    setFieldValue('sub_unit_selling_price', '')
    setFieldValue('sub_unit_purchase_price', '')
    return
  }

  if (isBlankPrice(values.sub_unit_selling_price)) {
    setFieldValue(
      'sub_unit_selling_price',
      derivedSubSellPrice(values.selling_price, values.unit_id, subUnitId)
    )
  }
}

const handleVariationConversionUnitChange = (values, setFieldValue, index, subUnitId) => {
  const nextVariations = [...(values.variations || [])]
  const currentVariation = nextVariations[index]

  if (!currentVariation) {
    return
  }

  nextVariations[index] = {
    ...currentVariation,
    sub_unit_id: subUnitId || '',
    sub_unit_selling_price: subUnitId
      ? (isBlankPrice(currentVariation.sub_unit_selling_price)
        ? derivedSubSellPrice(currentVariation.selling_price, values.unit_id, subUnitId)
        : currentVariation.sub_unit_selling_price)
      : '',
    sub_unit_purchase_price: subUnitId ? currentVariation.sub_unit_purchase_price : '',
  }

  setFieldValue('variations', nextVariations)
}

const handleBaseSellingPriceInput = (values, setFieldValue, event) => {
  if (!values.use_sub_unit || !values.sub_unit_id || !isBlankPrice(values.sub_unit_selling_price)) {
    return
  }

  setFieldValue(
    'sub_unit_selling_price',
    derivedSubSellPrice(
      event?.target?.value ?? values.selling_price,
      values.unit_id,
      values.sub_unit_id
    )
  )
}

const handleVariationSellingPriceInput = (values, setFieldValue, index, event) => {
  const currentVariation = values.variations?.[index]

  if (!currentVariation || !currentVariation.sub_unit_id || !isBlankPrice(currentVariation.sub_unit_selling_price)) {
    return
  }

  setFieldValue(
    `variations[${index}].sub_unit_selling_price`,
    derivedSubSellPrice(
      event?.target?.value ?? currentVariation.selling_price,
      values.unit_id,
      currentVariation.sub_unit_id
    )
  )
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
    barcode_type: values.barcode_type || 'C128',
    sub_unit_id: values.type === 'single' ? (values.sub_unit_id || null) : null,
    type: values.type,
    stock_tracking: values.track_inventory ? values.stock_tracking : 'none',
    has_expiry: Boolean(values.has_expiry),
    selling_price: values.type === 'variable' ? null : (values.selling_price || 0),
    purchase_price: values.type === 'variable' ? null : (values.purchase_price || 0),
    sub_unit_selling_price: values.type === 'single' && values.sub_unit_id ? (values.sub_unit_selling_price || null) : null,
    sub_unit_purchase_price: values.type === 'single' && values.sub_unit_id ? (values.sub_unit_purchase_price || null) : null,
    minimum_selling_price: values.type === 'variable' ? null : (values.minimum_selling_price || null),
    profit_margin: values.profit_margin || null,
    tax_type: values.tax_type,
    track_inventory: Boolean(values.track_inventory),
    alert_quantity: values.alert_quantity || null,
    max_stock_level: values.max_stock_level || null,
    is_for_selling: Boolean(values.is_for_selling),
    is_active: Boolean(values.is_active),
    weight: values.weight || null,
    image_file: values.image_file || null,
    custom_fields: customFields,
    variations: values.type === 'variable'
      ? (values.variations || []).map((variation) => ({
          id: variation.id || null,
          name: variation.name,
          variation_value_ids: variation.variation_value_ids || [],
          sku: variation.sku,
          image_file: variation.image_file || null,
          sub_unit_id: variation.sub_unit_id || null,
          selling_price: variation.selling_price || 0,
          purchase_price: variation.purchase_price || 0,
          sub_unit_selling_price: variation.sub_unit_id ? (variation.sub_unit_selling_price || null) : null,
          sub_unit_purchase_price: variation.sub_unit_id ? (variation.sub_unit_purchase_price || null) : null,
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
