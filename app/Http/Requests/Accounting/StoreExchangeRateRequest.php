<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'from_currency' => ['required', 'string', 'size:3', Rule::in(['USD'])],
            'to_currency' => ['required', 'string', 'size:3', Rule::in(['KHR'])],
            'rate' => ['required', 'numeric', 'gt:0', 'max:999999999'],
            'effective_date' => ['required', 'date'],
            'is_default' => ['sometimes', 'boolean'],
            'note' => ['nullable', 'string'],
        ];
    }
}
