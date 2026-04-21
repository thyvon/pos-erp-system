<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleCommission extends Model
{
    use HasFactory;
    use HasUuid;
    use BelongsToTenant;

    protected $fillable = [
        'business_id',
        'sale_id',
        'user_id',
        'commission_percentage',
        'commission_amount',
        'payment_status',
        'paid_at',
        'paid_via_expense_id',
    ];

    protected function casts(): array
    {
        return [
            'commission_percentage' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
