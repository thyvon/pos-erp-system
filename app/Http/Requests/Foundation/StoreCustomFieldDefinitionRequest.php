<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomFieldDefinitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'module' => ['required', Rule::in(['product', 'customer', 'supplier'])],
            'field_name' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z][a-z0-9_]*$/',
                Rule::unique('custom_field_definitions', 'field_name')
                    ->where(fn ($query) => $query
                        ->where('business_id', $businessId)
                        ->where('module', $this->input('module'))),
            ],
            'field_label' => ['required', 'string', 'max:150'],
            'field_type' => ['required', Rule::in(['text', 'number', 'date', 'select', 'checkbox'])],
            'options' => ['nullable', 'array'],
            'options.*' => ['nullable', 'string', 'max:150'],
            'is_required' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ];
    }
}
