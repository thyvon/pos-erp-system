<?php

namespace App\Models;

use App\Traits\HasFileAssets;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Brand extends BaseModel
{
    use HasFactory;
    use HasFileAssets;

    protected $fillable = [
        'business_id',
        'created_by',
        'updated_by',
        'name',
        'description',
        'image_url',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
