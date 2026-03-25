<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaxRateRequest extends FormRequest
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
                Rule::unique('tax_rates', 'name')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'rate' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($this->input('type') === 'percentage' && (float) $value > 100) {
                        $fail('Percentage tax rate cannot exceed 100.');
                    }
                },
            ],
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
