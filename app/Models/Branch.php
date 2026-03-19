<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'code',
        'type',
        'phone',
        'email',
        'address',
        'manager_id',
        'is_default',
        'is_active',
        'business_hours',
        'invoice_settings',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
            'business_hours' => 'array',
            'invoice_settings' => 'array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }
}
