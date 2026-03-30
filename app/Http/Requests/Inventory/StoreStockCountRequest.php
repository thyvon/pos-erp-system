<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockCountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['required_with:items', 'uuid', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.variation_id' => ['nullable', 'uuid', Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
