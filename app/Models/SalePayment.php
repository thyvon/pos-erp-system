<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasUserTracking;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePayment extends Model
{
    use HasFactory;
    use HasUuid;
    use BelongsToTenant;
    use HasUserTracking;

    protected $fillable = [
        'business_id',
        'sale_id',
        'payment_account_id',
        'amount',
        'payment_currency',
        'payment_amount',
        'exchange_rate_id',
        'exchange_rate',
        'method',
        'gift_card_id',
        'reference',
        'payment_date',
        'note',
        'status',
        'replaces_payment_id',
        'reversed_by',
        'reversed_at',
        'reversal_reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_amount' => 'decimal:2',
            'exchange_rate' => 'decimal:6',
            'payment_date' => 'date',
            'reversed_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function paymentAccount(): BelongsTo
    {
        return $this->belongsTo(PaymentAccount::class);
    }

    public function exchangeRate(): BelongsTo
    {
        return $this->belongsTo(ExchangeRate::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function replacedPayment(): BelongsTo
    {
        return $this->belongsTo(self::class, 'replaces_payment_id');
    }

    public function reverser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }
}
