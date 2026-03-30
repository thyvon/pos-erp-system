<?php

namespace App\Models;

use App\Traits\HandlesSoftDeleteUniqueAttributes;
use App\Traits\HasFileAssets;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariation extends BaseModel
{
    use HasFactory;
    use HandlesSoftDeleteUniqueAttributes;
    use HasFileAssets;

    protected $fillable = [
        'business_id',
        'product_id',
        'sub_unit_id',
        'name',
        'variation_value_ids',
        'sku',
        'selling_price',
        'purchase_price',
        'sub_unit_selling_price',
        'sub_unit_purchase_price',
        'minimum_selling_price',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'variation_value_ids' => 'array',
            'selling_price' => 'decimal:2',
            'purchase_price' => 'decimal:2',
            'sub_unit_selling_price' => 'decimal:2',
            'sub_unit_purchase_price' => 'decimal:2',
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

    public function subUnit(): BelongsTo
    {
        return $this->belongsTo(SubUnit::class, 'sub_unit_id');
    }

    public function softDeleteUniqueColumns(): array
    {
        return [
            'sku' => 100,
        ];
    }
}
