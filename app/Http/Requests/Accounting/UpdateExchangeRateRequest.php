<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'from_currency' => ['sometimes', 'string', 'size:3', Rule::in(['USD'])],
            'to_currency' => ['sometimes', 'string', 'size:3', Rule::in(['KHR'])],
            'rate' => ['sometimes', 'numeric', 'gt:0', 'max:999999999'],
            'effective_date' => ['sometimes', 'date'],
            'is_default' => ['sometimes', 'boolean'],
            'note' => ['nullable', 'string'],
        ];
    }
}
