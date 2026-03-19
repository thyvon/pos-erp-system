<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $branchId = $this->route('branch')?->id ?? $this->route('branch');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('branches', 'code')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($branchId),
            ],
            'type' => ['nullable', 'in:retail,warehouse,office,online'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'array'],
            'manager_id' => ['nullable', 'uuid', Rule::exists('users', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'business_hours' => ['nullable', 'array'],
            'invoice_settings' => ['nullable', 'array'],
        ];
    }
}
