<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $warehouseId = $this->route('warehouse')?->id ?? $this->route('warehouse');

        return [
            'branch_id' => ['nullable', 'uuid', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('warehouses', 'code')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($warehouseId),
            ],
            'type' => ['nullable', 'in:main,transit,returns,damaged'],
            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'allow_negative_stock' => ['nullable', 'boolean'],
        ];
    }
}
