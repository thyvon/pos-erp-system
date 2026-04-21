<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleTarget extends Model
{
    use HasFactory;
    use HasUuid;
    use BelongsToTenant;

    protected $fillable = [
        'business_id',
        'user_id',
        'month',
        'year',
        'target_amount',
        'achieved_amount',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
            'target_amount' => 'decimal:2',
            'achieved_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
