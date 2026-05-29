<?php

namespace App\Http\Resources\Purchases;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchasePaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['paymentAccount', 'creator', 'replacedPayment', 'reverser']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'purchase_id' => $this->purchase_id,
            'payment_account_id' => $this->payment_account_id,
            'amount' => $this->amount !== null ? (string) $this->amount : null,
            'payment_currency' => $this->payment_currency ?? 'USD',
            'payment_amount' => $this->payment_amount !== null ? (string) $this->payment_amount : null,
            'exchange_rate_id' => $this->exchange_rate_id,
            'exchange_rate' => $this->exchange_rate !== null ? (string) $this->exchange_rate : null,
            'method' => $this->method,
            'reference' => $this->reference,
            'payment_date' => optional($this->payment_date)->toDateString(),
            'note' => $this->note,
            'status' => $this->status ?? 'completed',
            'replaces_payment_id' => $this->replaces_payment_id,
            'reversed_by' => $this->reverser ? [
                'id' => $this->reverser->id,
                'name' => trim($this->reverser->first_name.' '.$this->reverser->last_name),
            ] : null,
            'reversed_at' => optional($this->reversed_at)?->toISOString(),
            'reversal_reason' => $this->reversal_reason,
            'payment_account' => $this->paymentAccount ? [
                'id' => $this->paymentAccount->id,
                'name' => $this->paymentAccount->name,
                'type' => $this->paymentAccount->account_type,
            ] : null,
            'replaced_payment' => $this->replacedPayment ? [
                'id' => $this->replacedPayment->id,
                'reference' => $this->replacedPayment->reference,
                'payment_date' => optional($this->replacedPayment->payment_date)->toDateString(),
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
