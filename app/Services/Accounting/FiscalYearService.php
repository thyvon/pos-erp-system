<?php

namespace App\Services\Accounting;

use App\Exceptions\Domain\DomainException;
use App\Models\FiscalYear;
use App\Repositories\Accounting\FiscalYearRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class FiscalYearService
{
    public function __construct(protected FiscalYearRepository $fiscalYears)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->fiscalYears->paginateFiltered($filters);
    }

    public function summary(): array
    {
        return $this->fiscalYears->summary();
    }

    public function create(string $businessId, array $data): FiscalYear
    {
        return DB::transaction(function () use ($businessId, $data): FiscalYear {
            $this->ensureNoOverlap($businessId, $data['start_date'], $data['end_date']);
            $this->ensureActiveYearRule($businessId, $data['status'], null);

            /** @var FiscalYear $year */
            $year = $this->fiscalYears->create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'status' => $data['status'],
                'closed_at' => $data['status'] === 'closed' ? now() : null,
            ]);

            return $year->loadCount('journals');
        });
    }

    public function update(string $businessId, FiscalYear $fiscalYear, array $data): FiscalYear
    {
        return DB::transaction(function () use ($businessId, $fiscalYear, $data): FiscalYear {
            $this->ensureBelongsToBusiness($businessId, $fiscalYear);

            $startDate = $data['start_date'] ?? $fiscalYear->start_date->toDateString();
            $endDate = $data['end_date'] ?? $fiscalYear->end_date->toDateString();
            $status = $data['status'] ?? $fiscalYear->status;

            $this->ensureNoOverlap($businessId, $startDate, $endDate, $fiscalYear->id);
            $this->ensureActiveYearRule($businessId, $status, $fiscalYear->id);

            /** @var FiscalYear $updated */
            $updated = $this->fiscalYears->update($fiscalYear, [
                'name' => $data['name'] ?? $fiscalYear->name,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'closed_at' => $status === 'closed' ? ($fiscalYear->closed_at ?? now()) : null,
            ]);

            return $updated->loadCount('journals');
        });
    }

    public function delete(string $businessId, FiscalYear $fiscalYear): void
    {
        $this->ensureBelongsToBusiness($businessId, $fiscalYear);

        if ($fiscalYear->journals()->exists()) {
            throw new DomainException('Fiscal years with journals cannot be deleted.', 422);
        }

        $this->fiscalYears->delete($fiscalYear);
    }

    protected function ensureBelongsToBusiness(string $businessId, FiscalYear $fiscalYear): void
    {
        if ((string) $fiscalYear->business_id !== $businessId) {
            throw new DomainException('Selected fiscal year does not belong to this business.', 422);
        }
    }

    protected function ensureNoOverlap(string $businessId, string $startDate, string $endDate, ?string $ignoreId = null): void
    {
        $query = FiscalYear::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereDate('start_date', '<=', $endDate)
            ->whereDate('end_date', '>=', $startDate);

        if ($ignoreId) {
            $query->whereKeyNot($ignoreId);
        }

        if ($query->exists()) {
            throw new DomainException('Fiscal year dates cannot overlap an existing fiscal year.', 422);
        }
    }

    protected function ensureActiveYearRule(string $businessId, string $status, ?string $ignoreId): void
    {
        if ($status !== 'active') {
            return;
        }

        $query = FiscalYear::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('status', 'active');

        if ($ignoreId) {
            $query->whereKeyNot($ignoreId);
        }

        if ($query->exists()) {
            throw new DomainException('Only one active fiscal year is allowed at a time.', 422);
        }
    }
}
