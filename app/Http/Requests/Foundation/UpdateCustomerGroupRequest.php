<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;
        $customerGroup = $this->route('customerGroup');
        $customerGroupId = $customerGroup?->id ?? $this->route('customerGroup');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('customer_groups', 'name')
                    ->where(fn ($query) => $query->where('business_id', $businessId))
                    ->ignore($customerGroupId),
            ],
            'discount' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'price_group_id' => ['nullable', 'uuid'],
        ];
    }
}
