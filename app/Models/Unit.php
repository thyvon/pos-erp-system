<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'created_by',
        'updated_by',
        'name',
        'short_name',
        'allow_decimal',
    ];

    protected function casts(): array
    {
        return [
            'allow_decimal' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function subUnits(): HasMany
    {
        return $this->hasMany(SubUnit::class, 'parent_unit_id')->orderBy('name');
    }
}
