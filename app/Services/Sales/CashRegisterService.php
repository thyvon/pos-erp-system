<?php

namespace App\Services\Sales;

use App\Exceptions\Domain\DomainException;
use App\Models\Branch;
use App\Models\CashRegister;
use App\Models\CashRegisterSession;
use App\Models\Sale;
use App\Models\User;
use App\Repositories\Sales\CashRegisterRepository;
use App\Services\AuditService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CashRegisterService
{
    public function __construct(
        protected CashRegisterRepository $registers,
        protected AuditService $auditService,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->registers->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): CashRegister
    {
        return DB::transaction(function () use ($businessId, $data, $actor): CashRegister {
            $branch = $this->resolveBranch($businessId, $data['branch_id']);

            /** @var CashRegister $register */
            $register = $this->registers->create([
                'business_id' => $businessId,
                'branch_id' => $branch->id,
                'name' => trim($data['name']),
                'is_active' => (bool) ($data['is_active'] ?? true),
            ]);

            $register = $this->loadRegister($register);

            $this->auditService->log(
                'created',
                CashRegister::class,
                $register->id,
                $actor,
                $businessId,
                null,
                [
                    'name' => $register->name,
                    'branch_id' => $register->branch_id,
                    'is_active' => $register->is_active,
                ]
            );

            return $register;
        });
    }

    public function update(string $businessId, CashRegister $cashRegister, array $data, ?User $actor = null): CashRegister
    {
        return DB::transaction(function () use ($businessId, $cashRegister, $data, $actor): CashRegister {
            /** @var CashRegister $lockedRegister */
            $lockedRegister = CashRegister::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->whereKey($cashRegister->id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldValues = [
                'name' => $lockedRegister->name,
                'branch_id' => $lockedRegister->branch_id,
                'is_active' => $lockedRegister->is_active,
            ];

            if (array_key_exists('branch_id', $data)) {
                $lockedRegister->branch_id = $this->resolveBranch($businessId, $data['branch_id'])->id;
            }

            if (array_key_exists('name', $data)) {
                $lockedRegister->name = trim((string) $data['name']);
            }

            if (array_key_exists('is_active', $data)) {
                $lockedRegister->is_active = (bool) $data['is_active'];
            }

            $lockedRegister->save();
            $lockedRegister = $this->loadRegister($lockedRegister);

            $this->auditService->log(
                'updated',
                CashRegister::class,
                $lockedRegister->id,
                $actor,
                $businessId,
                $oldValues,
                [
                    'name' => $lockedRegister->name,
                    'branch_id' => $lockedRegister->branch_id,
                    'is_active' => $lockedRegister->is_active,
                ]
            );

            return $lockedRegister;
        });
    }

    public function delete(string $businessId, CashRegister $cashRegister, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $cashRegister, $actor): void {
            /** @var CashRegister $lockedRegister */
            $lockedRegister = CashRegister::withoutGlobalScopes()
                ->with(['sessions' => fn ($query) => $query->where('status', 'open')])
                ->where('business_id', $businessId)
                ->whereKey($cashRegister->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedRegister->sessions->isNotEmpty()) {
                throw new DomainException('Close the open session before deleting this cash register.', 422);
            }

            $oldValues = [
                'name' => $lockedRegister->name,
                'branch_id' => $lockedRegister->branch_id,
                'is_active' => $lockedRegister->is_active,
            ];

            $this->registers->delete($lockedRegister);

            $this->auditService->log(
                'deleted',
                CashRegister::class,
                $cashRegister->id,
                $actor,
                $businessId,
                $oldValues,
                null
            );
        });
    }

    public function openSession(string $businessId, CashRegister $cashRegister, array $data, ?User $actor = null): CashRegisterSession
    {
        return DB::transaction(function () use ($businessId, $cashRegister, $data, $actor): CashRegisterSession {
            if (! $actor) {
                throw new DomainException('An authenticated user is required to open a cash register session.', 422);
            }

            /** @var CashRegister $lockedRegister */
            $lockedRegister = CashRegister::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->whereKey($cashRegister->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $lockedRegister->is_active) {
                throw new DomainException('Inactive cash registers cannot open new sessions.', 422);
            }

            $existingRegisterSession = CashRegisterSession::query()
                ->where('cash_register_id', $lockedRegister->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if ($existingRegisterSession) {
                throw new DomainException('This cash register already has an open session.', 422);
            }

            $existingUserSession = CashRegisterSession::query()
                ->where('user_id', $actor->id)
                ->where('status', 'open')
                ->whereHas('cashRegister', fn ($query) => $query->where('business_id', $businessId))
                ->lockForUpdate()
                ->first();

            if ($existingUserSession) {
                throw new DomainException('Close your current open cash register session before opening another one.', 422);
            }

            $session = CashRegisterSession::query()->create([
                'cash_register_id' => $lockedRegister->id,
                'user_id' => $actor->id,
                'opening_float' => round((float) ($data['opening_float'] ?? 0), 2),
                'status' => 'open',
                'opened_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $session = $this->loadSession($session);

            $this->auditService->log(
                'session_opened',
                CashRegisterSession::class,
                $session->id,
                $actor,
                $businessId,
                null,
                [
                    'opening_float' => (string) $session->opening_float,
                    'register' => $lockedRegister->name,
                    'branch_id' => $lockedRegister->branch_id,
                ]
            );

            return $session;
        });
    }

    public function closeSession(string $businessId, CashRegisterSession $session, array $data, ?User $actor = null): CashRegisterSession
    {
        return DB::transaction(function () use ($businessId, $session, $data, $actor): CashRegisterSession {
            /** @var CashRegisterSession $lockedSession */
            $lockedSession = CashRegisterSession::query()
                ->with('cashRegister')
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $lockedSession->cashRegister || (string) $lockedSession->cashRegister->business_id !== (string) $businessId) {
                throw new DomainException('Selected cash register session is invalid for this business.', 422);
            }

            if ($lockedSession->status !== 'open') {
                throw new DomainException('Only open cash register sessions can be closed.', 422);
            }

            if (
                $actor
                && ! $actor->hasRole(['admin', 'super_admin', 'manager'])
                && (string) $lockedSession->user_id !== (string) $actor->id
            ) {
                throw new DomainException('You can only close your own open cash register session.', 422);
            }

            $totalSales = (float) Sale::withoutGlobalScopes()
                ->where('cash_register_session_id', $lockedSession->id)
                ->where('status', 'completed')
                ->sum('total_amount');

            $closingFloat = round((float) $data['closing_float'], 2);
            $discrepancy = round($closingFloat - (float) $lockedSession->opening_float, 2);

            $lockedSession->closing_float = $closingFloat;
            $lockedSession->denominations_at_close = $data['denominations_at_close'] ?? null;
            $lockedSession->total_sales = round($totalSales, 2);
            $lockedSession->status = 'closed';
            $lockedSession->closed_at = now();
            $lockedSession->notes = $data['notes'] ?? $lockedSession->notes;
            $lockedSession->save();

            $lockedSession = $this->loadSession($lockedSession);

            $this->auditService->log(
                'session_closed',
                CashRegisterSession::class,
                $lockedSession->id,
                $actor,
                $businessId,
                [
                    'status' => 'open',
                ],
                [
                    'status' => 'closed',
                    'closing_float' => (string) $lockedSession->closing_float,
                    'discrepancy' => (string) $discrepancy,
                    'denominations' => $lockedSession->denominations_at_close,
                    'register' => $lockedSession->cashRegister?->name,
                    'branch_id' => $lockedSession->cashRegister?->branch_id,
                    'total_sales' => (string) $lockedSession->total_sales,
                ]
            );

            return $lockedSession;
        });
    }

    protected function resolveBranch(string $businessId, string $branchId): Branch
    {
        /** @var Branch|null $branch */
        $branch = Branch::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($branchId);

        if (! $branch) {
            throw new DomainException('Selected branch is invalid for this business.', 422);
        }

        return $branch;
    }

    protected function loadRegister(CashRegister $cashRegister): CashRegister
    {
        return $cashRegister->load([
            'branch',
            'sessions.user',
        ])->loadCount('sessions');
    }

    protected function loadSession(CashRegisterSession $session): CashRegisterSession
    {
        return $session->load([
            'cashRegister.branch',
            'user',
        ]);
    }
}
