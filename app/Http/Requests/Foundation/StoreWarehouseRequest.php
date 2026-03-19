<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'branch_id' => ['nullable', 'uuid', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('warehouses', 'code')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'type' => ['nullable', 'in:main,transit,returns,damaged'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'allow_negative_stock' => ['nullable', 'boolean'],
        ];
    }
}
