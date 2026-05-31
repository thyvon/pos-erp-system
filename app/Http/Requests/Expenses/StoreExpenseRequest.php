<?php

namespace App\Http\Requests\Expenses;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;

        return [
            'branch_id' => ['required', 'uuid', Rule::exists('branches', 'id')->where(fn ($q) => $q->where('business_id', $businessId))],
            'expense_account_id' => ['required', 'uuid', Rule::exists('chart_of_accounts', 'id')->where(fn ($q) => $q->where('business_id', $businessId)->where('type', 'expense'))],
            'payment_account_id' => ['required', 'uuid', Rule::exists('payment_accounts', 'id')->where(fn ($q) => $q->where('business_id', $businessId))],
            'expense_date' => ['required', 'date'],
            'reference_no' => ['nullable', 'string', 'max:80'],
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['nullable', 'string', Rule::in(['cash', 'bank', 'card', 'other'])],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            $branchId = $this->input('branch_id');

            if ($user && $branchId && ! $user->hasBranchAccess($branchId)) {
                $validator->errors()->add('branch_id', 'The selected branch is outside your allowed branch access.');
            }
        });
    }
}
