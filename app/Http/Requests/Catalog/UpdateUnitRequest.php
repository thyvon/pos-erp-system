<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;
        $unitId = (string) $this->route('unit')?->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('units', 'name')
                    ->ignore($unitId)
                    ->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'short_name' => ['sometimes', 'required', 'string', 'max:50'],
            'allow_decimal' => ['sometimes', 'required', 'boolean'],
            'sub_units' => ['sometimes', 'array'],
            'sub_units.*.id' => ['nullable', 'uuid'],
            'sub_units.*.name' => ['required', 'string', 'max:150'],
            'sub_units.*.short_name' => ['required', 'string', 'max:50'],
            'sub_units.*.conversion_factor' => ['required', 'numeric', 'gt:0'],
        ];
    }
}
