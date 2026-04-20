<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class TransferPaymentAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'from_payment_account_id' => ['required', 'uuid', 'exists:payment_accounts,id'],
            'to_payment_account_id' => ['required', 'uuid', 'exists:payment_accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transaction_date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
