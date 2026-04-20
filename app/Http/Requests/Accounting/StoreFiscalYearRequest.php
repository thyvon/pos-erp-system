<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFiscalYearRequest extends FormRequest
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
                'max:100',
                Rule::unique('fiscal_years', 'name')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['required', Rule::in(['active', 'closed'])],
        ];
    }
}
