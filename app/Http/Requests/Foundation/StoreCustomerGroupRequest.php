<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerGroupRequest extends FormRequest
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
                Rule::unique('customer_groups', 'name')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'discount' => ['required', 'numeric', 'min:0', 'max:100'],
            'price_group_id' => ['nullable', 'uuid'],
        ];
    }
}
