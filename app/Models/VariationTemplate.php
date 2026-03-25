<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VariationTemplate extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'created_by',
        'updated_by',
        'name',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(VariationValue::class)->orderBy('sort_order')->orderBy('name');
    }
}
