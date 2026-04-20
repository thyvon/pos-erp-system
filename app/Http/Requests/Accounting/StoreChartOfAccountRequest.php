<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChartOfAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'parent_id' => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('chart_of_accounts', 'code')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense'])],
            'sub_type' => ['nullable', 'string', 'max:50'],
            'normal_balance' => ['required', Rule::in(['debit', 'credit'])],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ];
    }
}
