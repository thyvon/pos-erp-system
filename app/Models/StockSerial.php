<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasUserTracking;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockSerial extends Model
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
        'serial_number',
        'status',
        'purchase_item_id',
        'sale_item_id',
        'unit_cost',
        'warranty_expires',
        'received_at',
        'sold_at',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost' => 'decimal:4',
            'warranty_expires' => 'date',
            'received_at' => 'datetime',
            'sold_at' => 'datetime',
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
