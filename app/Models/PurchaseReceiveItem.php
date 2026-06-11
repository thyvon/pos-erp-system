<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReceiveItem extends Model
{
    use HasFactory;
    use HasUuid;

    protected $fillable = [
        'purchase_receive_id',
        'purchase_item_id',
        'quantity',
        'lot_number',
        'manufacture_date',
        'expiry_date',
        'warranty_expires',
        'serial_numbers',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'manufacture_date' => 'date',
            'expiry_date' => 'date',
            'warranty_expires' => 'date',
            'serial_numbers' => 'array',
        ];
    }

    public function purchaseReceive(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceive::class);
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }
}
