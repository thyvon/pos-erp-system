<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'parent_id' => ['nullable', 'uuid'],
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('product_categories', 'name')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'code' => ['nullable', 'string', 'max:50'],
            'short_code' => ['nullable', 'string', 'max:10'],
            'image_url' => ['nullable', 'url', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
