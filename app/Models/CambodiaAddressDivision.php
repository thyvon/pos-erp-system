<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CambodiaAddressDivision extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'type',
        'code',
        'parent_code',
        'name_en',
        'name_km',
        'province_id',
        'district_id',
        'commune_id',
        'sort_order',
        'is_active',
        'source_payload',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'source_payload' => 'array',
            'synced_at' => 'datetime',
        ];
    }
}
