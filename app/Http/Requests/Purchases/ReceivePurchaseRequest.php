<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReceivePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'received_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id' => ['required', 'uuid', Rule::exists('purchase_items', 'id')],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.lot_number' => ['nullable', 'string', 'max:100'],
            'items.*.manufacture_date' => ['nullable', 'date'],
            'items.*.expiry_date' => ['nullable', 'date', 'after_or_equal:manufacture_date'],
            'items.*.serial_numbers' => ['nullable', 'array'],
            'items.*.serial_numbers.*' => ['required', 'string', 'max:200', 'distinct'],
            'items.*.warranty_expires' => ['nullable', 'date'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
