<?php

namespace App\Models;

use App\Traits\BelongsToWarehouse;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RackLocation extends BaseModel
{
    use HasFactory;
    use BelongsToWarehouse;

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
