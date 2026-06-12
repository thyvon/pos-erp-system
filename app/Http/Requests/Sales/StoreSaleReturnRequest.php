<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;

        return [
            'return_date' => ['required', 'date'],
            'refund_method' => ['required', Rule::in(['cash', 'credit_note', 'bank_transfer'])],
            'payment_account_id' => [
                'nullable',
                'required_if:refund_method,cash,bank_transfer',
                'prohibited_if:refund_method,credit_note',
                'uuid',
                Rule::exists('payment_accounts', 'id')->where(
                    fn ($query) => $query->where('business_id', $businessId)
                ),
            ],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'uuid'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.lot_id' => ['nullable', 'uuid'],
            'items.*.serial_ids' => ['nullable', 'array'],
            'items.*.serial_ids.*' => ['uuid'],
        ];
    }
}
