<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $roleId = $this->route('role')?->id ?? $this->route('role');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:125', Rule::unique('roles', 'name')->ignore($roleId)->where('guard_name', 'web'), Rule::notIn(['super_admin'])],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
