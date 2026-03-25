<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePriceGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('price_groups', 'name')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'description' => ['nullable', 'string'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
