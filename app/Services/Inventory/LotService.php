<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\StockLot;
use App\Models\User;
use App\Repositories\Inventory\StockLotRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LotService
{
    public function __construct(
        protected StockLotRepository $lots,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->lots->paginateFiltered($filters, $user);
    }

    public function updateStatus(string $businessId, StockLot $lot, string $status, ?string $reason = null, ?User $actor = null): StockLot
    {
        return DB::transaction(function () use ($businessId, $lot, $status, $reason, $actor): StockLot {
            $this->ensureBelongsToBusiness($businessId, $lot);

            if ($lot->status === $status) {
                return $lot->load(['product', 'variation', 'warehouse.branch', 'supplier']);
            }

            $oldValues = [
                'lot_number' => $lot->lot_number,
                'old_status' => $lot->status,
            ];

            $lot->status = $status;
            $lot->save();

            $this->auditLogger->log(
                'lot_status_changed',
                StockLot::class,
                $lot->id,
                $actor,
                $businessId,
                $oldValues,
                [
                    'new_status' => $status,
                    'reason' => $reason,
                ]
            );

            return $lot->refresh()->load(['product', 'variation', 'warehouse.branch', 'supplier']);
        });
    }

    protected function ensureBelongsToBusiness(string $businessId, StockLot $lot): void
    {
        if ((string) $lot->business_id !== $businessId) {
            throw new DomainException('Lot does not belong to the current business.', 422);
        }
    }
}
