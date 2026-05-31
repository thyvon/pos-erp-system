<?php

namespace App\Http\Resources\Purchases;

use App\Http\Resources\Foundation\BranchResource;
use App\Http\Resources\Foundation\UserResource;
use App\Http\Resources\Foundation\WarehouseResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_id' => $this->purchase_id,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'return_number' => $this->return_number,
            'status' => $this->status,
            'return_date' => $this->return_date,
            'total_amount' => $this->total_amount,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'items_count' => $this->when($this->items_count !== null, (int) $this->items_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'purchase' => new PurchaseResource($this->whenLoaded('purchase')),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'items' => PurchaseReturnItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
