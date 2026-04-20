<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChartOfAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $accountId = $this->route('chartOfAccount')?->id;

        return [
            'parent_id' => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('chart_of_accounts', 'code')
                    ->ignore($accountId)
                    ->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense'])],
            'sub_type' => ['nullable', 'string', 'max:50'],
            'normal_balance' => ['sometimes', 'required', Rule::in(['debit', 'credit'])],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ];
    }
}
