<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RackLocation extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'warehouse_id',
        'created_by',
        'updated_by',
        'name',
        'code',
        'description',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
