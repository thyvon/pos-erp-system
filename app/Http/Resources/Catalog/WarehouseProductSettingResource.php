<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseProductSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'rack_location_id' => $this->rack_location_id,
            'preferred_supplier_id' => $this->preferred_supplier_id,
            'min_stock_alert' => $this->min_stock_alert !== null ? (string) $this->min_stock_alert : null,
            'max_stock_level' => $this->max_stock_level !== null ? (string) $this->max_stock_level : null,
            'reorder_point' => $this->reorder_point !== null ? (string) $this->reorder_point : null,
            'reorder_quantity' => $this->reorder_quantity !== null ? (string) $this->reorder_quantity : null,
            'is_active' => (bool) $this->is_active,
            'notes' => $this->notes,
            'warehouse' => $this->whenLoaded('warehouse', fn () => [
                'id' => $this->warehouse?->id,
                'name' => $this->warehouse?->name,
                'code' => $this->warehouse?->code,
                'branch' => $this->warehouse?->relationLoaded('branch')
                    ? [
                        'id' => $this->warehouse?->branch?->id,
                        'name' => $this->warehouse?->branch?->name,
                    ]
                    : null,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'sku' => $this->product?->sku,
                'type' => $this->product?->type,
                'stock_tracking' => $this->product?->stock_tracking,
                'track_inventory' => (bool) $this->product?->track_inventory,
            ]),
            'variation' => $this->whenLoaded('variation', fn () => $this->variation ? [
                'id' => $this->variation->id,
                'name' => $this->variation->name,
                'sku' => $this->variation->sku,
            ] : null),
            'rack_location' => $this->whenLoaded('rackLocation', fn () => $this->rackLocation ? [
                'id' => $this->rackLocation->id,
                'name' => $this->rackLocation->name,
                'code' => $this->rackLocation->code,
            ] : null),
            'preferred_supplier' => $this->whenLoaded('preferredSupplier', fn () => $this->preferredSupplier ? [
                'id' => $this->preferredSupplier->id,
                'name' => $this->preferredSupplier->name,
                'phone' => $this->preferredSupplier->phone,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
