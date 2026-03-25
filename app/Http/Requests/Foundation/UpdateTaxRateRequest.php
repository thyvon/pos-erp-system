<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaxRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $taxRate = $this->route('taxRate');
        $taxRateId = $taxRate?->id ?? $this->route('taxRate');
        $type = $this->input('type', $taxRate?->type);

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('tax_rates', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($taxRateId),
            ],
            'rate' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
                function (string $attribute, mixed $value, \Closure $fail) use ($type): void {
                    if ($type === 'percentage' && (float) $value > 100) {
                        $fail('Percentage tax rate cannot exceed 100.');
                    }
                },
            ],
            'type' => ['sometimes', 'required', Rule::in(['percentage', 'fixed'])],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
