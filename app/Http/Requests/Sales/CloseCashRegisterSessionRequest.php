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
            'closing_float' => ['required', 'numeric', 'min:0'],
            'denominations_at_close' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
