<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;
        $type = $this->input('type');

        return array_merge(
            $this->baseRules($businessId),
            $this->typeRules($businessId, $type),
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Rules applied to every product type
    // ─────────────────────────────────────────────────────────────────
    private function baseRules(string $businessId): array
    {
        return [
            'name'           => ['required', 'string', 'max:150'],
            'description'    => ['nullable', 'string'],
            'type'           => ['required', Rule::in(['single', 'variable', 'service', 'combo'])],
            'barcode_type'   => ['required', Rule::in(['C128', 'EAN13', 'QR'])],
            'barcode'        => ['nullable', 'string', 'max:100'],
            'stock_tracking' => ['required', Rule::in(['none', 'lot', 'serial'])],
            'tax_type'       => ['required', Rule::in(['inclusive', 'exclusive'])],

            'sku' => [
                'nullable', 'string', 'max:100',
                Rule::unique('products', 'sku')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
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

            // Scalars
            'has_expiry'            => ['nullable', 'boolean'],
            'track_inventory'       => ['nullable', 'boolean'],
            'is_for_selling'        => ['nullable', 'boolean'],
            'is_active'             => ['nullable', 'boolean'],
            'alert_quantity'        => ['nullable', 'numeric', 'min:0', 'max:9999999999.999'],
            'max_stock_level'       => ['nullable', 'numeric', 'min:0', 'max:9999999999.999'],
            'minimum_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'profit_margin'         => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'weight'                => ['nullable', 'numeric', 'min:0', 'max:999999999.999'],
            'image_url'             => ['nullable', 'string', 'max:500'],
            'custom_fields'         => ['nullable', 'array'],

            // Packagings (optional on all types)
            'packagings'                     => ['nullable', 'array'],
            'packagings.*.name'              => ['required_with:packagings', 'string', 'max:100'],
            'packagings.*.short_name'        => ['nullable', 'string', 'max:50'],
            'packagings.*.conversion_factor' => ['required_with:packagings', 'numeric', 'gt:0', 'max:9999999999.9999'],
            'packagings.*.sku'               => ['nullable', 'string', 'max:100'],
            'packagings.*.barcode'           => ['nullable', 'string', 'max:100'],
            'packagings.*.selling_price'     => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'packagings.*.purchase_price'    => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'packagings.*.is_default'        => ['nullable', 'boolean'],
            'packagings.*.is_active'         => ['nullable', 'boolean'],
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
                'required', 'uuid',
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
            'selling_price'  => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    // ── variable ──────────────────────────────────────────────────────
    private function variableRules(string $businessId): array
    {
        return [
            'unit_id' => [
                'required', 'uuid',
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
            'variation_template_ids'   => ['required', 'array', 'min:1'],
            'variation_template_ids.*' => [
                'uuid',
                Rule::exists('variation_templates', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],

            'variations'                         => ['required', 'array', 'min:1'],
            'variations.*.name'                  => ['required', 'string', 'max:150'],
            'variations.*.variation_value_ids'   => ['required', 'array', 'min:1'],
            'variations.*.variation_value_ids.*' => [
                'uuid',
                Rule::exists('variation_values', 'id')->where(
                    fn ($q) => $q->where('business_id', $businessId)->whereNull('deleted_at')
                ),
            ],
            'variations.*.sku'                   => ['required', 'string', 'max:100'],
            'variations.*.barcode'               => ['nullable', 'string', 'max:100'],
            'variations.*.selling_price'         => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.purchase_price'        => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
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
            'selling_price'  => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    // ── combo ─────────────────────────────────────────────────────────
    private function comboRules(string $businessId): array
    {
        return [
            'unit_id' => [
                'required', 'uuid',
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
            'selling_price'  => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],

            'combo_items'                      => ['required', 'array', 'min:1'],
            'combo_items.*.child_product_id'   => [
                'required', 'uuid',
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
            'combo_items.*.quantity'           => ['required', 'numeric', 'gt:0', 'max:9999999999.9999'],
        ];
    }
}
