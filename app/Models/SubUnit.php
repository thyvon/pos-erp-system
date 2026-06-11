<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SubUnit extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'parent_unit_id',
        'created_by',
        'updated_by',
        'name',
        'short_name',
        'conversion_factor',
    ];

    protected function casts(): array
    {
        return [
            'conversion_factor' => 'decimal:4',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function parentUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'parent_unit_id');
    }

    public static function isUsedInTransactions(string $subUnitId): bool
    {
        if (Schema::hasTable('purchase_items') && Schema::hasColumn('purchase_items', 'sub_unit_id')) {
            if (DB::table('purchase_items')->where('sub_unit_id', $subUnitId)->exists()) {
                return true;
            }
        }

        if (Schema::hasTable('sale_items') && Schema::hasColumn('sale_items', 'sub_unit_id')) {
            if (DB::table('sale_items')->where('sub_unit_id', $subUnitId)->exists()) {
                return true;
            }
        }

        return false;
    }
}
