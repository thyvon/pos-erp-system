<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Warehouse extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'code',
        'type',
        'is_active',
        'is_default',
        'allow_negative_stock',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'allow_negative_stock' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
