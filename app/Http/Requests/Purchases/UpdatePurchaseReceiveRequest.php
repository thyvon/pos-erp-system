<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseReceiveRequest extends FormRequest
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
            'items.*.id' => ['required', 'uuid', Rule::exists('purchase_receive_items', 'id')],
            'items.*.quantity' => ['required', 'numeric', 'gte:0'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }
}
