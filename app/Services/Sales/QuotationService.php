<?php

namespace App\Services\Sales;

use App\Exceptions\Domain\DomainException;
use App\Exceptions\Domain\InvalidStateTransitionException;
use App\Models\Sale;
use App\Models\User;
use App\Repositories\Sales\SaleRepository;
use App\Services\AuditService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class QuotationService
{
    public function __construct(
        protected SaleRepository $sales,
        protected SaleService $saleService,
        protected AuditService $auditService,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->sales->paginateFiltered(array_merge($filters, [
            'type' => 'quotation',
        ]));
    }

    public function create(string $businessId, array $data, ?User $actor = null): Sale
    {
        $data['type'] = 'quotation';

        return $this->saleService->create($businessId, $data, $actor);
    }

    public function convert(string $businessId, Sale $quotation, array $data, ?User $actor = null): array
    {
        return DB::transaction(function () use ($businessId, $quotation, $data, $actor): array {
            /** @var Sale $lockedQuotation */
            $lockedQuotation = Sale::withoutGlobalScopes()
                ->with([
                    'items.lots',
                    'items.serials',
                    'warehouse',
                    'customer',
                    'priceGroup',
                ])
                ->where('business_id', $businessId)
                ->whereKey($quotation->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedQuotation->type !== 'quotation') {
                throw new DomainException('Selected sale is not a quotation.', 422);
            }

            if ($lockedQuotation->status !== 'quotation') {
                throw new InvalidStateTransitionException('Only active quotations can be converted.');
            }

            $sale = $this->saleService->create(
                $businessId,
                $this->buildConversionPayload($lockedQuotation, $data),
                $actor
            );

            $previousStatus = $lockedQuotation->status;
            $lockedQuotation->status = 'converted';
            $lockedQuotation->save();

            $lockedQuotation = $this->loadQuotation($lockedQuotation);

            $this->auditService->log(
                'state_change',
                Sale::class,
                $lockedQuotation->id,
                $actor,
                $businessId,
                [
                    'status' => $previousStatus,
                ],
                [
                    'status' => 'converted',
                    'sale_number' => $lockedQuotation->sale_number,
                    'converted_sale_id' => $sale->id,
                    'converted_sale_number' => $sale->sale_number,
                    'branch_id' => $lockedQuotation->branch_id,
                ]
            );

            return [
                'quotation' => $lockedQuotation,
                'sale' => $sale,
            ];
        });
    }

    public function cancel(string $businessId, Sale $quotation, ?string $reason = null, ?User $actor = null): Sale
    {
        if ($quotation->type !== 'quotation') {
            throw new DomainException('Selected sale is not a quotation.', 422);
        }

        return $this->saleService->cancel($businessId, $quotation, $reason, $actor);
    }

    protected function buildConversionPayload(Sale $quotation, array $data): array
    {
        return [
            'branch_id' => $quotation->branch_id,
            'warehouse_id' => $quotation->warehouse_id,
            'customer_id' => $quotation->customer_id,
            'cash_register_session_id' => $data['cash_register_session_id'] ?? null,
            'commission_agent_id' => $quotation->commission_agent_id,
            'parent_sale_id' => $quotation->id,
            'type' => $data['type'],
            'sale_date' => $data['sale_date'] ?? $quotation->sale_date?->toDateString() ?? now()->toDateString(),
            'due_date' => $data['due_date'] ?? $quotation->due_date?->toDateString(),
            'discount_type' => (float) $quotation->discount_amount > 0 ? 'fixed' : null,
            'discount_amount' => (float) $quotation->discount_amount,
            'shipping_charges' => (float) $quotation->shipping_charges,
            'price_group_id' => $quotation->price_group_id,
            'notes' => $data['notes'] ?? $quotation->notes,
            'staff_note' => $data['staff_note'] ?? $quotation->staff_note,
            'items' => $quotation->items->map(function ($item): array {
                return [
                    'product_id' => $item->product_id,
                    'variation_id' => $item->variation_id,
                    'sub_unit_id' => $item->sub_unit_id,
                    'quantity' => (float) $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'discount_type' => (float) $item->discount_amount > 0 ? 'fixed' : null,
                    'discount_amount' => (float) $item->discount_amount,
                    'tax_rate' => (float) $item->tax_rate,
                    'tax_type' => $item->tax_type,
                    'unit_cost' => (float) $item->unit_cost,
                    'notes' => $item->notes,
                    'lot_allocations' => $item->lots->map(fn ($lot) => [
                        'lot_id' => $lot->lot_id,
                        'quantity' => (float) $lot->quantity,
                    ])->values()->all(),
                    'serial_ids' => $item->serials->pluck('serial_id')->values()->all(),
                ];
            })->values()->all(),
        ];
    }

    protected function loadQuotation(Sale $quotation): Sale
    {
        return $quotation->load([
            'branch',
            'warehouse',
            'customer',
            'cashRegisterSession.cashRegister',
            'commissionAgent',
            'parentSale',
            'creator',
            'priceGroup',
            'items.product',
            'items.variation',
            'items.subUnit',
            'items.lots.lot',
            'items.serials.serial',
            'payments.paymentAccount',
            'returns',
        ])->loadCount(['payments', 'returns']);
    }
}
