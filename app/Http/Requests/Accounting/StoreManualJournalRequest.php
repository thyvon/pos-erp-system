<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualJournalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'fiscal_year_id' => ['nullable', 'uuid', 'exists:fiscal_years,id'],
            'description' => ['required', 'string', 'max:500'],
            'posted_at' => ['nullable', 'date'],
            'entries' => ['required', 'array', 'min:2'],
            'entries.*.account_id' => ['required', 'uuid', 'exists:chart_of_accounts,id'],
            'entries.*.type' => ['required', Rule::in(['debit', 'credit'])],
            'entries.*.amount' => ['required', 'numeric', 'min:0.01'],
            'entries.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
