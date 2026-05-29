<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchasePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;
        $paymentAccountRule = Rule::exists('payment_accounts', 'id')
            ->where(fn ($query) => $query->where('business_id', $businessId));
        $paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'];

        return [
            'payment_account_id' => ['required_without:payments', 'nullable', 'uuid', $paymentAccountRule],
            'amount' => ['required_without:payments', 'nullable', 'numeric', 'gt:0'],
            'payment_currency' => ['nullable', Rule::in(['USD', 'KHR'])],
            'payment_amount' => ['nullable', 'numeric', 'gt:0'],
            'exchange_rate_id' => [
                'nullable',
                'uuid',
                Rule::exists('exchange_rates', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'method' => ['required_without:payments', 'nullable', Rule::in($paymentMethods)],
            'reference' => ['nullable', 'string', 'max:120'],
            'payment_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'payments' => ['sometimes', 'array', 'min:1'],
            'payments.*.payment_account_id' => ['required_with:payments', 'uuid', $paymentAccountRule],
            'payments.*.amount' => ['nullable', 'numeric', 'gt:0'],
            'payments.*.payment_currency' => ['nullable', Rule::in(['USD', 'KHR'])],
            'payments.*.payment_amount' => ['nullable', 'numeric', 'gt:0'],
            'payments.*.exchange_rate_id' => [
                'nullable',
                'uuid',
                Rule::exists('exchange_rates', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'payments.*.method' => ['required_with:payments', Rule::in($paymentMethods)],
            'payments.*.reference' => ['nullable', 'string', 'max:120'],
            'payments.*.payment_date' => ['nullable', 'date'],
            'payments.*.note' => ['nullable', 'string'],
        ];
    }
}
