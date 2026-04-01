<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'from_warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'to_warehouse_id' => ['required', 'uuid', 'different:from_warehouse_id', Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'send' => ['nullable', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.variation_id' => ['nullable', 'uuid', Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.lot_id' => ['nullable', 'uuid', Rule::exists('stock_lots', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.serial_id' => ['nullable', 'uuid', Rule::exists('stock_serials', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
