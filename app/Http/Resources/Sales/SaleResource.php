<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing([
            'branch',
            'warehouse',
            'customer',
            'cashRegisterSession.cashRegister',
            'commissionAgent',
            'parentSale',
            'creator',
            'priceGroup',
            'taxRate',
            'items.product',
            'items.variation',
            'items.subUnit',
            'items.lots.lot',
            'items.serials.serial',
            'payments.paymentAccount',
            'returns',
        ]);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'customer_id' => $this->customer_id,
            'cash_register_session_id' => $this->cash_register_session_id,
            'commission_agent_id' => $this->commission_agent_id,
            'parent_sale_id' => $this->parent_sale_id,
            'sale_number' => $this->sale_number,
            'type' => $this->type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'delivery_status' => $this->delivery_status,
            'is_recurring' => (bool) $this->is_recurring,
            'recurring_interval' => $this->recurring_interval,
            'next_recurring_date' => optional($this->next_recurring_date)->toDateString(),
            'recurring_count' => $this->recurring_count,
            'recurring_generated' => $this->recurring_generated,
            'sale_date' => optional($this->sale_date)->toDateString(),
            'due_date' => optional($this->due_date)->toDateString(),
            'subtotal' => $this->subtotal !== null ? (string) $this->subtotal : null,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount !== null ? (string) $this->discount_amount : null,
            'tax_scope' => $this->tax_scope,
            'tax_rate_id' => $this->tax_rate_id,
            'tax_rate_type' => $this->tax_rate_type,
            'tax_rate' => $this->tax_rate !== null ? (string) $this->tax_rate : null,
            'tax_type' => $this->tax_type,
            'tax_amount' => $this->tax_amount !== null ? (string) $this->tax_amount : null,
            'shipping_charges' => $this->shipping_charges !== null ? (string) $this->shipping_charges : null,
            'total_amount' => $this->total_amount !== null ? (string) $this->total_amount : null,
            'paid_amount' => $this->paid_amount !== null ? (string) $this->paid_amount : null,
            'change_amount' => $this->change_amount !== null ? (string) $this->change_amount : null,
            'notes' => $this->notes,
            'staff_note' => $this->staff_note,
            'branch' => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'code' => $this->branch->code,
            ] : null,
            'warehouse' => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
                'code' => $this->warehouse->code,
            ] : null,
            'customer' => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
            ] : null,
            'cash_register_session' => $this->cashRegisterSession ? [
                'id' => $this->cashRegisterSession->id,
                'status' => $this->cashRegisterSession->status,
                'opened_at' => $this->cashRegisterSession->opened_at,
                'cash_register' => $this->cashRegisterSession->cashRegister ? [
                    'id' => $this->cashRegisterSession->cashRegister->id,
                    'name' => $this->cashRegisterSession->cashRegister->name,
                ] : null,
            ] : null,
            'commission_agent' => $this->commissionAgent ? [
                'id' => $this->commissionAgent->id,
                'name' => trim($this->commissionAgent->first_name.' '.$this->commissionAgent->last_name),
            ] : null,
            'parent_sale' => $this->parentSale ? [
                'id' => $this->parentSale->id,
                'sale_number' => $this->parentSale->sale_number,
                'status' => $this->parentSale->status,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'price_group' => $this->priceGroup ? [
                'id' => $this->priceGroup->id,
                'name' => $this->priceGroup->name,
            ] : null,
            'tax_rate_record' => $this->taxRate ? [
                'id' => $this->taxRate->id,
                'name' => $this->taxRate->name,
                'type' => $this->taxRate->type,
                'rate' => (float) $this->taxRate->rate,
            ] : null,
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
            'payments_count' => (int) ($this->payments_count ?? $this->payments->count()),
            'returns_count' => (int) ($this->returns_count ?? $this->returns->count()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
