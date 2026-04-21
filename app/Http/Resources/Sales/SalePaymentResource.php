<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['paymentAccount', 'creator']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'sale_id' => $this->sale_id,
            'payment_account_id' => $this->payment_account_id,
            'amount' => $this->amount !== null ? (string) $this->amount : null,
            'method' => $this->method,
            'gift_card_id' => $this->gift_card_id,
            'reference' => $this->reference,
            'payment_date' => optional($this->payment_date)->toDateString(),
            'note' => $this->note,
            'payment_account' => $this->paymentAccount ? [
                'id' => $this->paymentAccount->id,
                'name' => $this->paymentAccount->name,
                'type' => $this->paymentAccount->account_type,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
