<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasUserTracking;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLot extends Model
{
    use HasFactory;
    use HasUuid;
    use BelongsToTenant;
    use HasUserTracking;

    protected $fillable = [
        'business_id',
        'product_id',
        'variation_id',
        'warehouse_id',
        'supplier_id',
        'lot_number',
        'manufacture_date',
        'expiry_date',
        'received_at',
        'unit_cost',
        'qty_received',
        'qty_on_hand',
        'qty_reserved',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
            'received_at' => 'datetime',
            'unit_cost' => 'decimal:4',
            'qty_received' => 'decimal:4',
            'qty_on_hand' => 'decimal:4',
            'qty_reserved' => 'decimal:4',
            'qty_available' => 'decimal:4',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'variation_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
