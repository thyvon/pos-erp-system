<?php

namespace App\Services\Sales;

use App\Exceptions\Domain\DomainException;
use App\Exceptions\Domain\InvalidStateTransitionException;
use App\Exceptions\Domain\MaxDiscountExceededException;
use App\Exceptions\Domain\MinimumSellingPriceException;
use App\Models\Branch;
use App\Models\CashRegisterSession;
use App\Models\ChartOfAccount;
use App\Models\Customer;
use App\Models\PriceGroup;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Sale;
use App\Models\SubUnit;
use App\Models\TaxRate;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Sales\SaleRepository;
use App\Services\Accounting\AccountingService;
use App\Services\Foundation\SettingsService;
use App\Services\AuditService;
use App\Services\Inventory\StockMovementService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class SaleService
{
    public function __construct(
        protected SaleRepository $sales,
        protected SettingsService $settings,
        protected StockMovementService $stockMovementService,
        protected AccountingService $accountingService,
        protected AuditService $auditService,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->sales->paginateFiltered($filters);
    }

    public function create(string $businessId, array $data, ?User $actor = null): Sale
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Sale {
            $branch = $this->resolveBranch($businessId, $data['branch_id']);
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id'], $branch);
            $customer = $this->resolveCustomer($businessId, $data['customer_id'] ?? null);
            $priceGroup = $this->resolvePriceGroup($businessId, $data['price_group_id'] ?? null);
            $parentSale = $this->resolveParentSale($businessId, $data['parent_sale_id'] ?? null);
            $type = (string) ($data['type'] ?? 'draft');
            $taxScope = (string) ($data['tax_scope'] ?? 'line');
            $cashRegisterSession = $this->resolveCashRegisterSession(
                $data['cash_register_session_id'] ?? null,
                $branch,
                $type,
                $actor
            );
            $status = $this->initialStatus($type);
            $saleTaxContext = $this->resolveSaleTaxContext($businessId, $data);
            $linePayloads = $this->buildLinePayloads($businessId, $warehouse, collect($data['items']), $taxScope);
            $totals = $this->calculateSaleTotals(
                $linePayloads,
                $data['discount_type'] ?? null,
                (float) ($data['discount_amount'] ?? 0),
                (float) ($data['shipping_charges'] ?? 0),
                $taxScope,
                $saleTaxContext,
            );

            /** @var Sale $sale */
            $sale = $this->sales->create([
                'business_id' => $businessId,
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'customer_id' => $customer?->id,
                'cash_register_session_id' => $cashRegisterSession?->id,
                'commission_agent_id' => $this->resolveCommissionAgentId($businessId, $data['commission_agent_id'] ?? null),
                'parent_sale_id' => $parentSale?->id,
                'created_by' => $actor?->id ?? ($data['created_by'] ?? null),
                'sale_number' => $this->generateSaleNumber($businessId, $type),
                'type' => $type,
                'status' => $status,
                'payment_status' => 'unpaid',
                'delivery_status' => null,
                'is_recurring' => false,
                'sale_date' => $data['sale_date'],
                'due_date' => $data['due_date'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_type' => $data['discount_type'] ?? null,
                'discount_amount' => $totals['sale_discount_amount'],
                'tax_scope' => $taxScope,
                'tax_rate_id' => $saleTaxContext['tax_rate_id'],
                'tax_rate_type' => $saleTaxContext['tax_rate_type'],
                'tax_rate' => $saleTaxContext['tax_rate'],
                'tax_type' => $saleTaxContext['tax_type'],
                'tax_amount' => $totals['tax_amount'],
                'shipping_charges' => $totals['shipping_charges'],
                'total_amount' => $totals['total_amount'],
                'paid_amount' => 0,
                'change_amount' => 0,
                'price_group_id' => $priceGroup?->id,
                'notes' => $data['notes'] ?? null,
                'staff_note' => $data['staff_note'] ?? null,
            ]);

            foreach ($linePayloads as $linePayload) {
                $item = $sale->items()->create($linePayload['item']);

                foreach ($linePayload['lots'] as $lotPayload) {
                    $item->lots()->create($lotPayload);
                }

                foreach ($linePayload['serials'] as $serialId) {
                    $item->serials()->create([
                        'serial_id' => $serialId,
                    ]);
                }
            }

            $sale = $this->loadSale($sale);

            $this->auditService->log(
                'created',
                Sale::class,
                $sale->id,
                $actor,
                $businessId,
                null,
                [
                    'sale_number' => $sale->sale_number,
                    'status' => $sale->status,
                    'type' => $sale->type,
                    'branch_id' => $sale->branch_id,
                    'total_amount' => (string) $sale->total_amount,
                ]
            );

            return $sale;
        });
    }

    public function update(string $businessId, Sale $sale, array $data, ?User $actor = null): Sale
    {
        return DB::transaction(function () use ($businessId, $sale, $data, $actor): Sale {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with(['items.lots', 'items.serials'])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertSaleIsEditable($lockedSale);

            $previousSnapshot = [
                'type' => $lockedSale->type,
                'status' => $lockedSale->status,
                'branch_id' => $lockedSale->branch_id,
                'warehouse_id' => $lockedSale->warehouse_id,
                'customer_id' => $lockedSale->customer_id,
                'total_amount' => (string) $lockedSale->total_amount,
            ];

            if ($lockedSale->status === 'confirmed') {
                $this->releaseReservedInventory($businessId, $lockedSale);
            }

            $branch = $this->resolveBranch($businessId, $data['branch_id']);
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id'], $branch);
            $customer = $this->resolveCustomer($businessId, $data['customer_id'] ?? null);
            $priceGroup = $this->resolvePriceGroup($businessId, $data['price_group_id'] ?? null);
            $parentSale = $this->resolveParentSale($businessId, $data['parent_sale_id'] ?? $lockedSale->parent_sale_id);
            $type = (string) ($data['type'] ?? $lockedSale->type);
            $taxScope = (string) ($data['tax_scope'] ?? 'line');
            $cashRegisterSession = $this->resolveCashRegisterSession(
                $data['cash_register_session_id'] ?? null,
                $branch,
                $type,
                $actor
            );
            $status = $this->initialStatus($type);
            $saleTaxContext = $this->resolveSaleTaxContext($businessId, $data);
            $linePayloads = $this->buildLinePayloads($businessId, $warehouse, collect($data['items']), $taxScope);
            $totals = $this->calculateSaleTotals(
                $linePayloads,
                $data['discount_type'] ?? null,
                (float) ($data['discount_amount'] ?? 0),
                (float) ($data['shipping_charges'] ?? 0),
                $taxScope,
                $saleTaxContext,
            );

            $quotationStateChanged = ($lockedSale->type === 'quotation') !== ($type === 'quotation');

            $lockedSale->fill([
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'customer_id' => $customer?->id,
                'cash_register_session_id' => $cashRegisterSession?->id,
                'commission_agent_id' => $this->resolveCommissionAgentId($businessId, $data['commission_agent_id'] ?? null),
                'parent_sale_id' => $parentSale?->id,
                'sale_number' => $quotationStateChanged ? $this->generateSaleNumber($businessId, $type) : $lockedSale->sale_number,
                'type' => $type,
                'status' => $status,
                'sale_date' => $data['sale_date'],
                'due_date' => $data['due_date'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_type' => $data['discount_type'] ?? null,
                'discount_amount' => $totals['sale_discount_amount'],
                'tax_scope' => $taxScope,
                'tax_rate_id' => $saleTaxContext['tax_rate_id'],
                'tax_rate_type' => $saleTaxContext['tax_rate_type'],
                'tax_rate' => $saleTaxContext['tax_rate'],
                'tax_type' => $saleTaxContext['tax_type'],
                'tax_amount' => $totals['tax_amount'],
                'shipping_charges' => $totals['shipping_charges'],
                'total_amount' => $totals['total_amount'],
                'price_group_id' => $priceGroup?->id,
                'notes' => $data['notes'] ?? null,
                'staff_note' => $data['staff_note'] ?? null,
            ]);
            $lockedSale->save();

            foreach ($lockedSale->items as $existingItem) {
                $existingItem->lots()->delete();
                $existingItem->serials()->delete();
                $existingItem->delete();
            }

            foreach ($linePayloads as $linePayload) {
                $item = $lockedSale->items()->create($linePayload['item']);

                foreach ($linePayload['lots'] as $lotPayload) {
                    $item->lots()->create($lotPayload);
                }

                foreach ($linePayload['serials'] as $serialId) {
                    $item->serials()->create([
                        'serial_id' => $serialId,
                    ]);
                }
            }

            $lockedSale = $this->loadSale($lockedSale->fresh());

            $this->auditService->log(
                'updated',
                Sale::class,
                $lockedSale->id,
                $actor,
                $businessId,
                $previousSnapshot,
                [
                    'sale_number' => $lockedSale->sale_number,
                    'type' => $lockedSale->type,
                    'status' => $lockedSale->status,
                    'branch_id' => $lockedSale->branch_id,
                    'warehouse_id' => $lockedSale->warehouse_id,
                    'customer_id' => $lockedSale->customer_id,
                    'total_amount' => (string) $lockedSale->total_amount,
                ]
            );

            return $lockedSale;
        });
    }

    public function confirm(string $businessId, Sale $sale, ?User $actor = null): Sale
    {
        return DB::transaction(function () use ($businessId, $sale, $actor): Sale {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with(['items.lots', 'items.serials', 'warehouse', 'customer'])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedSale->status, ['draft', 'suspended'], true)) {
                throw new InvalidStateTransitionException('Only draft or suspended sales can be confirmed.');
            }

            $this->validateSaleBusinessRules($lockedSale, $actor);
            $this->reserveTrackedInventory($businessId, $lockedSale);

            $previousStatus = $lockedSale->status;
            $lockedSale->status = 'confirmed';
            $lockedSale->save();

            $lockedSale = $this->loadSale($lockedSale);
            $this->auditStateChange($lockedSale, $previousStatus, 'confirmed', $businessId, $actor);

            return $lockedSale;
        });
    }

    public function complete(string $businessId, Sale $sale, ?User $actor = null): Sale
    {
        return DB::transaction(function () use ($businessId, $sale, $actor): Sale {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with(['items.lots', 'items.serials', 'warehouse', 'customer'])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedSale->status, ['draft', 'suspended', 'confirmed'], true)) {
                throw new InvalidStateTransitionException('Only draft, suspended, or confirmed sales can be completed.');
            }

            if (in_array($lockedSale->status, ['draft', 'suspended'], true)) {
                $this->validateSaleBusinessRules($lockedSale, $actor);
                $this->reserveTrackedInventory($businessId, $lockedSale);
            }

            $this->consumeReservedInventory($businessId, $lockedSale, $actor);
            $this->postCompletionJournal($businessId, $lockedSale, $actor);

            $previousStatus = $lockedSale->status;
            $lockedSale->status = 'completed';
            $lockedSale->save();

            $lockedSale = $this->loadSale($lockedSale);
            $this->auditStateChange($lockedSale, $previousStatus, 'completed', $businessId, $actor);

            return $lockedSale;
        });
    }

    public function cancel(string $businessId, Sale $sale, ?string $reason = null, ?User $actor = null): Sale
    {
        return DB::transaction(function () use ($businessId, $sale, $reason, $actor): Sale {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with(['items.lots', 'items.serials', 'warehouse'])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedSale->status, ['draft', 'quotation', 'suspended', 'confirmed'], true)) {
                throw new InvalidStateTransitionException('This sale cannot be cancelled from its current status.');
            }

            if ($lockedSale->status === 'confirmed') {
                $this->releaseReservedInventory($businessId, $lockedSale);
            }

            $previousStatus = $lockedSale->status;
            $lockedSale->status = 'cancelled';
            $lockedSale->staff_note = $reason ?: $lockedSale->staff_note;
            $lockedSale->save();

            $lockedSale = $this->loadSale($lockedSale);
            $this->auditStateChange($lockedSale, $previousStatus, 'cancelled', $businessId, $actor, $reason);

            return $lockedSale;
        });
    }

    public function delete(string $businessId, Sale $sale, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $sale, $actor): void {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with(['items.lots', 'items.serials'])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertSaleIsEditable($lockedSale);

            if ($lockedSale->status === 'confirmed') {
                $this->releaseReservedInventory($businessId, $lockedSale);
            }

            $oldValues = [
                'sale_number' => $lockedSale->sale_number,
                'type' => $lockedSale->type,
                'status' => $lockedSale->status,
                'branch_id' => $lockedSale->branch_id,
                'warehouse_id' => $lockedSale->warehouse_id,
                'customer_id' => $lockedSale->customer_id,
                'total_amount' => (string) $lockedSale->total_amount,
            ];

            $lockedSale->delete();

            $this->auditService->log(
                'deleted',
                Sale::class,
                $lockedSale->id,
                $actor,
                $businessId,
                $oldValues,
                null
            );
        });
    }

    protected function buildLinePayloads(string $businessId, Warehouse $warehouse, Collection $items, string $taxScope = 'line'): Collection
    {
        return $items->map(function (array $item) use ($businessId, $warehouse, $taxScope): array {
            $product = $this->resolveProduct($businessId, $item['product_id']);
            $variation = $this->resolveVariation($businessId, $product, $item['variation_id'] ?? null);
            $subUnit = $this->resolveSubUnit($businessId, $product, $variation, $item['sub_unit_id'] ?? null);
            $quantity = round((float) $item['quantity'], 4);
            $inventoryQuantity = $this->inventoryQuantityFromSaleQuantity($quantity, $subUnit);
            $unitPrice = round((float) $item['unit_price'], 4);
            $discountType = $item['discount_type'] ?? null;
            $discountAmount = round((float) ($item['discount_amount'] ?? 0), 2);
            $taxType = $taxScope === 'line' ? ($item['tax_type'] ?? $product->tax_type) : null;
            $taxRateId = $taxScope === 'line' ? ($item['tax_rate_id'] ?? $product->tax_rate_id) : null;
            $taxRateType = $taxScope === 'line' ? ($item['tax_rate_type'] ?? $product->taxRate?->type ?? 'percentage') : null;
            $taxRate = $taxScope === 'line'
                ? round((float) ($item['tax_rate'] ?? $product->taxRate?->rate ?? 0), 2)
                : 0;
            $unitCost = round((float) ($item['unit_cost'] ?? $variation?->purchase_price ?? $product->purchase_price ?? 0), 4);
            $gross = round($quantity * $unitPrice, 2);
            $lineDiscount = $this->resolveDiscountAmount($discountType, $discountAmount, $gross);
            $grossAfterDiscount = max(0, round($gross - $lineDiscount, 2));
            $taxBreakdown = $taxScope === 'line'
                ? $this->calculateTaxBreakdown($grossAfterDiscount, $taxRate, $taxType, $taxRateType)
                : [
                    'base_amount' => round($grossAfterDiscount, 2),
                    'tax_amount' => 0,
                    'line_total' => round($grossAfterDiscount, 2),
                ];
            $taxableBase = $taxBreakdown['base_amount'];
            $lineTax = $taxBreakdown['tax_amount'];
            $lineTotal = $taxBreakdown['line_total'];

            $lots = collect($item['lot_allocations'] ?? [])
                ->map(function (array $lotAllocation) use ($businessId, $warehouse, $product, $variation): array {
                    $lot = $this->resolveLot($businessId, $warehouse, $product, $variation, $lotAllocation['lot_id']);

                    return [
                        'lot_id' => $lot->id,
                        'quantity' => round((float) $lotAllocation['quantity'], 4),
                        'unit_cost' => $lot->unit_cost ?? 0,
                    ];
                })
                ->values()
                ->all();

            $serials = collect($item['serial_ids'] ?? [])
                ->map(fn (string $serialId) => $this->resolveSerial($businessId, $warehouse, $product, $variation, $serialId)->id)
                ->values()
                ->all();

            $this->validateSubUnitEligibility($product, $subUnit);
            $this->validateTrackedItemShape($product, $quantity, $lots, $serials);

            return [
                'item' => [
                    'product_id' => $product->id,
                    'variation_id' => $variation?->id,
                    'sub_unit_id' => $subUnit?->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_type' => $discountType,
                    'discount_amount' => $lineDiscount,
                    'tax_rate_id' => $taxRateId,
                    'tax_rate_type' => $taxRateType,
                    'tax_rate' => $taxRate,
                    'tax_type' => $taxType,
                    'tax_amount' => $lineTax,
                    'unit_cost' => $unitCost,
                    'total_amount' => $lineTotal,
                    'notes' => $item['notes'] ?? null,
                ],
                'lots' => $lots,
                'serials' => $serials,
                'meta' => [
                    'product' => $product,
                    'variation' => $variation,
                    'inventory_quantity' => $inventoryQuantity,
                    'gross' => $gross,
                    'base_amount' => $taxableBase,
                    'discount_amount' => $lineDiscount,
                    'line_total' => $lineTotal,
                    'tax_amount' => $lineTax,
                ],
            ];
        });
    }

    protected function calculateSaleTotals(
        Collection $linePayloads,
        ?string $discountType,
        float $discountAmount,
        float $shippingCharges,
        string $taxScope = 'line',
        array $saleTaxContext = [],
    ): array
    {
        $subtotal = round((float) $linePayloads->sum(fn (array $line) => $line['meta']['base_amount']), 2);
        $resolvedSaleDiscount = $this->resolveDiscountAmount($discountType, $discountAmount, $subtotal);
        $taxableAfterSaleDiscount = max(0, round($subtotal - $resolvedSaleDiscount, 2));
        $taxAmount = $taxScope === 'sale'
            ? $this->calculateTaxBreakdown(
                $taxableAfterSaleDiscount,
                (float) ($saleTaxContext['tax_rate'] ?? 0),
                $saleTaxContext['tax_type'] ?? null,
                $saleTaxContext['tax_rate_type'] ?? null,
            )['tax_amount']
            : round((float) $linePayloads->sum(fn (array $line) => $line['meta']['tax_amount']), 2);
        $totalAmount = round($taxableAfterSaleDiscount + $taxAmount + round($shippingCharges, 2), 2);

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'sale_discount_amount' => $resolvedSaleDiscount,
            'shipping_charges' => round($shippingCharges, 2),
            'total_amount' => $totalAmount,
        ];
    }

    protected function validateSaleBusinessRules(Sale $sale, ?User $actor): void
    {
        foreach ($sale->items as $item) {
            /** @var Product $product */
            $product = Product::withoutGlobalScopes()->findOrFail($item->product_id);
            $variation = $item->variation_id
                ? ProductVariation::withoutGlobalScopes()->find($item->variation_id)
                : null;
            $subUnit = $item->sub_unit_id
                ? SubUnit::query()->find($item->sub_unit_id)
                : null;

            $minimumSellingPrice = (float) ($variation?->minimum_selling_price ?? $product->minimum_selling_price ?? 0);
            $gross = round((float) $item->quantity * (float) $item->unit_price, 2);
            $effectiveSelectedUnitPrice = $gross <= 0
                ? 0
                : round(($gross - (float) $item->discount_amount) / max((float) $item->quantity, 1), 4);
            $effectiveUnitPrice = round(
                $effectiveSelectedUnitPrice / $this->conversionFactorFromSubUnit($subUnit),
                4
            );

            if ($minimumSellingPrice > 0 && $effectiveUnitPrice < $minimumSellingPrice) {
                throw new MinimumSellingPriceException(
                    "The selling price for {$product->name} is below the allowed minimum."
                );
            }

            if ($actor && $actor->max_discount !== null) {
                $discountPercent = $this->resolveDiscountPercent($item->discount_type, (float) $item->discount_amount, $gross);

                if ($discountPercent > (float) $actor->max_discount) {
                    throw new MaxDiscountExceededException(
                        "The discount for {$product->name} exceeds the user maximum discount."
                    );
                }
            }
        }
    }

    protected function reserveTrackedInventory(string $businessId, Sale $sale): void
    {
        foreach ($sale->items as $item) {
            if ($item->serials->isNotEmpty()) {
                foreach ($item->serials as $serialLink) {
                    $this->stockMovementService->reserve($businessId, [
                        'product_id' => $item->product_id,
                        'variation_id' => $item->variation_id,
                        'serial_id' => $serialLink->serial_id,
                        'quantity' => 1,
                        'warehouse_id' => $sale->warehouse_id,
                    ]);
                }

                continue;
            }

            if ($item->lots->isNotEmpty()) {
                foreach ($item->lots as $lotLink) {
                    $this->stockMovementService->reserve($businessId, [
                        'product_id' => $item->product_id,
                        'variation_id' => $item->variation_id,
                        'lot_id' => $lotLink->lot_id,
                        'quantity' => $lotLink->quantity,
                        'warehouse_id' => $sale->warehouse_id,
                    ]);
                }

                continue;
            }

            $this->stockMovementService->reserve($businessId, [
                'product_id' => $item->product_id,
                'variation_id' => $item->variation_id,
                'quantity' => $this->inventoryQuantityFromSaleItem($item),
                'warehouse_id' => $sale->warehouse_id,
            ]);
        }
    }

    protected function releaseReservedInventory(string $businessId, Sale $sale): void
    {
        foreach ($sale->items as $item) {
            if ($item->serials->isNotEmpty()) {
                foreach ($item->serials as $serialLink) {
                    $this->stockMovementService->release($businessId, [
                        'product_id' => $item->product_id,
                        'variation_id' => $item->variation_id,
                        'serial_id' => $serialLink->serial_id,
                        'quantity' => 1,
                        'warehouse_id' => $sale->warehouse_id,
                    ]);
                }

                continue;
            }

            if ($item->lots->isNotEmpty()) {
                foreach ($item->lots as $lotLink) {
                    $this->stockMovementService->release($businessId, [
                        'product_id' => $item->product_id,
                        'variation_id' => $item->variation_id,
                        'lot_id' => $lotLink->lot_id,
                        'quantity' => $lotLink->quantity,
                        'warehouse_id' => $sale->warehouse_id,
                    ]);
                }

                continue;
            }

            $this->stockMovementService->release($businessId, [
                'product_id' => $item->product_id,
                'variation_id' => $item->variation_id,
                'quantity' => $this->inventoryQuantityFromSaleItem($item),
                'warehouse_id' => $sale->warehouse_id,
            ]);
        }
    }

    protected function consumeReservedInventory(string $businessId, Sale $sale, ?User $actor): void
    {
        foreach ($sale->items as $item) {
            if ($item->serials->isNotEmpty()) {
                foreach ($item->serials as $serialLink) {
                    $this->stockMovementService->consumeReserved($businessId, [
                        'product_id' => $item->product_id,
                        'variation_id' => $item->variation_id,
                        'serial_id' => $serialLink->serial_id,
                        'quantity' => 1,
                        'unit_cost' => $item->unit_cost,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => $sale->notes,
                        'warehouse_id' => $sale->warehouse_id,
                        'type' => 'sale',
                    ], $actor);
                }

                continue;
            }

            if ($item->lots->isNotEmpty()) {
                foreach ($item->lots as $lotLink) {
                    $this->stockMovementService->consumeReserved($businessId, [
                        'product_id' => $item->product_id,
                        'variation_id' => $item->variation_id,
                        'lot_id' => $lotLink->lot_id,
                        'quantity' => $lotLink->quantity,
                        'unit_cost' => $lotLink->unit_cost,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => $sale->notes,
                        'warehouse_id' => $sale->warehouse_id,
                        'type' => 'sale',
                    ], $actor);
                }

                continue;
            }

            $this->stockMovementService->consumeReserved($businessId, [
                'product_id' => $item->product_id,
                'variation_id' => $item->variation_id,
                'quantity' => $this->inventoryQuantityFromSaleItem($item),
                'unit_cost' => $item->unit_cost,
                'reference_type' => Sale::class,
                'reference_id' => $sale->id,
                'notes' => $sale->notes,
                'warehouse_id' => $sale->warehouse_id,
                'type' => 'sale',
            ], $actor);
        }
    }

    protected function postCompletionJournal(string $businessId, Sale $sale, ?User $actor): void
    {
        $revenueAccount = $this->resolveAccountByCode($businessId, '4100');
        $receivableAccount = $this->resolveAccountByCode($businessId, '1200');
        $inventoryAccount = $this->resolveAccountByCode($businessId, '1300');
        $cogsAccount = $this->resolveAccountByCode($businessId, '5100');
        $cogsAmount = round((float) $sale->items->sum(
            fn ($item) => $this->inventoryQuantityFromSaleItem($item) * (float) $item->unit_cost
        ), 2);

        $this->accountingService->postJournal($businessId, [
            'type' => 'sale',
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'description' => 'Sale '.$sale->sale_number.' completed',
            'entries' => array_values(array_filter([
                [
                    'account_id' => $receivableAccount->id,
                    'type' => 'debit',
                    'amount' => (float) $sale->total_amount,
                    'description' => 'Sale receivable',
                ],
                [
                    'account_id' => $revenueAccount->id,
                    'type' => 'credit',
                    'amount' => (float) $sale->total_amount,
                    'description' => 'Sales revenue',
                ],
                $cogsAmount > 0 ? [
                    'account_id' => $cogsAccount->id,
                    'type' => 'debit',
                    'amount' => $cogsAmount,
                    'description' => 'Cost of goods sold',
                ] : null,
                $cogsAmount > 0 ? [
                    'account_id' => $inventoryAccount->id,
                    'type' => 'credit',
                    'amount' => $cogsAmount,
                    'description' => 'Inventory asset reduction',
                ] : null,
            ])),
        ], $actor);
    }

    protected function auditStateChange(
        Sale $sale,
        string $previousStatus,
        string $nextStatus,
        string $businessId,
        ?User $actor,
        ?string $notes = null,
    ): void {
        $this->auditService->log(
            'state_change',
            Sale::class,
            $sale->id,
            $actor,
            $businessId,
            [
                'status' => $previousStatus,
            ],
            [
                'status' => $nextStatus,
                'sale_number' => $sale->sale_number,
                'branch_id' => $sale->branch_id,
            ],
            $notes
        );
    }

    protected function initialStatus(string $type): string
    {
        return match ($type) {
            'quotation' => 'quotation',
            'suspended' => 'suspended',
            default => 'draft',
        };
    }

    protected function generateSaleNumber(string $businessId, string $type): string
    {
        $prefix = $type === 'quotation'
            ? (string) $this->settings->get('invoice', 'quotation_prefix')
            : (string) $this->settings->get('invoice', 'prefix');

        $prefix = strtoupper(trim($prefix)) ?: ($type === 'quotation' ? 'QT' : 'INV');
        $numberPrefix = $prefix.'-'.now()->format('Y').'-';

        $lastNumber = Sale::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('sale_number', 'like', $numberPrefix.'%')
            ->lockForUpdate()
            ->orderByDesc('sale_number')
            ->value('sale_number');

        $next = $lastNumber === null
            ? 1
            : ((int) substr($lastNumber, strlen($numberPrefix))) + 1;

        return sprintf('%s%05d', $numberPrefix, $next);
    }

    protected function resolveBranch(string $businessId, string $branchId): Branch
    {
        /** @var Branch|null $branch */
        $branch = Branch::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($branchId);

        if (! $branch) {
            $this->failValidation('Selected branch is invalid for this business.');
        }

        return $branch;
    }

    protected function resolveWarehouse(string $businessId, string $warehouseId, Branch $branch): Warehouse
    {
        /** @var Warehouse|null $warehouse */
        $warehouse = Warehouse::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($warehouseId);

        if (! $warehouse) {
            $this->failValidation('Selected warehouse is invalid for this business.');
        }

        if ((string) $warehouse->branch_id !== (string) $branch->id) {
            $this->failValidation('Selected warehouse does not belong to the chosen branch.');
        }

        return $warehouse;
    }

    protected function resolveCustomer(string $businessId, ?string $customerId): ?Customer
    {
        if (! filled($customerId)) {
            return null;
        }

        /** @var Customer|null $customer */
        $customer = Customer::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($customerId);

        if (! $customer) {
            $this->failValidation('Selected customer is invalid for this business.');
        }

        return $customer;
    }

    protected function resolvePriceGroup(string $businessId, ?string $priceGroupId): ?PriceGroup
    {
        if (! filled($priceGroupId)) {
            return null;
        }

        /** @var PriceGroup|null $priceGroup */
        $priceGroup = PriceGroup::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($priceGroupId);

        if (! $priceGroup) {
            $this->failValidation('Selected price group is invalid for this business.');
        }

        return $priceGroup;
    }

    protected function resolveCashRegisterSession(
        ?string $sessionId,
        Branch $branch,
        string $type,
        ?User $actor
    ): ?CashRegisterSession
    {
        if (! filled($sessionId)) {
            if ($type === 'pos_sale' && $this->requiresCashRegisterSession()) {
                $this->failValidation('An open cash register session is required for this sale.');
            }

            return null;
        }

        /** @var CashRegisterSession|null $session */
        $session = CashRegisterSession::query()
            ->with('cashRegister')
            ->find($sessionId);

        if (! $session || ! $session->cashRegister) {
            $this->failValidation('Selected cash register session is invalid.');
        }

        if ($session->status !== 'open') {
            $this->failValidation('The selected cash register session is not open.');
        }

        if ((string) $session->cashRegister->branch_id !== (string) $branch->id) {
            $this->failValidation('The selected cash register session belongs to another branch.');
        }

        if ($actor && ! $actor->hasRole(['admin', 'super_admin']) && (string) $session->user_id !== (string) $actor->id) {
            $this->failValidation('You can only use your own open cash register session.');
        }

        return $session;
    }

    protected function resolveCommissionAgentId(string $businessId, ?string $userId): ?string
    {
        if (! filled($userId)) {
            return null;
        }

        /** @var User|null $user */
        $user = User::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($userId);

        if (! $user) {
            $this->failValidation('Selected commission agent is invalid for this business.');
        }

        return $user->id;
    }

    protected function resolveParentSale(string $businessId, ?string $saleId): ?Sale
    {
        if (! filled($saleId)) {
            return null;
        }

        /** @var Sale|null $sale */
        $sale = Sale::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($saleId);

        if (! $sale) {
            $this->failValidation('Selected parent sale is invalid for this business.');
        }

        return $sale;
    }

    protected function resolveProduct(string $businessId, string $productId): Product
    {
        /** @var Product|null $product */
        $product = Product::withoutGlobalScopes()
            ->with(['taxRate', 'unit', 'subUnit'])
            ->where('business_id', $businessId)
            ->find($productId);

        if (! $product || ! $product->is_active) {
            $this->failValidation('One or more sale products are invalid or inactive.');
        }

        return $product;
    }

    protected function resolveVariation(string $businessId, Product $product, ?string $variationId): ?ProductVariation
    {
        if (! filled($variationId)) {
            return null;
        }

        /** @var ProductVariation|null $variation */
        $variation = ProductVariation::withoutGlobalScopes()
            ->with('subUnit')
            ->where('business_id', $businessId)
            ->where('product_id', $product->id)
            ->find($variationId);

        if (! $variation || ! $variation->is_active) {
            $this->failValidation('One or more sale variations are invalid or inactive.');
        }

        return $variation;
    }

    protected function resolveSubUnit(
        string $businessId,
        Product $product,
        ?ProductVariation $variation,
        ?string $subUnitId
    ): ?SubUnit
    {
        if (! filled($subUnitId)) {
            return null;
        }

        /** @var SubUnit|null $subUnit */
        $subUnit = SubUnit::query()
            ->where('business_id', $businessId)
            ->find($subUnitId);

        if (! $subUnit) {
            $this->failValidation('Selected sub unit is invalid for this sale line.');
        }

        $expectedSubUnitId = $variation?->sub_unit_id ?: $product->sub_unit_id;

        if (! $expectedSubUnitId || (string) $expectedSubUnitId !== (string) $subUnit->id) {
            $this->failValidation('Selected sub unit is not configured for this product line.');
        }

        return $subUnit;
    }

    protected function resolveLot(string $businessId, Warehouse $warehouse, Product $product, ?ProductVariation $variation, string $lotId)
    {
        /** @var \App\Models\StockLot|null $lot */
        $lot = \App\Models\StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->when($variation, fn ($query) => $query->where('variation_id', $variation->id))
            ->find($lotId);

        if (! $lot) {
            $this->failValidation('One or more selected lots are invalid for this warehouse.');
        }

        return $lot;
    }

    protected function resolveSerial(string $businessId, Warehouse $warehouse, Product $product, ?ProductVariation $variation, string $serialId)
    {
        /** @var \App\Models\StockSerial|null $serial */
        $serial = \App\Models\StockSerial::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouse->id)
            ->where('product_id', $product->id)
            ->when($variation, fn ($query) => $query->where('variation_id', $variation->id))
            ->find($serialId);

        if (! $serial) {
            $this->failValidation('One or more selected serials are invalid for this warehouse.');
        }

        return $serial;
    }

    protected function resolveAccountByCode(string $businessId, string $code): ChartOfAccount
    {
        /** @var ChartOfAccount|null $account */
        $account = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('code', $code)
            ->first();

        if (! $account) {
            $this->failValidation("Required account {$code} is missing for this business.");
        }

        return $account;
    }

    protected function validateTrackedItemShape(Product $product, float $quantity, array $lots, array $serials): void
    {
        if ($lots !== [] && $serials !== []) {
            $this->failValidation('A sale line cannot mix lot allocations and serial allocations.');
        }

        if ($product->stock_tracking === 'lot') {
            if ($lots === []) {
                $this->failValidation("Lot tracked product {$product->name} requires lot allocations.");
            }

            $lotQuantity = round((float) collect($lots)->sum('quantity'), 4);

            if ($lotQuantity !== $quantity) {
                $this->failValidation("Lot allocation quantity must match the sale quantity for {$product->name}.");
            }
        }

        if ($product->stock_tracking === 'serial') {
            if ($serials === []) {
                $this->failValidation("Serial tracked product {$product->name} requires serial allocations.");
            }

            if (count($serials) !== (int) round($quantity, 0)) {
                $this->failValidation("Serial allocation count must match the sale quantity for {$product->name}.");
            }
        }
    }

    protected function validateSubUnitEligibility(Product $product, ?SubUnit $subUnit): void
    {
        if ($subUnit === null) {
            return;
        }

        if (in_array($product->stock_tracking, ['lot', 'serial'], true)) {
            $this->failValidation("Tracked product {$product->name} must be sold in the base unit.");
        }
    }

    protected function conversionFactorFromSubUnit(?SubUnit $subUnit): float
    {
        $factor = (float) ($subUnit?->conversion_factor ?? 1);

        return $factor > 0 ? $factor : 1.0;
    }

    protected function inventoryQuantityFromSaleQuantity(float $quantity, ?SubUnit $subUnit): float
    {
        return round($quantity * $this->conversionFactorFromSubUnit($subUnit), 4);
    }

    protected function inventoryQuantityFromSaleItem($item): float
    {
        $subUnit = $item->relationLoaded('subUnit')
            ? $item->subUnit
            : ($item->sub_unit_id ? SubUnit::query()->find($item->sub_unit_id) : null);

        return $this->inventoryQuantityFromSaleQuantity((float) $item->quantity, $subUnit);
    }

    protected function resolveDiscountAmount(?string $discountType, float $discountAmount, float $baseAmount): float
    {
        $discountAmount = round($discountAmount, 2);

        if ($discountType === 'percentage') {
            return round(($baseAmount * $discountAmount) / 100, 2);
        }

        return min($discountAmount, max(0, round($baseAmount, 2)));
    }

    protected function resolveDiscountPercent(?string $discountType, float $discountAmount, float $baseAmount): float
    {
        if ($baseAmount <= 0) {
            return 0;
        }

        if ($discountType === 'percentage') {
            return round($discountAmount, 2);
        }

        return round(($discountAmount / $baseAmount) * 100, 2);
    }

    protected function resolveSaleTaxContext(string $businessId, array $data): array
    {
        $taxRateId = $data['tax_rate_id'] ?? null;
        $taxRateRecord = null;

        if (filled($taxRateId)) {
          $taxRateRecord = TaxRate::withoutGlobalScopes()
              ->where('business_id', $businessId)
              ->find($taxRateId);

          if (! $taxRateRecord) {
              $this->failValidation('Selected sale tax rate is invalid for this business.');
          }
        }

        return [
            'tax_rate_id' => $taxRateId,
            'tax_rate_type' => $data['tax_rate_type'] ?? $taxRateRecord?->type,
            'tax_rate' => round((float) ($data['tax_rate'] ?? $taxRateRecord?->rate ?? 0), 2),
            'tax_type' => $data['tax_type'] ?? null,
        ];
    }

    protected function calculateTaxBreakdown(
        float $grossAfterDiscount,
        float $taxRate,
        ?string $taxType,
        ?string $taxRateType,
    ): array
    {
        if ($taxRate <= 0 || $grossAfterDiscount <= 0) {
            return [
                'base_amount' => round($grossAfterDiscount, 2),
                'tax_amount' => 0,
                'line_total' => round($grossAfterDiscount, 2),
            ];
        }

        if ($taxRateType === 'fixed') {
            $fixedTax = round(min($grossAfterDiscount, $taxRate), 2);

            if ($taxType === 'inclusive') {
                return [
                    'base_amount' => round(max(0, $grossAfterDiscount - $fixedTax), 2),
                    'tax_amount' => $fixedTax,
                    'line_total' => round($grossAfterDiscount, 2),
                ];
            }

            return [
                'base_amount' => round($grossAfterDiscount, 2),
                'tax_amount' => $fixedTax,
                'line_total' => round($grossAfterDiscount + $fixedTax, 2),
            ];
        }

        if ($taxType === 'inclusive') {
            $taxAmount = round($grossAfterDiscount - ($grossAfterDiscount / (1 + ($taxRate / 100))), 2);

            return [
                'base_amount' => round(max(0, $grossAfterDiscount - $taxAmount), 2),
                'tax_amount' => $taxAmount,
                'line_total' => round($grossAfterDiscount, 2),
            ];
        }

        $taxAmount = round($grossAfterDiscount * ($taxRate / 100), 2);

        return [
            'base_amount' => round($grossAfterDiscount, 2),
            'tax_amount' => $taxAmount,
            'line_total' => round($grossAfterDiscount + $taxAmount, 2),
        ];
    }

    protected function requiresCashRegisterSession(): bool
    {
        return (bool) $this->settings->get('pos', 'require_cash_register_session');
    }

    protected function assertSaleIsEditable(Sale $sale): void
    {
        if (! in_array($sale->status, ['draft', 'quotation', 'suspended', 'confirmed'], true)) {
            throw new InvalidStateTransitionException('This sale can no longer be edited.');
        }

        $lifetimeDays = $this->saleEditLifetimeDays();

        if ($lifetimeDays <= 0) {
            return;
        }

        $referenceDate = $sale->sale_date ?? $sale->created_at;

        if (! $referenceDate) {
            return;
        }

        if (now()->startOfDay()->diffInDays($referenceDate->copy()->startOfDay()) > $lifetimeDays) {
            throw new InvalidStateTransitionException('This sale is outside the allowed edit lifetime.');
        }
    }

    protected function saleEditLifetimeDays(): int
    {
        try {
            return max(0, (int) $this->settings->get('sales', 'edit_lifetime_days'));
        } catch (Throwable) {
            return 30;
        }
    }

    protected function failValidation(string $message): never
    {
        throw new DomainException($message, 422);
    }

    protected function loadSale(Sale $sale): Sale
    {
        return $sale->load([
            'branch',
            'warehouse',
            'customer',
            'cashRegisterSession.cashRegister',
            'commissionAgent',
            'parentSale',
            'creator',
            'priceGroup',
            'taxRate',
            'items.product.unit',
            'items.product.subUnit',
            'items.variation.subUnit',
            'items.subUnit',
            'items.taxRate',
            'items.lots.lot',
            'items.serials.serial',
            'payments.paymentAccount',
            'returns',
        ])->loadCount(['payments', 'returns']);
    }
}
