<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFiscalYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $fiscalYearId = $this->route('fiscalYear')?->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('fiscal_years', 'name')
                    ->ignore($fiscalYearId)
                    ->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date'],
            'status' => ['sometimes', 'required', Rule::in(['active', 'closed'])],
        ];
    }
}
