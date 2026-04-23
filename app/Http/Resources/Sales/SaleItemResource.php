<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['product', 'variation', 'subUnit', 'taxRate', 'lots.lot', 'serials.serial']);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'sub_unit_id' => $this->sub_unit_id,
            'quantity' => $this->quantity !== null ? (string) $this->quantity : null,
            'unit_price' => $this->unit_price !== null ? (string) $this->unit_price : null,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount !== null ? (string) $this->discount_amount : null,
            'tax_rate_id' => $this->tax_rate_id,
            'tax_rate_type' => $this->tax_rate_type,
            'tax_rate' => $this->tax_rate !== null ? (string) $this->tax_rate : null,
            'tax_type' => $this->tax_type,
            'tax_amount' => $this->tax_amount !== null ? (string) $this->tax_amount : null,
            'unit_cost' => $this->unit_cost !== null ? (string) $this->unit_cost : null,
            'total_amount' => $this->total_amount !== null ? (string) $this->total_amount : null,
            'notes' => $this->notes,
            'product' => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'stock_tracking' => $this->product->stock_tracking,
                'track_inventory' => (bool) $this->product->track_inventory,
            ] : null,
            'variation' => $this->variation ? [
                'id' => $this->variation->id,
                'name' => $this->variation->name,
                'sku' => $this->variation->sku,
            ] : null,
            'sub_unit' => $this->subUnit ? [
                'id' => $this->subUnit->id,
                'name' => $this->subUnit->name,
                'short_name' => $this->subUnit->short_name,
            ] : null,
            'tax_rate_record' => $this->taxRate ? [
                'id' => $this->taxRate->id,
                'name' => $this->taxRate->name,
                'type' => $this->taxRate->type,
                'rate' => (float) $this->taxRate->rate,
            ] : null,
            'lots' => SaleItemLotResource::collection($this->whenLoaded('lots')),
            'serials' => SaleItemSerialResource::collection($this->whenLoaded('serials')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
