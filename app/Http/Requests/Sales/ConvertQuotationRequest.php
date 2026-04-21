<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConvertQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['invoice', 'draft', 'pos_sale', 'suspended'])],
            'sale_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:sale_date'],
            'cash_register_session_id' => ['nullable', 'uuid', Rule::exists('cash_register_sessions', 'id')],
            'notes' => ['nullable', 'string'],
            'staff_note' => ['nullable', 'string'],
        ];
    }
}
