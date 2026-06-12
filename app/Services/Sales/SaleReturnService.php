<?php

namespace App\Services\Sales;

use App\Exceptions\Domain\DomainException;
use App\Models\ChartOfAccount;
use App\Models\PaymentAccount;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\User;
use App\Repositories\Sales\SaleReturnRepository;
use App\Services\Accounting\AccountingService;
use App\Services\AuditService;
use App\Services\Inventory\StockMovementService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SaleReturnService
{
    public function __construct(
        protected SaleReturnRepository $saleReturns,
        protected StockMovementService $stockMovementService,
        protected AccountingService $accountingService,
        protected AuditService $auditService,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->saleReturns->paginateFiltered($filters);
    }

    public function create(string $businessId, Sale $sale, array $data, ?User $actor = null): SaleReturn
    {
        return DB::transaction(function () use ($businessId, $sale, $data, $actor): SaleReturn {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with([
                    'items.lots.lot',
                    'items.serials.serial',
                    'returns.items',
                ])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedSale->status, ['completed', 'returned'], true)) {
                throw new DomainException('Only completed or already returned sales can accept return documents.', 422);
            }

            $linePayloads = $this->buildReturnPayloads($lockedSale, collect($data['items']));
            $totalAmount = round((float) collect($linePayloads)->sum('item.total_amount'), 2);
            $refundMethod = (string) $data['refund_method'];
            $paymentAccount = $this->resolveRefundPaymentAccount(
                $businessId,
                $refundMethod,
                $data['payment_account_id'] ?? null
            );
            $this->validateRefundSettlement($lockedSale, $totalAmount, $refundMethod);

            /** @var SaleReturn $saleReturn */
            $saleReturn = $this->saleReturns->create([
                'business_id' => $businessId,
                'sale_id' => $lockedSale->id,
                'branch_id' => $lockedSale->branch_id,
                'warehouse_id' => $lockedSale->warehouse_id,
                'return_number' => $this->generateReturnNumber($businessId),
                'status' => 'completed',
                'return_date' => $data['return_date'],
                'total_amount' => $totalAmount,
                'refund_method' => $refundMethod,
                'payment_account_id' => $paymentAccount?->id,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            foreach ($linePayloads as $linePayload) {
                /** @var SaleReturnItem $item */
                $item = $saleReturn->items()->create($linePayload['item']);
                $this->restoreInventory($businessId, $saleReturn, $item, $linePayload, $actor);
            }

            $saleReturn->load('items');
            $this->postReturnJournal($businessId, $saleReturn, $paymentAccount, $actor);
            $this->recordRefundTransaction($businessId, $saleReturn, $paymentAccount);
            $this->updateSaleAfterReturn($lockedSale, $linePayloads, $totalAmount, $refundMethod);

            $this->auditService->log(
                'sale_return_recorded',
                Sale::class,
                $lockedSale->id,
                $actor,
                $businessId,
                null,
                [
                    'status' => $lockedSale->status,
                    'payment_status' => $lockedSale->payment_status,
                    'paid_amount' => (string) $lockedSale->paid_amount,
                    'return_amount' => (string) $totalAmount,
                    'refund_method' => $saleReturn->refund_method,
                    'payment_account_id' => $saleReturn->payment_account_id,
                    'branch_id' => $lockedSale->branch_id,
                ]
            );

            return $this->loadSaleReturn($saleReturn);
        });
    }

    protected function buildReturnPayloads(Sale $sale, Collection $items): array
    {
        $saleItems = $sale->items->keyBy('id');
        $priorReturnItems = $sale->returns
            ->flatMap(fn ($return) => $return->items)
            ->groupBy('sale_item_id');

        return $items->map(function (array $item) use ($saleItems, $priorReturnItems): array {
            /** @var SaleItem|null $saleItem */
            $saleItem = $saleItems->get($item['sale_item_id']);

            if (! $saleItem) {
                throw new DomainException('One or more return items do not belong to this sale.', 422);
            }

            $quantity = round((float) $item['quantity'], 4);
            $previousReturns = collect($priorReturnItems->get($saleItem->id, []));
            $previousReturnedQty = round((float) $previousReturns->sum('quantity'), 4);
            $remainingQty = round((float) $saleItem->quantity - $previousReturnedQty, 4);

            if ($quantity > $remainingQty) {
                throw new DomainException('Return quantity exceeds the remaining sold quantity for one or more lines.', 422);
            }

            $serialIds = [];
            $lotId = null;

            if ($saleItem->serials->isNotEmpty()) {
                $serialIds = collect($item['serial_ids'] ?? [])->values()->all();
                $this->validateReturnSerials($saleItem, $serialIds, $previousReturns, $quantity);
            }

            if ($saleItem->lots->isNotEmpty()) {
                $lotId = $this->resolveReturnLotId($saleItem, $item['lot_id'] ?? null, $previousReturns, $quantity);
            }

            $lineTotal = round(((float) $saleItem->total_amount / max((float) $saleItem->quantity, 1)) * $quantity, 2);

            return [
                'item' => [
                    'sale_item_id' => $saleItem->id,
                    'product_id' => $saleItem->product_id,
                    'variation_id' => $saleItem->variation_id,
                    'quantity' => $quantity,
                    'unit_price' => $saleItem->unit_price,
                    'unit_cost' => $this->resolveReturnUnitCost($saleItem, $lotId),
                    'total_amount' => $lineTotal,
                    'lot_id' => $lotId,
                    'serial_ids' => $serialIds === [] ? null : $serialIds,
                ],
                'sale_item' => $saleItem,
                'lot_id' => $lotId,
                'serial_ids' => $serialIds,
            ];
        })->values()->all();
    }

    protected function validateReturnSerials(
        SaleItem $saleItem,
        array $serialIds,
        Collection $previousReturns,
        float $quantity
    ): void {
        if ($serialIds === []) {
            throw new DomainException('Serial-tracked sale items require serial_ids when returned.', 422);
        }

        if (count($serialIds) !== (int) round($quantity, 0)) {
            throw new DomainException('Returned serial count must match the returned quantity.', 422);
        }

        $soldSerialIds = $saleItem->serials->pluck('serial_id')->all();
        $alreadyReturnedSerialIds = $previousReturns
            ->flatMap(fn ($returnItem) => $returnItem->serial_ids ?? [])
            ->all();

        foreach ($serialIds as $serialId) {
            if (! in_array($serialId, $soldSerialIds, true)) {
                throw new DomainException('One or more returned serials do not belong to this sale line.', 422);
            }

            if (in_array($serialId, $alreadyReturnedSerialIds, true)) {
                throw new DomainException('One or more returned serials were already processed in a prior return.', 422);
            }
        }
    }

    protected function resolveReturnLotId(
        SaleItem $saleItem,
        ?string $lotId,
        Collection $previousReturns,
        float $quantity
    ): ?string {
        $lotLinks = $saleItem->lots->keyBy('lot_id');

        if ($lotLinks->count() === 1 && ! filled($lotId)) {
            $lotId = (string) $lotLinks->keys()->first();
        }

        if (! filled($lotId) || ! $lotLinks->has($lotId)) {
            throw new DomainException('Lot-tracked return items must specify a valid lot from the original sale line.', 422);
        }

        $soldLotQty = (float) $lotLinks->get($lotId)->quantity;
        $previousReturnedLotQty = (float) $previousReturns
            ->where('lot_id', $lotId)
            ->sum('quantity');

        if ($quantity > round($soldLotQty - $previousReturnedLotQty, 4)) {
            throw new DomainException('Returned lot quantity exceeds what remains from the original sale lot allocation.', 422);
        }

        return $lotId;
    }

    protected function resolveReturnUnitCost(SaleItem $saleItem, ?string $lotId): float
    {
        if ($lotId) {
            $lotLink = $saleItem->lots->firstWhere('lot_id', $lotId);

            return round((float) ($lotLink?->unit_cost ?? $saleItem->unit_cost), 4);
        }

        return round((float) $saleItem->unit_cost, 4);
    }

    protected function restoreInventory(
        string $businessId,
        SaleReturn $saleReturn,
        SaleReturnItem $item,
        array $linePayload,
        ?User $actor
    ): void {
        /** @var SaleItem $saleItem */
        $saleItem = $linePayload['sale_item'];

        if ($linePayload['serial_ids'] !== []) {
            foreach ($linePayload['serial_ids'] as $serialId) {
                $this->stockMovementService->record($businessId, [
                    'product_id' => $saleItem->product_id,
                    'variation_id' => $saleItem->variation_id,
                    'serial_id' => $serialId,
                    'quantity' => 1,
                    'unit_cost' => $item->unit_cost,
                    'warehouse_id' => $saleReturn->warehouse_id,
                    'reference_type' => SaleReturn::class,
                    'reference_id' => $saleReturn->id,
                    'notes' => $saleReturn->notes,
                    'type' => 'sale_return',
                ], $actor);
            }

            return;
        }

        $movementData = [
            'product_id' => $saleItem->product_id,
            'variation_id' => $saleItem->variation_id,
            'quantity' => $item->quantity,
            'unit_cost' => $item->unit_cost,
            'warehouse_id' => $saleReturn->warehouse_id,
            'reference_type' => SaleReturn::class,
            'reference_id' => $saleReturn->id,
            'notes' => $saleReturn->notes,
            'type' => 'sale_return',
        ];

        if ($linePayload['lot_id']) {
            $movementData['lot_id'] = $linePayload['lot_id'];
        }

        $this->stockMovementService->record($businessId, $movementData, $actor);
    }

    protected function postReturnJournal(
        string $businessId,
        SaleReturn $saleReturn,
        ?PaymentAccount $paymentAccount,
        ?User $actor
    ): void
    {
        $revenueAccount = $this->resolveAccountByCode($businessId, '4100');
        $inventoryAccount = $this->resolveAccountByCode($businessId, '1300');
        $cogsAccount = $this->resolveAccountByCode($businessId, '5100');
        $settlementAccountId = $paymentAccount?->coa_account_id
            ?? $this->resolveAccountByCode($businessId, '1200')->id;
        $costAmount = round((float) $saleReturn->items->sum(fn ($item) => (float) $item->quantity * (float) $item->unit_cost), 2);

        $this->accountingService->postJournal($businessId, [
            'type' => 'sale_return',
            'reference_type' => SaleReturn::class,
            'reference_id' => $saleReturn->id,
            'description' => 'Sale return '.$saleReturn->return_number,
            'posted_at' => $saleReturn->return_date,
            'entries' => array_values(array_filter([
                [
                    'account_id' => $revenueAccount->id,
                    'type' => 'debit',
                    'amount' => (float) $saleReturn->total_amount,
                    'description' => 'Sales return reversal',
                ],
                [
                    'account_id' => $settlementAccountId,
                    'type' => 'credit',
                    'amount' => (float) $saleReturn->total_amount,
                    'description' => $paymentAccount
                        ? 'Customer refund paid'
                        : 'Accounts receivable reduction',
                ],
                $costAmount > 0 ? [
                    'account_id' => $inventoryAccount->id,
                    'type' => 'debit',
                    'amount' => $costAmount,
                    'description' => 'Inventory restored from sale return',
                ] : null,
                $costAmount > 0 ? [
                    'account_id' => $cogsAccount->id,
                    'type' => 'credit',
                    'amount' => $costAmount,
                    'description' => 'COGS reversal from sale return',
                ] : null,
            ])),
        ], $actor);
    }

    protected function resolveRefundPaymentAccount(
        string $businessId,
        string $refundMethod,
        ?string $paymentAccountId
    ): ?PaymentAccount {
        if ($refundMethod === 'credit_note') {
            return null;
        }

        /** @var PaymentAccount|null $paymentAccount */
        $paymentAccount = PaymentAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($paymentAccountId);

        if (! $paymentAccount) {
            throw new DomainException('Select a valid payment account for this refund.', 422);
        }

        if (! $paymentAccount->is_active) {
            throw new DomainException('Refunds can only be paid from an active payment account.', 422);
        }

        if (! $paymentAccount->coa_account_id) {
            throw new DomainException('The refund payment account must be linked to a chart of account record.', 422);
        }

        $expectedType = $refundMethod === 'cash' ? 'cash' : 'bank';
        if ($paymentAccount->account_type !== $expectedType) {
            throw new DomainException(
                $refundMethod === 'cash'
                    ? 'Cash refunds require a cash payment account.'
                    : 'Bank transfer refunds require a bank payment account.',
                422
            );
        }

        return $paymentAccount;
    }

    protected function validateRefundSettlement(Sale $sale, float $returnAmount, string $refundMethod): void
    {
        $priorReturnAmount = round((float) $sale->returns->sum('total_amount'), 2);
        $netSaleAmountBeforeReturn = round(max(0, (float) $sale->total_amount - $priorReturnAmount), 2);
        $outstandingAmount = round(max(0, $netSaleAmountBeforeReturn - (float) $sale->paid_amount), 2);

        if ($refundMethod === 'credit_note' && $returnAmount > $outstandingAmount) {
            throw new DomainException(
                'Credit notes can only reduce the unpaid balance. Use cash or bank transfer for amounts already paid.',
                422
            );
        }

        if ($refundMethod !== 'credit_note' && $returnAmount > round((float) $sale->paid_amount, 2)) {
            throw new DomainException('Refund amount cannot exceed the amount paid by the customer.', 422);
        }
    }

    protected function recordRefundTransaction(
        string $businessId,
        SaleReturn $saleReturn,
        ?PaymentAccount $paymentAccount
    ): void {
        if (! $paymentAccount) {
            return;
        }

        $paymentAccount->transactions()->create([
            'business_id' => $businessId,
            'type' => 'debit',
            'amount' => $saleReturn->total_amount,
            'reference_type' => SaleReturn::class,
            'reference_id' => $saleReturn->id,
            'transaction_date' => $saleReturn->return_date,
            'note' => 'Customer refund for '.$saleReturn->return_number,
        ]);
    }

    protected function updateSaleAfterReturn(
        Sale $sale,
        array $linePayloads,
        float $returnAmount,
        string $refundMethod
    ): void {
        if ($refundMethod !== 'credit_note') {
            $sale->paid_amount = round(max(0, (float) $sale->paid_amount - $returnAmount), 2);
        }

        $returnedByItem = $sale->returns
            ->flatMap(fn ($return) => $return->items)
            ->groupBy('sale_item_id')
            ->map(fn ($items) => round((float) $items->sum('quantity'), 4));

        foreach ($linePayloads as $linePayload) {
            $saleItemId = (string) $linePayload['item']['sale_item_id'];
            $returnedByItem[$saleItemId] = round(
                (float) ($returnedByItem[$saleItemId] ?? 0) + (float) $linePayload['item']['quantity'],
                4
            );
        }

        $fullyReturned = $sale->items->every(
            fn (SaleItem $item): bool => (float) ($returnedByItem[$item->id] ?? 0) >= round((float) $item->quantity, 4)
        );
        $totalReturnedAmount = round((float) $sale->returns->sum('total_amount') + $returnAmount, 2);
        $netSaleAmount = round(max(0, (float) $sale->total_amount - $totalReturnedAmount), 2);

        $sale->status = $fullyReturned ? 'returned' : 'completed';
        $sale->payment_status = $this->resolvePaymentStatus((float) $sale->paid_amount, $netSaleAmount);
        $sale->save();
    }

    protected function resolvePaymentStatus(float $paidAmount, float $netSaleAmount): string
    {
        if ($netSaleAmount <= 0 || $paidAmount >= $netSaleAmount) {
            return 'paid';
        }

        return $paidAmount <= 0 ? 'unpaid' : 'partial';
    }

    protected function resolveAccountByCode(string $businessId, string $code): ChartOfAccount
    {
        /** @var ChartOfAccount|null $account */
        $account = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('code', $code)
            ->first();

        if (! $account) {
            throw new DomainException("Required account {$code} is missing for this business.", 422);
        }

        return $account;
    }

    protected function generateReturnNumber(string $businessId): string
    {
        $prefix = 'SRT-'.now()->format('Y').'-';

        $lastNumber = SaleReturn::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('return_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('return_number')
            ->value('return_number');

        $next = $lastNumber === null
            ? 1
            : ((int) substr($lastNumber, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $next);
    }

    protected function loadSaleReturn(SaleReturn $saleReturn): SaleReturn
    {
        return $saleReturn->load([
            'sale',
            'branch',
            'warehouse',
            'paymentAccount',
            'creator',
            'items.saleItem.product',
            'items.saleItem.variation',
            'items.lot',
        ])->loadCount('items');
    }
}
