<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;

        return [
            'branch_id' => ['required', 'uuid', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'name' => ['required', 'string', 'max:120'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            $branchId = $this->input('branch_id');

            if ($user && $branchId && ! $user->hasRole(['admin', 'super_admin']) && ! $user->hasBranchAccess($branchId)) {
                $validator->errors()->add('branch_id', 'The selected branch is outside your allowed branch access.');
            }
        });
    }
}
