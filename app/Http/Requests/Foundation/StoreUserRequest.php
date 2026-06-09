<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
            'avatar_url' => ['nullable', 'url', 'max:500'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'max_discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sales_target_amount' => ['nullable', 'numeric', 'min:0'],
            'preferences' => ['nullable', 'array'],
            'role' => ['required_without:roles', 'nullable', 'string', 'exists:roles,name', Rule::notIn(['super_admin'])],
            'roles' => ['required_without:role', 'nullable', 'array', 'min:1'],
            'roles.*' => ['string', 'distinct', 'exists:roles,name', Rule::notIn(['super_admin'])],
            'direct_permissions' => ['nullable', 'array'],
            'direct_permissions.*' => ['string', 'exists:permissions,name'],
            'branch_ids' => ['nullable', 'array'],
            'branch_ids.*' => ['string', 'distinct', 'exists:branches,id'],
            'default_branch_id' => ['nullable', 'string', 'exists:branches,id'],
            'warehouse_ids' => ['nullable', 'array'],
            'warehouse_ids.*' => ['string', 'distinct', 'exists:warehouses,id'],
        ];
    }
}
