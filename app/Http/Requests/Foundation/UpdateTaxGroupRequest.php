<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaxGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $taxGroup = $this->route('taxGroup');
        $taxGroupId = $taxGroup?->id ?? $this->route('taxGroup');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('tax_groups', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($taxGroupId),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'tax_rate_ids' => ['sometimes', 'required', 'array', 'min:1'],
            'tax_rate_ids.*' => [
                'required',
                'uuid',
                'distinct',
                Rule::exists('tax_rates', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
        ];
    }
}
