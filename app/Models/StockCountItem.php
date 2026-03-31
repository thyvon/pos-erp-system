<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockCountItem extends Model
{
    use HasFactory;
    use HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'stock_count_id',
        'product_id',
        'variation_id',
        'lot_id',
        'system_quantity',
        'counted_quantity',
        'unit_cost',
    ];

    protected function casts(): array
    {
        return [
            'system_quantity' => 'decimal:4',
            'counted_quantity' => 'decimal:4',
            'unit_cost' => 'decimal:4',
        ];
    }

    protected function difference(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->counted_quantity === null) {
                return null;
            }

            return number_format(
                round((float) $this->counted_quantity - (float) $this->system_quantity, 4),
                4,
                '.',
                ''
            );
        });
    }

    public function stockCount(): BelongsTo
    {
        return $this->belongsTo(StockCount::class);
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

    public function entries(): HasMany
    {
        return $this->hasMany(StockCountEntry::class);
    }
}
