<?php

namespace App\Models;

use App\Traits\HandlesSoftDeleteUniqueAttributes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends BaseModel
{
    use HasFactory;
    use HandlesSoftDeleteUniqueAttributes;

    protected $fillable = [
        'business_id',
        'category_id',
        'brand_id',
        'unit_id',
        'sub_unit_id',
        'tax_rate_id',
        'rack_location_id',
        'variation_template_id',
        'variation_template_ids',
        'price_group_id',
        'created_by',
        'updated_by',
        'name',
        'description',
        'sku',
        'barcode',
        'barcode_type',
        'type',
        'stock_tracking',
        'has_expiry',
        'selling_price',
        'purchase_price',
        'minimum_selling_price',
        'profit_margin',
        'tax_type',
        'track_inventory',
        'alert_quantity',
        'max_stock_level',
        'is_for_selling',
        'is_active',
        'weight',
        'image_url',
        'custom_fields',
    ];

    protected function casts(): array
    {
        return [
            'has_expiry' => 'boolean',
            'selling_price' => 'decimal:2',
            'purchase_price' => 'decimal:2',
            'minimum_selling_price' => 'decimal:2',
            'profit_margin' => 'decimal:2',
            'track_inventory' => 'boolean',
            'alert_quantity' => 'decimal:3',
            'max_stock_level' => 'decimal:3',
            'is_for_selling' => 'boolean',
            'is_active' => 'boolean',
            'weight' => 'decimal:3',
            'custom_fields' => 'array',
            'variation_template_ids' => 'array',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function subUnit(): BelongsTo
    {
        return $this->belongsTo(SubUnit::class, 'sub_unit_id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class);
    }

    public function rackLocation(): BelongsTo
    {
        return $this->belongsTo(RackLocation::class);
    }

    public function variationTemplate(): BelongsTo
    {
        return $this->belongsTo(VariationTemplate::class);
    }

    public function priceGroup(): BelongsTo
    {
        return $this->belongsTo(PriceGroup::class);
    }

    public function variations(): HasMany
    {
        return $this->hasMany(ProductVariation::class)->orderBy('name');
    }

    public function comboItems(): HasMany
    {
        return $this->hasMany(ComboItem::class)->orderBy('created_at');
    }

    public function packagingOptions(): HasMany
    {
        return $this->hasMany(ProductPackaging::class)->orderByDesc('is_default')->orderBy('name');
    }

    public function softDeleteUniqueColumns(): array
    {
        return [
            'sku' => 100,
        ];
    }
}
