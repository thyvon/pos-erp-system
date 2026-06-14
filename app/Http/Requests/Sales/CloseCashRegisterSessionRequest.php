<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class CloseCashRegisterSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'closing_float' => ['nullable', 'required_without:closing_cash_usd', 'numeric', 'min:0'],
            'closing_cash_usd' => ['nullable', 'required_without:closing_float', 'numeric', 'min:0'],
            'closing_cash_khr' => ['nullable', 'numeric', 'min:0'],
            'denominations_at_close' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
