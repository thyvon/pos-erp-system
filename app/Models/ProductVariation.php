<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariation extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'product_id',
        'name',
        'variation_value_ids',
        'sku',
        'barcode',
        'selling_price',
        'purchase_price',
        'minimum_selling_price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'variation_value_ids' => 'array',
            'selling_price' => 'decimal:2',
            'purchase_price' => 'decimal:2',
            'minimum_selling_price' => 'decimal:2',
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
}
