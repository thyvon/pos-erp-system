<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'legal_name' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255', Rule::unique('businesses', 'email')],
            'phone' => ['nullable', 'string', 'max:20'],
            'currency' => ['required', 'string', 'size:3'],
            'timezone' => ['required', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'size:2'],
            'locale' => ['nullable', 'string', 'max:10'],
            'logo_url' => ['nullable', 'url', 'max:500'],
            'tier' => ['required', 'in:basic,standard,enterprise'],
            'status' => ['required', 'in:active,suspended,cancelled'],
            'max_users' => ['required', 'integer', 'min:1'],
            'max_branches' => ['required', 'integer', 'min:1'],
            'address' => ['nullable', 'array'],
            'address.line1' => ['nullable', 'string', 'max:255'],
            'address.line2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['nullable', 'string', 'max:100'],
            'address.state' => ['nullable', 'string', 'max:100'],
            'address.postal_code' => ['nullable', 'string', 'max:30'],
            'address.country' => ['nullable', 'string', 'max:2'],
            'financial_year' => ['nullable', 'array'],
            'financial_year.start_month' => ['nullable', 'integer', 'between:1,12'],
            'financial_year.start_day' => ['nullable', 'integer', 'between:1,31'],
            'owner' => ['required', 'array'],
            'owner.first_name' => ['required', 'string', 'max:100'],
            'owner.last_name' => ['nullable', 'string', 'max:100'],
            'owner.email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'owner.phone' => ['nullable', 'string', 'max:20'],
            'owner.password' => ['required', 'string', 'min:8'],
        ];
    }
}
