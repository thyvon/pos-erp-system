<?php

namespace App\Http\Requests\Catalog;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Product|null $product */
        $product    = $this->route('product');
        $businessId = (string) $this->user()?->business_id;

        // Fall back to the existing product type when 'type' is not being updated
        $type = $this->input('type', $product?->type);

        return array_merge(
            $this->baseRules($businessId, $product),
            $this->typeRules($businessId, $type),
        );
    }

    protected function prepareForValidation(): void
    {
        $this->merge($this->decodeJsonPayload());
    }

    // ─────────────────────────────────────────────────────────────────
    // Rules applied to every product type
    // ─────────────────────────────────────────────────────────────────
    private function baseRules(string $businessId, ?Product $product): array
    {
        return [
            // Core fields — 'sometimes' so partial PATCH payloads are allowed
            'name'           => ['sometimes', 'required', 'string', 'max:150'],
            'description'    => ['nullable', 'string'],
            'type'           => ['sometimes', 'required', Rule::in(['single', 'variable', 'service', 'combo'])],
            'barcode_type'   => ['sometimes', 'required', Rule::in(['C128', 'EAN13', 'QR'])],
            'stock_tracking' => ['sometimes', 'required', Rule::in(['none', 'lot', 'serial'])],
            'tax_type'       => ['sometimes', 'required', Rule::in(['inclusive', 'exclusive'])],

            // SKU must ignore the current product to allow saving without changing it
            'sku' => [
                'sometimes', 'nullable', 'string', 'max:100',
                Rule::unique('products', 'sku')
                    ->ignore($product?->id)
                    ->where(fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')),
            ],

            // Optional FK look-ups shared by all types
            'category_id' => [
                'nullable', 'uuid',
                Rule::exists('product_categories', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'brand_id' => [
                'nullable', 'uuid',
                Rule::exists('brands', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'tax_rate_id' => [
                'nullable', 'uuid',
                Rule::exists('tax_rates', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'price_group_id' => [
                'nullable', 'uuid',
                Rule::exists('price_groups', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'rack_location_id' => [
                'nullable', 'uuid',
                Rule::exists('rack_locations', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'conversion_sub_unit_id' => [
                'nullable', 'uuid',
                Rule::exists('sub_units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],

            // Scalars
            'has_expiry'            => ['nullable', 'boolean'],
            'track_inventory'       => ['nullable', 'boolean'],
            'is_for_selling'        => ['nullable', 'boolean'],
            'is_active'             => ['nullable', 'boolean'],
            'alert_quantity'        => ['nullable', 'numeric', 'min:0', 'max:9999999999.999'],
            'max_stock_level'       => ['nullable', 'numeric', 'min:0', 'max:9999999999.999'],
            'sub_unit_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'sub_unit_purchase_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'minimum_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'profit_margin'         => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'weight'                => ['nullable', 'numeric', 'min:0', 'max:999999999.999'],
            'image_file'            => ['nullable', 'file', 'image', 'max:5120'],
            'custom_fields'         => ['nullable', 'array'],

        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // Dispatch to the correct type-specific rule set
    // ─────────────────────────────────────────────────────────────────
    private function typeRules(string $businessId, ?string $type): array
    {
        return match ($type) {
            'single'   => $this->singleRules($businessId),
            'variable' => $this->variableRules($businessId),
            'service'  => $this->serviceRules($businessId),
            'combo'    => $this->comboRules($businessId),
            default    => [],
        };
    }

    // ── single ────────────────────────────────────────────────────────
    private function singleRules(string $businessId): array
    {
        return [
            'unit_id' => [
                'sometimes', 'required', 'uuid',
                Rule::exists('units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'sub_unit_id' => [
                'nullable', 'uuid',
                Rule::exists('sub_units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'selling_price'  => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    // ── variable ──────────────────────────────────────────────────────
    private function variableRules(string $businessId): array
    {
        return [
            'unit_id' => [
                'sometimes', 'required', 'uuid',
                Rule::exists('units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'sub_unit_id' => [
                'nullable', 'uuid',
                Rule::exists('sub_units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],

            // Prices live on each variation, not on the parent product
            'selling_price'  => ['prohibited'],
            'purchase_price' => ['prohibited'],

            'variation_template_id' => [
                'nullable', 'uuid',
                Rule::exists('variation_templates', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'variation_template_ids'   => ['sometimes', 'required', 'array', 'min:1'],
            'variation_template_ids.*' => [
                'uuid',
                Rule::exists('variation_templates', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],

            'variations'    => ['sometimes', 'required', 'array', 'min:1'],
            'variations.*.id' => [
                'nullable', 'uuid',
                Rule::exists('product_variations', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'variations.*.name'                  => ['required_with:variations', 'string', 'max:150'],
            'variations.*.variation_value_ids'   => ['required_with:variations', 'array', 'min:1'],
            'variations.*.variation_value_ids.*' => [
                'uuid',
                Rule::exists('variation_values', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'variations.*.sku'                   => ['nullable', 'string', 'max:100'],
            'variations.*.conversion_sub_unit_id' => [
                'nullable', 'uuid',
                Rule::exists('sub_units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'variation_image_files'              => ['nullable', 'array'],
            'variation_image_files.*'            => ['nullable', 'file', 'image', 'max:5120'],
            'variations.*.selling_price'         => ['required_with:variations', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.purchase_price'        => ['required_with:variations', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.sub_unit_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.sub_unit_purchase_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.minimum_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.is_active'             => ['nullable', 'boolean'],
        ];
    }

    // ── service ───────────────────────────────────────────────────────
    private function serviceRules(string $businessId): array
    {
        return [
            // unit_id is optional for services
            'unit_id' => [
                'nullable', 'uuid',
                Rule::exists('units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'selling_price'  => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    // ── combo ─────────────────────────────────────────────────────────
    private function comboRules(string $businessId): array
    {
        return [
            'unit_id' => [
                'sometimes', 'required', 'uuid',
                Rule::exists('units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'sub_unit_id' => [
                'nullable', 'uuid',
                Rule::exists('sub_units', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'selling_price'  => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999.99'],

            'combo_items'                      => ['sometimes', 'required', 'array', 'min:1'],
            'combo_items.*.id'                 => ['nullable', 'uuid'],
            'combo_items.*.child_product_id'   => [
                'required_with:combo_items', 'uuid',
                Rule::exists('products', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'combo_items.*.child_variation_id' => [
                'nullable', 'uuid',
                Rule::exists('product_variations', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'combo_items.*.quantity'           => ['required_with:combo_items', 'numeric', 'gt:0', 'max:9999999999.9999'],
        ];
    }

    protected function decodeJsonPayload(): array
    {
        $fields = ['variation_template_ids', 'variations', 'combo_items', 'custom_fields'];
        $decoded = [];

        foreach ($fields as $field) {
            $value = $this->input($field);

            if (! is_string($value) || trim($value) === '') {
                continue;
            }

            $json = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $decoded[$field] = $json;
            }
        }

        return $decoded;
    }
}
