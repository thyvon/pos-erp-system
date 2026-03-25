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

        return [
            'category_id' => [
                'nullable',
                'uuid',
                Rule::exists('product_categories', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'brand_id' => [
                'nullable',
                'uuid',
                Rule::exists('brands', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'unit_id' => [
                Rule::requiredIf(fn () => $this->input('type') !== 'service'),
                'nullable',
                'uuid',
                Rule::exists('units', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'sub_unit_id' => [
                'nullable',
                'uuid',
                Rule::exists('sub_units', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'tax_rate_id' => [
                'nullable',
                'uuid',
                Rule::exists('tax_rates', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'rack_location_id' => [
                'nullable',
                'uuid',
                Rule::exists('rack_locations', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'variation_template_id' => [
                'nullable',
                'uuid',
                Rule::exists('variation_templates', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'variation_template_ids' => [
                Rule::requiredIf(fn () => $this->input('type') === 'variable'),
                'nullable',
                'array',
                'min:1',
            ],
            'variation_template_ids.*' => [
                'uuid',
                Rule::exists('variation_templates', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'price_group_id' => [
                'nullable',
                'uuid',
                Rule::exists('price_groups', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'barcode' => ['nullable', 'string', 'max:100'],
            'barcode_type' => ['required', Rule::in(['C128', 'EAN13', 'QR'])],
            'type' => ['required', Rule::in(['single', 'variable', 'service', 'combo'])],
            'stock_tracking' => ['required', Rule::in(['none', 'lot', 'serial'])],
            'has_expiry' => ['nullable', 'boolean'],
            'selling_price' => [Rule::requiredIf(fn () => $this->input('type') !== 'variable'), 'nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'purchase_price' => [Rule::requiredIf(fn () => $this->input('type') !== 'variable'), 'nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'minimum_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'profit_margin' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'tax_type' => ['required', Rule::in(['inclusive', 'exclusive'])],
            'track_inventory' => ['nullable', 'boolean'],
            'alert_quantity' => ['nullable', 'numeric', 'min:0', 'max:9999999999.999'],
            'max_stock_level' => ['nullable', 'numeric', 'min:0', 'max:9999999999.999'],
            'is_for_selling' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:999999999.999'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'custom_fields' => ['nullable', 'array'],
            'variations' => [Rule::requiredIf(fn () => $this->input('type') === 'variable'), 'nullable', 'array', 'min:1'],
            'variations.*.name' => ['required_with:variations', 'string', 'max:150'],
            'variations.*.variation_value_ids' => ['required_with:variations', 'array', 'min:1'],
            'variations.*.variation_value_ids.*' => [
                'uuid',
                Rule::exists('variation_values', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'variations.*.sku' => ['required_with:variations', 'string', 'max:100'],
            'variations.*.barcode' => ['nullable', 'string', 'max:100'],
            'variations.*.selling_price' => ['required_with:variations', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.purchase_price' => ['required_with:variations', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.minimum_selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'variations.*.is_active' => ['nullable', 'boolean'],
            'combo_items' => [Rule::requiredIf(fn () => $this->input('type') === 'combo'), 'nullable', 'array', 'min:1'],
            'combo_items.*.child_product_id' => [
                'required_with:combo_items',
                'uuid',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'combo_items.*.child_variation_id' => [
                'nullable',
                'uuid',
                Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'combo_items.*.quantity' => ['required_with:combo_items', 'numeric', 'gt:0', 'max:9999999999.9999'],
            'packagings' => ['nullable', 'array'],
            'packagings.*.name' => ['required_with:packagings', 'string', 'max:100'],
            'packagings.*.short_name' => ['nullable', 'string', 'max:50'],
            'packagings.*.conversion_factor' => ['required_with:packagings', 'numeric', 'gt:0', 'max:9999999999.9999'],
            'packagings.*.sku' => ['nullable', 'string', 'max:100'],
            'packagings.*.barcode' => ['nullable', 'string', 'max:100'],
            'packagings.*.selling_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'packagings.*.purchase_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'packagings.*.is_default' => ['nullable', 'boolean'],
            'packagings.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}
