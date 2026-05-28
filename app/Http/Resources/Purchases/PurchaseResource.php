<?php

namespace App\Http\Resources\Purchases;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
            'discount_amount' => $this->discount_amount,
            'tax_amount' => $this->tax_amount,
            'shipping_charges' => $this->shipping_charges,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
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
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ] : null),
            'receiver' => $this->whenLoaded('receiver', fn () => $this->receiver ? [
                'id' => $this->receiver->id,
                'name' => $this->receiver->name,
                'email' => $this->receiver->email,
            ] : null),
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
