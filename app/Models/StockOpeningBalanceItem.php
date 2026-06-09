<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpeningBalanceItem extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'stock_opening_balance_id',
        'product_id',
        'variation_id',
        'lot_id',
        'serial_id',
        'quantity',
        'unit_cost',
        'lot_number',
        'manufacture_date',
        'expiry_date',
        'serial_number',
        'warranty_expires',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'unit_cost' => 'decimal:4',
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
            'warranty_expires' => 'date',
        ];
    }

    public function openingBalance(): BelongsTo
    {
        return $this->belongsTo(StockOpeningBalance::class, 'stock_opening_balance_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'variation_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'lot_id');
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(StockSerial::class, 'serial_id');
    }
}
