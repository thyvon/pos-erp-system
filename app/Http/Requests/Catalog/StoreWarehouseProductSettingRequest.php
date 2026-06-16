<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseProductSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;

        return [
            'warehouse_id' => [
                'required',
                'uuid',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'product_id' => [
                'required',
                'uuid',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'variation_id' => [
                'nullable',
                'uuid',
                Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'rack_location_id' => [
                'nullable',
                'uuid',
                Rule::exists('rack_locations', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'preferred_supplier_id' => [
                'nullable',
                'uuid',
                Rule::exists('suppliers', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'min_stock_alert' => ['nullable', 'numeric', 'min:0'],
            'max_stock_level' => ['nullable', 'numeric', 'min:0'],
            'reorder_point' => ['nullable', 'numeric', 'min:0'],
            'reorder_quantity' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            $warehouseId = $this->input('warehouse_id');

            if ($user && $warehouseId && ! $user->hasWarehouseAccess($warehouseId)) {
                $validator->errors()->add('warehouse_id', 'The selected warehouse is outside your allowed warehouse access.');
            }
        });
    }
}
