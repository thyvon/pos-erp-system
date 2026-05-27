<?php

namespace App\Http\Requests\Sales;

use Illuminate\Validation\Rule;

class UpdateSaleWithPaymentsRequest extends UpdateSaleRequest
{
    public function rules(): array
    {
        $businessId = $this->user()?->business_id;
        $paymentAccountRule = Rule::exists('payment_accounts', 'id')
            ->where(fn ($query) => $query->where('business_id', $businessId));
        $exchangeRateRule = Rule::exists('exchange_rates', 'id')
            ->where(fn ($query) => $query->where('business_id', $businessId));
        $paymentRule = Rule::exists('sale_payments', 'id')
            ->where(fn ($query) => $query->where('business_id', $businessId));
        $paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'];

        return [
            ...parent::rules(),
            'payment_corrections' => ['sometimes', 'array'],
            'payment_corrections.*.payment_id' => ['required_with:payment_corrections', 'uuid', $paymentRule],
            'payment_corrections.*.payment_account_id' => ['required_with:payment_corrections', 'uuid', $paymentAccountRule],
            'payment_corrections.*.amount' => ['required_with:payment_corrections', 'numeric', 'gt:0'],
            'payment_corrections.*.payment_currency' => ['nullable', Rule::in(['USD', 'KHR'])],
            'payment_corrections.*.payment_amount' => ['nullable', 'numeric', 'gt:0'],
            'payment_corrections.*.exchange_rate_id' => ['nullable', 'uuid', $exchangeRateRule],
            'payment_corrections.*.method' => ['required_with:payment_corrections', Rule::in($paymentMethods)],
            'payment_corrections.*.reference' => ['nullable', 'string', 'max:120'],
            'payment_corrections.*.payment_date' => ['required_with:payment_corrections', 'date'],
            'payment_corrections.*.note' => ['nullable', 'string'],
            'payment_corrections.*.reason' => ['required_with:payment_corrections', 'string', 'max:500'],
            'payment_deletions' => ['sometimes', 'array'],
            'payment_deletions.*.payment_id' => ['required_with:payment_deletions', 'uuid', $paymentRule],
            'payment_deletions.*.reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
