<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReceive extends BaseModel
{
    use HasFactory;
    use HasUuid;
    use BelongsToBranch;
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'purchase_id',
        'branch_id',
        'warehouse_id',
        'receive_number',
        'received_at',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'date',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseReceiveItem::class)->orderBy('created_at');
    }
}
