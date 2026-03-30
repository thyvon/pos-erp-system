<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\StockSerial;
use App\Models\User;
use App\Repositories\Inventory\StockSerialRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SerialService
{
    public function __construct(
        protected StockSerialRepository $serials,
        protected StockMovementService $stockMovementService,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->serials->paginateFiltered($filters, $user);
    }

    public function writeOff(string $businessId, StockSerial $serial, string $reason, ?User $actor = null): StockSerial
    {
        return DB::transaction(function () use ($businessId, $serial, $reason, $actor): StockSerial {
            $this->ensureBelongsToBusiness($businessId, $serial);

            if ($serial->status === 'written_off') {
                throw new DomainException('This serial has already been written off.', 422);
            }

            if ($serial->status === 'sold') {
                throw new DomainException('Sold serials cannot be written off.', 422);
            }

            if (! $serial->warehouse_id) {
                throw new DomainException('Only serials currently linked to a warehouse can be written off.', 422);
            }

            $oldValues = [
                'serial_number' => $serial->serial_number,
                'old_status' => $serial->status,
            ];

            $this->stockMovementService->record($businessId, [
                'product_id' => $serial->product_id,
                'variation_id' => $serial->variation_id,
                'warehouse_id' => $serial->warehouse_id,
                'serial_id' => $serial->id,
                'type' => 'adjustment_out',
                'quantity' => 1,
                'unit_cost' => $serial->unit_cost,
                'reference_type' => StockSerial::class,
                'reference_id' => $serial->id,
                'notes' => 'Serial write-off: '.$reason,
            ], $actor);

            $serial->status = 'written_off';
            $serial->notes = filled($serial->notes) ? $serial->notes."\n".$reason : $reason;
            $serial->save();

            $this->auditLogger->log(
                'serial_written_off',
                StockSerial::class,
                $serial->id,
                $actor,
                $businessId,
                $oldValues,
                [
                    'reason' => $reason,
                ]
            );

            return $serial->refresh()->load(['product', 'variation', 'warehouse.branch', 'supplier']);
        });
    }

    protected function ensureBelongsToBusiness(string $businessId, StockSerial $serial): void
    {
        if ((string) $serial->business_id !== $businessId) {
            throw new DomainException('Serial does not belong to the current business.', 422);
        }
    }
}
