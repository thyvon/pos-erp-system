<?php

namespace App\Models;

use App\Traits\HandlesSoftDeleteUniqueAttributes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPackaging extends BaseModel
{
    use HasFactory;
    use HandlesSoftDeleteUniqueAttributes;

    protected $fillable = [
        'business_id',
        'product_id',
        'name',
        'short_name',
        'conversion_factor',
        'sku',
        'barcode',
        'selling_price',
        'purchase_price',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'conversion_factor' => 'decimal:4',
            'selling_price' => 'decimal:2',
            'purchase_price' => 'decimal:2',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function softDeleteUniqueColumns(): array
    {
        return [
            'name' => 100,
            'sku' => 100,
        ];
    }
}
