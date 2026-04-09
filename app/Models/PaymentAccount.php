<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentAccount extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'account_type',
        'account_number',
        'bank_name',
        'opening_balance',
        'coa_account_id',
        'is_active',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'coa_account_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AccountTransaction::class)->orderByDesc('transaction_date');
    }
}
