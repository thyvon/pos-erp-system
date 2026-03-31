<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockTransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['fromWarehouse.branch', 'toWarehouse.branch', 'creator', 'sender', 'receiver', 'items.product', 'items.variation', 'items.lot', 'items.serial']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'from_warehouse_id' => $this->from_warehouse_id,
            'to_warehouse_id' => $this->to_warehouse_id,
            'reference_no' => $this->reference_no,
            'status' => $this->status,
            'date' => optional($this->date)->toDateString(),
            'notes' => $this->notes,
            'from_warehouse' => $this->fromWarehouse ? [
                'id' => $this->fromWarehouse->id,
                'name' => $this->fromWarehouse->name,
                'branch_id' => $this->fromWarehouse->branch_id,
                'branch_name' => $this->fromWarehouse->branch?->name,
            ] : null,
            'to_warehouse' => $this->toWarehouse ? [
                'id' => $this->toWarehouse->id,
                'name' => $this->toWarehouse->name,
                'branch_id' => $this->toWarehouse->branch_id,
                'branch_name' => $this->toWarehouse->branch?->name,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'sender' => $this->sender ? [
                'id' => $this->sender->id,
                'name' => trim($this->sender->first_name.' '.$this->sender->last_name),
            ] : null,
            'receiver' => $this->receiver ? [
                'id' => $this->receiver->id,
                'name' => trim($this->receiver->first_name.' '.$this->receiver->last_name),
            ] : null,
            'sent_at' => $this->sent_at,
            'received_at' => $this->received_at,
            'items' => StockTransferItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
