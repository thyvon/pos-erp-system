<?php

namespace App\Services\Purchases;

use App\Exceptions\Domain\DomainException;
use App\Models\ChartOfAccount;
use App\Models\Journal;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\SubUnit;
use App\Models\User;
use App\Repositories\Purchases\PurchaseReturnRepository;
use App\Services\Accounting\AccountingService;
use App\Services\Inventory\StockMovementService;
use App\Support\Database\PostgresAdvisoryLock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PurchaseReturnService
{
    public function __construct(
        protected PurchaseReturnRepository $purchaseReturns,
        protected StockMovementService $stockMovementService,
        protected AccountingService $accountingService,
    ) {}

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->purchaseReturns->paginateFiltered($filters, $user);
    }

    public function show(string $id, ?User $user = null): PurchaseReturn
    {
        $purchaseReturn = $this->purchaseReturns->findOrFail($id);
        $this->ensureUserCanAccessBranch($user, $purchaseReturn->branch_id);

        return $this->loadPurchaseReturn($purchaseReturn);
    }

    public function create(string $businessId, Purchase $purchase, array $data, ?User $actor = null): PurchaseReturn
    {
        return DB::transaction(function () use ($businessId, $purchase, $data, $actor): PurchaseReturn {
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with(['items.product', 'items.variation', 'items.subUnit', 'returns.items'])
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureUserCanAccessBranch($actor, $lockedPurchase->branch_id);

            if (! in_array($lockedPurchase->status, ['received', 'partially_received'], true)) {
                throw new DomainException('Only received or partially received purchases can accept return documents.', 422);
            }

            $linePayloads = $this->buildReturnPayloads($businessId, $lockedPurchase, collect($data['items']));
            $totalAmount = round((float) collect($linePayloads)->sum('item.total_amount'), 2);

            $purchaseReturn = $this->purchaseReturns->create([
                'business_id' => $businessId,
                'purchase_id' => $lockedPurchase->id,
                'branch_id' => $lockedPurchase->branch_id,
                'warehouse_id' => $lockedPurchase->warehouse_id,
                'return_number' => $this->generateReturnNumber($businessId),
                'status' => 'completed',
                'return_date' => $data['return_date'],
                'total_amount' => $totalAmount,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            foreach ($linePayloads as $linePayload) {
                $item = $purchaseReturn->items()->create($linePayload['item']);
                $this->recordReturnMovement($businessId, $purchaseReturn, $item, $linePayload, $actor);
            }

            $this->postReturnJournal($businessId, $purchaseReturn, $actor);

            return $this->loadPurchaseReturn($purchaseReturn);
        });
    }

    protected function postReturnJournal(string $businessId, PurchaseReturn $purchaseReturn, ?User $actor = null): Journal
    {
        $totalReturnAmount = round((float) $purchaseReturn->total_amount, 2);

        if ($totalReturnAmount <= 0) {
            throw new DomainException('Total return amount must be greater than zero to post a journal.', 422);
        }

        $inventoryAccount = $this->resolveAccountByCode($businessId, '1300');
        $payableAccount = $this->resolveAccountByCode($businessId, '2100');

        return $this->accountingService->postJournal($businessId, [
            'type' => 'purchase_return',
            'reference_type' => PurchaseReturn::class,
            'reference_id' => $purchaseReturn->id,
            'description' => "Purchase return for purchase {$purchaseReturn->purchase->purchase_number} (Return #{$purchaseReturn->return_number})",
            'posted_at' => $purchaseReturn->return_date,
            'entries' => [
                [
                    'account_id' => $payableAccount->id,
                    'type' => 'debit',
                    'amount' => $totalReturnAmount,
                    'description' => 'Accounts payable reduction',
                ],
                [
                    'account_id' => $inventoryAccount->id,
                    'type' => 'credit',
                    'amount' => $totalReturnAmount,
                    'description' => 'Inventory asset reduction',
                ],
            ],
        ], $actor);
    }

    protected function resolveAccountByCode(string $businessId, string $code): ChartOfAccount
    {
        $account = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('code', $code)
            ->first();

        if (! $account) {
            throw new DomainException("Required account {$code} is missing for this business.", 422);
        }

        return $account;
    }

    protected function buildReturnPayloads(string $businessId, Purchase $purchase, Collection $items): array
    {
        $purchaseItems = $purchase->items->keyBy('id');
        $priorReturnItems = $purchase->returns
            ->flatMap(fn ($return) => $return->items)
            ->groupBy('purchase_item_id');

        return $items->map(function (array $item) use ($businessId, $purchaseItems, $priorReturnItems, $purchase): array {
            $purchaseItem = $purchaseItems->get($item['purchase_item_id']);

            if (! $purchaseItem) {
                throw new DomainException('One or more return items do not belong to this purchase.', 422);
            }

            $quantity = round((float) $item['quantity'], 4);
            $receivedQuantity = (float) ($purchaseItem->received_quantity ?? $purchaseItem->quantity);
            $previousReturns = collect($priorReturnItems->get($purchaseItem->id, []));
            $previousReturnedQty = round((float) $previousReturns->sum('quantity'), 4);
            $remainingQty = round($receivedQuantity - $previousReturnedQty, 4);

            if ($quantity > $remainingQty) {
                throw new DomainException('Return quantity exceeds the remaining received quantity for one or more lines.', 422);
            }

            [$serialIds, $lotId] = $this->resolveSerialsAndLot(
                $businessId, $purchase, $purchaseItem, $item, $previousReturns, $quantity
            );

            $inventoryQuantity = $this->inventoryQuantityFromPurchaseItem($purchaseItem, $quantity);
            $baseUnitCost = $this->baseUnitCostFromPurchaseItem($purchaseItem);
            $lineTotal = round(((float) $purchaseItem->unit_cost) * $quantity, 2);

            return [
                'item' => [
                    'purchase_item_id' => $purchaseItem->id,
                    'product_id' => $purchaseItem->product_id,
                    'variation_id' => $purchaseItem->variation_id,
                    'quantity' => $quantity,
                    'unit_cost' => $purchaseItem->unit_cost,
                    'total_amount' => $lineTotal,
                    'lot_id' => $lotId,
                    'serial_ids' => $serialIds === [] ? null : $serialIds,
                ],
                'purchase_item' => $purchaseItem,
                'inventory_quantity' => $inventoryQuantity,
                'base_unit_cost' => $baseUnitCost,
                'lot_id' => $lotId,
                'serial_ids' => $serialIds,
            ];
        })->values()->all();
    }

    protected function resolveSerialsAndLot(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $purchaseItem,
        array $item,
        Collection $previousReturns,
        float $quantity
    ): array {
        $product = $purchaseItem->product;

        if ($product->stock_tracking === 'serial') {
            $serialIds = collect($item['serial_ids'] ?? [])->values()->all();

            if ($serialIds === []) {
                throw new DomainException('Serial-tracked purchase items require serial_ids when returned.', 422);
            }

            if (count($serialIds) !== (int) round($quantity, 0)) {
                throw new DomainException('Returned serial count must match the returned quantity.', 422);
            }

            $receivedSerials = StockSerial::where('purchase_item_id', $purchaseItem->id)
                ->where('business_id', $businessId)
                ->pluck('id', 'id')
                ->all();

            $alreadyReturnedSerialIds = $previousReturns
                ->flatMap(fn ($returnItem) => $returnItem->serial_ids ?? [])
                ->all();

            foreach ($serialIds as $serialId) {
                if (! isset($receivedSerials[$serialId])) {
                    throw new DomainException('One or more returned serials do not belong to this purchase line.', 422);
                }

                if (in_array($serialId, $alreadyReturnedSerialIds, true)) {
                    throw new DomainException('One or more returned serials were already processed in a prior return.', 422);
                }
            }

            return [$serialIds, null];
        }

        if ($product->stock_tracking === 'lot') {
            $lotId = $item['lot_id'] ?? null;
            $purchaseLots = StockLot::where('product_id', $purchaseItem->product_id)
                ->where('warehouse_id', $purchase->warehouse_id)
                ->where('business_id', $businessId)
                ->get()
                ->keyBy('id');

            if (! filled($lotId) || ! $purchaseLots->has($lotId)) {
                throw new DomainException('Lot-tracked return items must specify a valid lot for this product and warehouse.', 422);
            }

            $availableLotQty = (float) $purchaseLots->get($lotId)->qty_on_hand;

            if ($quantity > round($availableLotQty, 4)) {
                throw new DomainException('Returned lot quantity exceeds what is available in this lot.', 422);
            }

            return [[], $lotId];
        }

        return [[], null];
    }

    protected function recordReturnMovement(
        string $businessId,
        PurchaseReturn $purchaseReturn,
        PurchaseReturnItem $item,
        array $linePayload,
        ?User $actor
    ): void {
        $purchaseItem = $linePayload['purchase_item'];

        if ($linePayload['serial_ids'] !== []) {
            foreach ($linePayload['serial_ids'] as $serialId) {
                $this->stockMovementService->record($businessId, [
                    'product_id' => $purchaseItem->product_id,
                    'variation_id' => $purchaseItem->variation_id,
                    'serial_id' => $serialId,
                    'quantity' => 1,
                    'unit_cost' => $linePayload['base_unit_cost'],
                    'warehouse_id' => $purchaseReturn->warehouse_id,
                    'reference_type' => PurchaseReturn::class,
                    'reference_id' => $purchaseReturn->id,
                    'notes' => $purchaseReturn->notes,
                    'type' => 'purchase_return',
                ], $actor);
            }

            return;
        }

        $movementData = [
            'product_id' => $purchaseItem->product_id,
            'variation_id' => $purchaseItem->variation_id,
            'quantity' => $linePayload['inventory_quantity'],
            'unit_cost' => $linePayload['base_unit_cost'],
            'warehouse_id' => $purchaseReturn->warehouse_id,
            'reference_type' => PurchaseReturn::class,
            'reference_id' => $purchaseReturn->id,
            'notes' => $purchaseReturn->notes,
            'type' => 'purchase_return',
        ];

        if ($linePayload['lot_id']) {
            $movementData['lot_id'] = $linePayload['lot_id'];
        }

        $this->stockMovementService->record($businessId, $movementData, $actor);
    }

    protected function generateReturnNumber(string $businessId): string
    {
        PostgresAdvisoryLock::acquire('purchase-return-number:'.$businessId.':'.now()->format('Y'));

        $prefix = 'PRT-'.now()->format('Y').'-';

        $lastNumber = PurchaseReturn::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereLike('return_number', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('return_number')
            ->value('return_number');

        $next = $lastNumber === null
            ? 1
            : ((int) substr($lastNumber, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $next);
    }

    protected function ensureUserCanAccessBranch(?User $user, string $branchId): void
    {
        if ($user && ! $user->hasBranchAccess($branchId)) {
            throw new DomainException('You cannot manage purchase returns outside your assigned branches.', 403);
        }
    }

    protected function conversionFactorFromSubUnit(?SubUnit $subUnit): float
    {
        $factor = (float) ($subUnit?->conversion_factor ?? 1);

        return $factor > 0 ? $factor : 1.0;
    }

    protected function inventoryQuantityFromPurchaseItem(PurchaseItem $item, float $quantity): float
    {
        $subUnit = $item->relationLoaded('subUnit')
            ? $item->subUnit
            : ($item->sub_unit_id ? SubUnit::query()->find($item->sub_unit_id) : null);

        return round($quantity * $this->conversionFactorFromSubUnit($subUnit), 4);
    }

    protected function baseUnitCostFromPurchaseItem(PurchaseItem $item): float
    {
        $subUnit = $item->relationLoaded('subUnit')
            ? $item->subUnit
            : ($item->sub_unit_id ? SubUnit::query()->find($item->sub_unit_id) : null);

        return round((float) $item->unit_cost / $this->conversionFactorFromSubUnit($subUnit), 4);
    }

    protected function loadPurchaseReturn(PurchaseReturn $purchaseReturn): PurchaseReturn
    {
        return $purchaseReturn->load([
            'purchase',
            'branch',
            'warehouse',
            'creator',
            'items.purchaseItem.product',
            'items.purchaseItem.variation',
            'items.product',
            'items.variation',
            'items.lot',
        ])->loadCount('items');
    }
}
