<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockCount extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'warehouse_id',
        'reference_no',
        'status',
        'date',
        'notes',
        'created_by',
        'completed_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockCountItem::class);
    }

    public function entries(): HasMany
    {
        return $this->hasMany(StockCountEntry::class);
    }
}
