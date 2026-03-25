<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVariationTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;
        $templateId = (string) $this->route('variationTemplate')?->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('variation_templates', 'name')
                    ->ignore($templateId)
                    ->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'values' => ['sometimes', 'array', 'min:1'],
            'values.*.id' => ['nullable', 'uuid'],
            'values.*.name' => ['required', 'string', 'max:150'],
            'values.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];
    }
}
