<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'sale_id',
        'product_id',
        'variation_id',
        'sub_unit_id',
        'quantity',
        'unit_price',
        'discount_type',
        'discount_amount',
        'tax_rate_id',
        'tax_rate_type',
        'tax_rate',
        'tax_type',
        'tax_amount',
        'unit_cost',
        'total_amount',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'unit_price' => 'decimal:4',
            'discount_amount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'unit_cost' => 'decimal:4',
            'total_amount' => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'variation_id');
    }

    public function subUnit(): BelongsTo
    {
        return $this->belongsTo(SubUnit::class, 'sub_unit_id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id');
    }

    public function lots(): HasMany
    {
        return $this->hasMany(SaleItemLot::class)->orderBy('id');
    }

    public function serials(): HasMany
    {
        return $this->hasMany(SaleItemSerial::class)->orderBy('created_at');
    }
}
