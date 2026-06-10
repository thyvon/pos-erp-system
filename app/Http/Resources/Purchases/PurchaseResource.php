<?php

namespace App\Http\Resources\Purchases;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $completedReturnAmount = $this->relationLoaded('returns')
            ? round((float) $this->returns->where('status', 'completed')->sum('total_amount'), 2)
            : null;
        $netPayableAmount = $completedReturnAmount === null
            ? null
            : round(max(0, (float) $this->total_amount - $completedReturnAmount), 2);
        $dueAmount = $netPayableAmount === null
            ? null
            : round(max(0, $netPayableAmount - (float) $this->paid_amount), 2);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'supplier_id' => $this->supplier_id,
            'created_by' => $this->created_by,
            'received_by' => $this->received_by,
            'purchase_number' => $this->purchase_number,
            'supplier_invoice_no' => $this->supplier_invoice_no,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'purchase_date' => optional($this->purchase_date)->toDateString(),
            'expected_date' => optional($this->expected_date)->toDateString(),
            'received_at' => optional($this->received_at)->toISOString(),
            'subtotal' => $this->subtotal,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount,
            'tax_scope' => $this->tax_scope,
            'tax_rate_id' => $this->tax_rate_id,
            'tax_rate_type' => $this->tax_rate_type,
            'tax_rate' => $this->tax_rate,
            'tax_type' => $this->tax_type,
            'tax_amount' => $this->tax_amount,
            'shipping_charges' => $this->shipping_charges,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'returned_amount' => $this->when($completedReturnAmount !== null, number_format($completedReturnAmount, 2, '.', '')),
            'net_payable_amount' => $this->when($netPayableAmount !== null, number_format($netPayableAmount, 2, '.', '')),
            'due_amount' => $this->when($dueAmount !== null, number_format($dueAmount, 2, '.', '')),
            'notes' => $this->notes,
            'staff_note' => $this->staff_note,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'code' => $this->branch->code,
            ]),
            'warehouse' => $this->whenLoaded('warehouse', fn () => [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
                'code' => $this->warehouse->code,
                'branch_id' => $this->warehouse->branch_id,
            ]),
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
                'code' => $this->supplier->code,
                'company' => $this->supplier->company,
                'phone' => $this->supplier->phone,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim(($this->creator->first_name ?? '') . ' ' . ($this->creator->last_name ?? '')),
                'email' => $this->creator->email,
            ] : null),
            'receiver' => $this->whenLoaded('receiver', fn () => $this->receiver ? [
                'id' => $this->receiver->id,
                'name' => trim(($this->receiver->first_name ?? '') . ' ' . ($this->receiver->last_name ?? '')),
                'email' => $this->receiver->email,
            ] : null),
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
            'payments' => PurchasePaymentResource::collection($this->whenLoaded('payments')),
            'receives' => PurchaseReceiveResource::collection($this->whenLoaded('receives')),
        ];
    }
}
