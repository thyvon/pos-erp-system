<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockAdjustmentRequest extends FormRequest
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
            'reason' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.variation_id' => ['nullable', 'uuid', Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.lot_id' => ['nullable', 'uuid', Rule::exists('stock_lots', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.serial_id' => ['nullable', 'uuid', Rule::exists('stock_serials', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.direction' => ['required', 'in:in,out'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
