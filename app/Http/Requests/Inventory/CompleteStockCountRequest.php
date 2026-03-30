<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class CompleteStockCountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'items' => ['nullable', 'array'],
            'items.*.id' => ['required_with:items', 'uuid'],
            'items.*.counted_quantity' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
