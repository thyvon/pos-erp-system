<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Support\Foundation\DefaultSettings;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Business extends Model
{
    use HasFactory;
    use HasUuid;
    use SoftDeletes;

    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
            'financial_year' => 'array',
            'settings_cache' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Business $business): void {
            if (Schema::hasTable('settings')) {
                DefaultSettings::seedBusiness($business->id);
            }
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class)
            ->withoutGlobalScopes()
            ->oldestOfMany('created_at');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }
}
