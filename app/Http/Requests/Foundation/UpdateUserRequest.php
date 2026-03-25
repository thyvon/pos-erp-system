<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
            'avatar_url' => ['nullable', 'url', 'max:500'],
            'status' => ['sometimes', 'required', 'in:active,inactive,suspended'],
            'max_discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sales_target_amount' => ['nullable', 'numeric', 'min:0'],
            'preferences' => ['nullable', 'array'],
            'role' => ['nullable', 'string', 'exists:roles,name', Rule::notIn(['super_admin'])],
            'direct_permissions' => ['nullable', 'array'],
            'direct_permissions.*' => ['string', 'exists:permissions,name'],
            'branch_ids' => ['sometimes', 'array'],
            'branch_ids.*' => ['string', 'distinct', 'exists:branches,id'],
            'default_branch_id' => ['nullable', 'string', 'exists:branches,id'],
        ];
    }
}
