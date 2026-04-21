<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSalePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;

        return [
            'payment_account_id' => ['required', 'uuid', Rule::exists('payment_accounts', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', Rule::in(['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'])],
            'reference' => ['nullable', 'string', 'max:120'],
            'payment_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
        ];
    }
}
