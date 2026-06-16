<?php

namespace App\Models;

use App\Traits\BelongsToWarehouse;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseProductSetting extends BaseModel
{
    use HasFactory;
    use BelongsToWarehouse;

    protected $fillable = [
        'business_id',
        'warehouse_id',
        'product_id',
        'variation_id',
        'rack_location_id',
        'preferred_supplier_id',
        'min_stock_alert',
        'max_stock_level',
        'reorder_point',
        'reorder_quantity',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'min_stock_alert' => 'decimal:4',
            'max_stock_level' => 'decimal:4',
            'reorder_point' => 'decimal:4',
            'reorder_quantity' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'variation_id');
    }

    public function rackLocation(): BelongsTo
    {
        return $this->belongsTo(RackLocation::class);
    }

    public function preferredSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }
}
