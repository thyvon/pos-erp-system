<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVariationTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;

        return [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('variation_templates', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'values' => ['required', 'array', 'min:1'],
            'values.*.name' => ['required', 'string', 'max:150'],
            'values.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
