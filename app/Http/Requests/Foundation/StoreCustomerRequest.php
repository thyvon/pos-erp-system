<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'customer_group_id' => ['nullable', 'uuid', Rule::exists('customer_groups', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'name' => ['required', 'string', 'max:191'],
            'type' => ['required', Rule::in(['individual', 'company'])],
            'email' => ['nullable', 'email', 'max:191'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'tax_id' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'array'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'pay_term' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'opening_balance' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string'],
            'custom_fields' => ['nullable', 'array'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
