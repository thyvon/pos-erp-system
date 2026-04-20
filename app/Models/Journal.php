<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journal extends Model
{
    use HasFactory;
    use HasUuid;
    use BelongsToTenant;

    public $timestamps = true;

    const UPDATED_AT = null;

    protected $fillable = [
        'business_id',
        'fiscal_year_id',
        'journal_number',
        'type',
        'reference_type',
        'reference_id',
        'description',
        'total_amount',
        'posted_at',
        'posted_by',
        'reversed_by_id',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'posted_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reversed_by_id');
    }

    public function reversalOf(): HasMany
    {
        return $this->hasMany(self::class, 'reversed_by_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(JournalEntry::class)->orderBy('created_at');
    }
}
