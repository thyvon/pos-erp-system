<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomFieldDefinitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $definition = $this->route('custom_field_definition');
        $definitionId = $definition?->id ?? $this->route('custom_field_definition');
        $module = $this->input('module', $definition?->module);

        return [
            'module' => ['sometimes', 'required', Rule::in(['product', 'customer', 'supplier'])],
            'field_name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'regex:/^[a-z][a-z0-9_]*$/',
                Rule::unique('custom_field_definitions', 'field_name')
                    ->where(fn ($query) => $query
                        ->where('business_id', $businessId)
                        ->where('module', $module))
                    ->ignore($definitionId),
            ],
            'field_label' => ['sometimes', 'required', 'string', 'max:150'],
            'field_type' => ['sometimes', 'required', Rule::in(['text', 'number', 'date', 'select', 'checkbox'])],
            'options' => ['nullable', 'array'],
            'options.*' => ['nullable', 'string', 'max:150'],
            'is_required' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ];
    }
}
