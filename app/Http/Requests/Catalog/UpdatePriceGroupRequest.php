<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePriceGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $priceGroup = $this->route('priceGroup');
        $priceGroupId = $priceGroup?->id ?? $this->route('priceGroup');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('price_groups', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($priceGroupId),
            ],
            'description' => ['nullable', 'string'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
