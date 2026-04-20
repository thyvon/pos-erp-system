<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('payment_accounts', 'name')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'account_type' => ['required', Rule::in(['cash', 'bank', 'other'])],
            'account_number' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            'coa_account_id' => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
            'is_active' => ['nullable', 'boolean'],
            'note' => ['nullable', 'string'],
        ];
    }
}
