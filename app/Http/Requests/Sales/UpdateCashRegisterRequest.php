<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;

        return [
            'branch_id' => ['sometimes', 'uuid', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'name' => ['sometimes', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
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
