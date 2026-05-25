<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSalePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;
        $paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'];

        return [
            'payment_account_id' => [
                'required',
                'uuid',
                Rule::exists('payment_accounts', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_currency' => ['nullable', Rule::in(['USD', 'KHR'])],
            'payment_amount' => ['nullable', 'numeric', 'gt:0'],
            'exchange_rate_id' => [
                'nullable',
                'uuid',
                Rule::exists('exchange_rates', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'method' => ['required', Rule::in($paymentMethods)],
            'reference' => ['nullable', 'string', 'max:120'],
            'payment_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
