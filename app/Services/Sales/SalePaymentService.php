<?php

namespace App\Services\Sales;

use App\Exceptions\Domain\DomainException;
use App\Models\AccountTransaction;
use App\Models\ChartOfAccount;
use App\Models\PaymentAccount;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use App\Services\Accounting\AccountingService;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class SalePaymentService
{
    public function __construct(
        protected AccountingService $accountingService,
        protected AuditService $auditService,
    ) {
    }

    public function record(string $businessId, Sale $sale, array $data, ?User $actor = null): array
    {
        return DB::transaction(function () use ($businessId, $sale, $data, $actor): array {
            /** @var Sale $lockedSale */
            $lockedSale = Sale::withoutGlobalScopes()
                ->with(['payments.paymentAccount'])
                ->where('business_id', $businessId)
                ->whereKey($sale->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedSale->status !== 'completed') {
                throw new DomainException('Payments can only be recorded for completed sales.', 422);
            }

            $paymentAccount = $this->resolvePaymentAccount($businessId, $data['payment_account_id']);
            $receivableAccount = $this->resolveAccountByCode($businessId, '1200');
            $paymentAmount = round((float) $data['amount'], 2);
            $outstandingAmount = $this->outstandingAmount($lockedSale);

            if ($paymentAmount > $outstandingAmount) {
                throw new DomainException('Payment amount cannot exceed the outstanding balance.', 422);
            }

            if (! $paymentAccount->is_active) {
                throw new DomainException('Payments can only be recorded to active payment accounts.', 422);
            }

            if (! $paymentAccount->coa_account_id) {
                throw new DomainException('The selected payment account must be linked to a chart of account record.', 422);
            }

            /** @var SalePayment $payment */
            $payment = $lockedSale->payments()->create([
                'business_id' => $businessId,
                'payment_account_id' => $paymentAccount->id,
                'amount' => $paymentAmount,
                'method' => $data['method'],
                'gift_card_id' => $data['gift_card_id'] ?? null,
                'reference' => $data['reference'] ?? null,
                'payment_date' => $data['payment_date'],
                'note' => $data['note'] ?? null,
                'created_by' => $actor?->id,
            ]);

            /** @var AccountTransaction $transaction */
            $transaction = $paymentAccount->transactions()->create([
                'business_id' => $businessId,
                'type' => 'credit',
                'amount' => $paymentAmount,
                'reference_type' => SalePayment::class,
                'reference_id' => $payment->id,
                'transaction_date' => $data['payment_date'],
                'note' => $data['note'] ?? null,
            ]);

            $journal = $this->accountingService->postJournal($businessId, [
                'type' => 'payment_in',
                'reference_type' => SalePayment::class,
                'reference_id' => $payment->id,
                'description' => 'Payment received for sale '.$lockedSale->sale_number,
                'posted_at' => $data['payment_date'],
                'entries' => [
                    [
                        'account_id' => $paymentAccount->coa_account_id,
                        'type' => 'debit',
                        'amount' => $paymentAmount,
                        'description' => 'Payment received',
                    ],
                    [
                        'account_id' => $receivableAccount->id,
                        'type' => 'credit',
                        'amount' => $paymentAmount,
                        'description' => 'Accounts receivable settlement',
                    ],
                ],
            ], $actor);

            $lockedSale->paid_amount = round((float) $lockedSale->paid_amount + $paymentAmount, 2);
            $lockedSale->payment_status = $lockedSale->paid_amount >= (float) $lockedSale->total_amount
                ? 'paid'
                : 'partial';
            $lockedSale->save();

            $lockedSale = $this->loadSale($lockedSale);
            $payment = $payment->load(['paymentAccount', 'creator']);

            $this->auditService->log(
                'payment_recorded',
                Sale::class,
                $lockedSale->id,
                $actor,
                $businessId,
                [
                    'payment_status' => $sale->payment_status,
                    'paid_amount' => (string) $sale->paid_amount,
                ],
                [
                    'payment_status' => $lockedSale->payment_status,
                    'paid_amount' => (string) $lockedSale->paid_amount,
                    'payment_id' => $payment->id,
                    'payment_amount' => (string) $paymentAmount,
                    'payment_method' => $payment->method,
                    'payment_account' => $paymentAccount->name,
                    'journal_id' => $journal->id,
                    'transaction_id' => $transaction->id,
                    'branch_id' => $lockedSale->branch_id,
                ]
            );

            return [
                'sale' => $lockedSale,
                'payment' => $payment,
                'journal' => $journal,
            ];
        });
    }

    protected function resolvePaymentAccount(string $businessId, string $paymentAccountId): PaymentAccount
    {
        /** @var PaymentAccount|null $paymentAccount */
        $paymentAccount = PaymentAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($paymentAccountId);

        if (! $paymentAccount) {
            throw new DomainException('Selected payment account is invalid for this business.', 422);
        }

        return $paymentAccount;
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

    protected function outstandingAmount(Sale $sale): float
    {
        return round(max(0, (float) $sale->total_amount - (float) $sale->paid_amount), 2);
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
