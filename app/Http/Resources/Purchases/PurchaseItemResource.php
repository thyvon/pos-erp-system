<?php

namespace App\Http\Resources\Purchases;

use App\Models\StockLot;
use App\Models\StockSerial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $selectedUnit = $this->subUnit ?? $this->product?->unit;

        return [
            'id' => $this->id,
            'purchase_id' => $this->purchase_id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'sub_unit_id' => $this->sub_unit_id,
            'quantity' => $this->quantity,
            'received_quantity' => $this->received_quantity,
            'unit_cost' => $this->unit_cost,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount,
            'tax_rate_id' => $this->tax_rate_id,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'notes' => $this->notes,
            'unit_label' => $selectedUnit ? ($selectedUnit->short_name ?? $selectedUnit->name) : null,
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'type' => $this->product->type,
                'stock_tracking' => $this->product->stock_tracking,
                'unit' => $this->product->unit ? [
                    'id' => $this->product->unit->id,
                    'name' => $this->product->unit->name,
                    'short_name' => $this->product->unit->short_name,
                ] : null,
            ]),
            'variation' => $this->whenLoaded('variation', fn () => $this->variation ? [
                'id' => $this->variation->id,
                'name' => $this->variation->name,
                'sku' => $this->variation->sku,
            ] : null),
            'sub_unit' => $this->whenLoaded('subUnit', fn () => $this->subUnit ? [
                'id' => $this->subUnit->id,
                'name' => $this->subUnit->name,
                'short_name' => $this->subUnit->short_name,
                'conversion_factor' => $this->subUnit->conversion_factor,
            ] : null),
            'tax_rate_info' => $this->whenLoaded('taxRate', fn () => $this->taxRate ? [
                'id' => $this->taxRate->id,
                'name' => $this->taxRate->name,
                'rate' => $this->taxRate->rate,
                'type' => $this->taxRate->type,
            ] : null),
            'return_lots' => $this->when(
                $this->product?->stock_tracking === 'lot',
                fn () => StockLot::withoutGlobalScopes()
                    ->where('business_id', $this->purchase?->business_id)
                    ->where('warehouse_id', $this->purchase?->warehouse_id)
                    ->where('product_id', $this->product_id)
                    ->where('variation_id', $this->variation_id)
                    ->where('status', 'active')
                    ->where('qty_on_hand', '>', 0)
                    ->orderBy('expiry_date')
                    ->orderBy('lot_number')
                    ->get()
                    ->map(fn (StockLot $lot): array => [
                        'id' => $lot->id,
                        'lot_number' => $lot->lot_number,
                        'qty_on_hand' => $lot->qty_on_hand,
                        'expiry_date' => optional($lot->expiry_date)->toDateString(),
                    ])
                    ->values()
                    ->all()
            ),
            'return_serials' => $this->when(
                $this->product?->stock_tracking === 'serial',
                fn () => StockSerial::withoutGlobalScopes()
                    ->where('business_id', $this->purchase?->business_id)
                    ->where('purchase_item_id', $this->id)
                    ->where('status', 'in_stock')
                    ->orderBy('serial_number')
                    ->get()
                    ->map(fn (StockSerial $serial): array => [
                        'id' => $serial->id,
                        'serial_number' => $serial->serial_number,
                    ])
                    ->values()
                    ->all()
            ),
        ];
    }
}
