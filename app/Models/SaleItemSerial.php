<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItemSerial extends Model
{
    use HasFactory;
    use HasUuid;

    public const UPDATED_AT = null;

    protected $fillable = [
        'sale_item_id',
        'serial_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function serial(): BelongsTo
    {
        return $this->belongsTo(StockSerial::class, 'serial_id');
    }
}
