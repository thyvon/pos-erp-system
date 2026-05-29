<?php

namespace App\Services\Purchases;

use App\Exceptions\Domain\DomainException;
use App\Models\AccountTransaction;
use App\Models\ChartOfAccount;
use App\Models\ExchangeRate;
use App\Models\Journal;
use App\Models\PaymentAccount;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\User;
use App\Services\Accounting\AccountingService;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class PurchasePaymentService
{
    public function __construct(
        protected AccountingService $accountingService,
        protected AuditService $auditService,
    ) {
    }

    public function record(string $businessId, Purchase $purchase, array $data, ?User $actor = null): array
    {
        return DB::transaction(function () use ($businessId, $purchase, $data, $actor): array {
            /** @var Purchase $lockedPurchase */
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with(['payments.paymentAccount'])
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['confirmed', 'partially_received', 'received'], true)) {
                throw new DomainException('Payments can only be recorded for confirmed or received purchases.', 422);
            }

            if (! in_array($lockedPurchase->payment_status, ['unpaid', 'partial'], true)) {
                throw new DomainException('This purchase is already fully paid.', 422);
            }

            $paymentLines = $this->paymentLines($businessId, $data);
            $result = $this->applyPaymentLines($businessId, $lockedPurchase, $paymentLines, $actor);

            $lockedPurchase = $this->loadPurchase($lockedPurchase);

            $this->auditService->log(
                'payment_recorded',
                Purchase::class,
                $lockedPurchase->id,
                $actor,
                $businessId,
                [
                    'payment_status' => $purchase->payment_status,
                    'paid_amount' => (string) $purchase->paid_amount,
                ],
                [
                    'payment_status' => $lockedPurchase->payment_status,
                    'paid_amount' => (string) $lockedPurchase->paid_amount,
                    'payment_id' => $result['payments'][0]->id,
                    'payment_ids' => array_map(fn (PurchasePayment $payment): string => $payment->id, $result['payments']),
                    'payment_amount' => (string) $result['payment_total'],
                    'payment_count' => count($result['payments']),
                    'payment_method' => $result['payments'][0]->method,
                    'journal_id' => $result['journals'][0]->id,
                    'journal_ids' => array_map(fn (Journal $journal): string => $journal->id, $result['journals']),
                    'transaction_id' => $result['transaction_ids'][0],
                    'transaction_ids' => $result['transaction_ids'],
                    'branch_id' => $lockedPurchase->branch_id,
                ]
            );

            return [
                'purchase' => $lockedPurchase,
                'payment' => $result['payments'][0],
                'payments' => collect($result['payments']),
                'journal' => $result['journals'][0],
                'journals' => collect($result['journals']),
            ];
        });
    }

    public function correct(string $businessId, Purchase $purchase, PurchasePayment $purchasePayment, array $data, ?User $actor = null): array
    {
        return DB::transaction(function () use ($businessId, $purchase, $purchasePayment, $data, $actor): array {
            /** @var Purchase $lockedPurchase */
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with(['payments.paymentAccount'])
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['confirmed', 'partially_received', 'received'], true)) {
                throw new DomainException('Payments can only be corrected for confirmed or received purchases.', 422);
            }

            /** @var PurchasePayment $lockedPayment */
            $lockedPayment = PurchasePayment::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->whereKey($purchasePayment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ((string) $lockedPayment->purchase_id !== (string) $lockedPurchase->id) {
                throw new DomainException('The selected payment does not belong to this purchase.', 422);
            }

            if (($lockedPayment->status ?? 'completed') !== 'completed') {
                throw new DomainException('Only completed payment records can be edited.', 422);
            }

            $previousPurchaseState = [
                'payment_status' => $lockedPurchase->payment_status,
                'paid_amount' => (string) $lockedPurchase->paid_amount,
            ];

            $reversalReason = (string) $data['reason'];
            $reversalJournal = $this->reversePayment($businessId, $lockedPurchase, $lockedPayment, $reversalReason, $actor);
            $paymentLine = $this->normalizePaymentLine($businessId, $data, $data);
            $replacement = $this->applyPaymentLines($businessId, $lockedPurchase, [$paymentLine], $actor, $lockedPayment);

            $lockedPurchase = $this->loadPurchase($lockedPurchase);
            $reversedPayment = $lockedPayment->fresh(['paymentAccount', 'creator', 'reverser', 'replacedPayment']);

            $this->auditService->log(
                'updated',
                PurchasePayment::class,
                $lockedPayment->id,
                $actor,
                $businessId,
                [
                    'payment_account_id' => $lockedPayment->payment_account_id,
                    'amount' => (string) $lockedPayment->amount,
                    'method' => $lockedPayment->method,
                    'reference' => $lockedPayment->reference,
                    'payment_date' => optional($lockedPayment->payment_date)->toDateString(),
                    'purchase_payment_status' => 'completed',
                    ...$previousPurchaseState,
                ],
                [
                    'purchase_id' => $lockedPurchase->id,
                    'replacement_payment_id' => $replacement['payments'][0]->id,
                    'reversal_journal_id' => $reversalJournal->id,
                    'journal_id' => $replacement['journals'][0]->id,
                    'payment_status' => $lockedPurchase->payment_status,
                    'paid_amount' => (string) $lockedPurchase->paid_amount,
                    'reason' => $reversalReason,
                ]
            );

            return [
                'purchase' => $lockedPurchase,
                'payment' => $replacement['payments'][0],
                'reversed_payment' => $reversedPayment,
                'journal' => $replacement['journals'][0],
                'reversal_journal' => $reversalJournal,
            ];
        });
    }

    public function remove(string $businessId, Purchase $purchase, PurchasePayment $purchasePayment, string $reason, ?User $actor = null): array
    {
        return DB::transaction(function () use ($businessId, $purchase, $purchasePayment, $reason, $actor): array {
            /** @var Purchase $lockedPurchase */
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with(['payments.paymentAccount'])
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['confirmed', 'partially_received', 'received'], true)) {
                throw new DomainException('Payments can only be deleted for confirmed or received purchases.', 422);
            }

            /** @var PurchasePayment $lockedPayment */
            $lockedPayment = PurchasePayment::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->whereKey($purchasePayment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ((string) $lockedPayment->purchase_id !== (string) $lockedPurchase->id) {
                throw new DomainException('The selected payment does not belong to this purchase.', 422);
            }

            if (($lockedPayment->status ?? 'completed') !== 'completed') {
                throw new DomainException('Only completed payment records can be deleted.', 422);
            }

            $previousPurchaseState = [
                'payment_status' => $lockedPurchase->payment_status,
                'paid_amount' => (string) $lockedPurchase->paid_amount,
            ];

            $reversalReason = trim($reason) !== '' ? trim($reason) : 'Payment line removed';
            $reversalJournal = $this->reversePayment($businessId, $lockedPurchase, $lockedPayment, $reversalReason, $actor);
            $lockedPurchase = $this->loadPurchase($lockedPurchase);
            $reversedPayment = $lockedPayment->fresh(['paymentAccount', 'creator', 'reverser', 'replacedPayment']);

            $this->auditService->log(
                'deleted',
                PurchasePayment::class,
                $lockedPayment->id,
                $actor,
                $businessId,
                [
                    'payment_account_id' => $lockedPayment->payment_account_id,
                    'amount' => (string) $lockedPayment->amount,
                    'method' => $lockedPayment->method,
                    'reference' => $lockedPayment->reference,
                    'payment_date' => optional($lockedPayment->payment_date)->toDateString(),
                    'purchase_payment_status' => 'completed',
                    ...$previousPurchaseState,
                ],
                [
                    'purchase_id' => $lockedPurchase->id,
                    'reversal_journal_id' => $reversalJournal->id,
                    'payment_status' => $lockedPurchase->payment_status,
                    'paid_amount' => (string) $lockedPurchase->paid_amount,
                    'reason' => $reversalReason,
                ]
            );

            return [
                'purchase' => $lockedPurchase,
                'reversed_payment' => $reversedPayment,
                'reversal_journal' => $reversalJournal,
            ];
        });
    }

    protected function paymentLines(string $businessId, array $data): array
    {
        if (! empty($data['payments']) && is_array($data['payments'])) {
            return array_map(
                fn (array $line): array => $this->normalizePaymentLine($businessId, $line, $data),
                $data['payments']
            );
        }

        return [$this->normalizePaymentLine($businessId, [
            'payment_account_id' => $data['payment_account_id'],
            'amount' => $data['amount'],
            'payment_currency' => $data['payment_currency'] ?? 'USD',
            'payment_amount' => $data['payment_amount'] ?? $data['amount'],
            'exchange_rate_id' => $data['exchange_rate_id'] ?? null,
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'payment_date' => $data['payment_date'],
            'note' => $data['note'] ?? null,
        ], $data)];
    }

    protected function normalizePaymentLine(string $businessId, array $line, array $data): array
    {
        $paymentCurrency = strtoupper((string) ($line['payment_currency'] ?? $data['payment_currency'] ?? 'USD'));
        $enteredAmount = round((float) ($line['payment_amount'] ?? $line['amount'] ?? 0), 2);
        $exchangeRate = null;
        $exchangeRateId = null;

        if ($paymentCurrency === 'KHR') {
            $rate = $this->resolveExchangeRate($businessId, $line['exchange_rate_id'] ?? null);
            $exchangeRate = round((float) $rate->rate, 6);
            $exchangeRateId = $rate->id;
            $amount = round($enteredAmount / $exchangeRate, 2);
        } else {
            $paymentCurrency = 'USD';
            $amount = round((float) ($line['amount'] ?? $enteredAmount), 2);
            $enteredAmount = round((float) ($line['payment_amount'] ?? $amount), 2);
        }

        if ($enteredAmount <= 0 || $amount <= 0) {
            throw new DomainException('Payment amount must be greater than zero.', 422);
        }

        return [
            'payment_account_id' => $line['payment_account_id'],
            'amount' => $amount,
            'payment_currency' => $paymentCurrency,
            'payment_amount' => $enteredAmount,
            'exchange_rate_id' => $exchangeRateId,
            'exchange_rate' => $exchangeRate,
            'method' => $line['method'],
            'reference' => $line['reference'] ?? null,
            'payment_date' => $line['payment_date'] ?? $data['payment_date'],
            'note' => $line['note'] ?? $data['note'] ?? null,
        ];
    }

    protected function resolveExchangeRate(string $businessId, ?string $exchangeRateId): ExchangeRate
    {
        $query = ExchangeRate::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->where('from_currency', 'USD')
            ->where('to_currency', 'KHR');

        if ($exchangeRateId) {
            /** @var ExchangeRate|null $rate */
            $rate = (clone $query)->whereKey($exchangeRateId)->first();

            if (! $rate) {
                throw new DomainException('Selected exchange rate is invalid for this business.', 422);
            }

            return $rate;
        }

        /** @var ExchangeRate|null $rate */
        $rate = (clone $query)
            ->where('is_default', true)
            ->first()
            ?? $query
                ->orderByDesc('effective_date')
                ->orderByDesc('created_at')
                ->first();

        if (! $rate) {
            throw new DomainException('A default USD to KHR exchange rate is required before recording KHR payments.', 422);
        }

        return $rate;
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

    protected function outstandingAmount(Purchase $purchase): float
    {
        return round(max(0, (float) $purchase->total_amount - (float) $purchase->paid_amount), 2);
    }

    protected function applyPaymentLines(
        string $businessId,
        Purchase $purchase,
        array $paymentLines,
        ?User $actor = null,
        ?PurchasePayment $replacedPayment = null
    ): array {
        $payableAccount = $this->resolveAccountByCode($businessId, '2100');
        $paymentTotal = round(array_sum(array_map(
            fn (array $line): float => round((float) $line['amount'], 2),
            $paymentLines
        )), 2);
        $outstandingAmount = $this->outstandingAmount($purchase);

        if ($paymentTotal > $outstandingAmount) {
            throw new DomainException('Payment amount cannot exceed the outstanding balance.', 422);
        }

        $payments = [];
        $journals = [];
        $transactionIds = [];

        foreach ($paymentLines as $line) {
            $paymentAccount = $this->resolvePaymentAccount($businessId, $line['payment_account_id']);
            $paymentAmount = round((float) $line['amount'], 2);
            $paymentCurrency = $line['payment_currency'];
            $enteredAmount = round((float) $line['payment_amount'], 2);
            $paymentDate = $line['payment_date'];
            $paymentNote = $line['note'] ?? null;

            if (! $paymentAccount->is_active) {
                throw new DomainException('Payments can only be recorded to active payment accounts.', 422);
            }

            if (! $paymentAccount->coa_account_id) {
                throw new DomainException('The selected payment account must be linked to a chart of account record.', 422);
            }

            /** @var PurchasePayment $payment */
            $payment = $purchase->payments()->create([
                'business_id' => $businessId,
                'payment_account_id' => $paymentAccount->id,
                'amount' => $paymentAmount,
                'payment_currency' => $paymentCurrency,
                'payment_amount' => $enteredAmount,
                'exchange_rate_id' => $line['exchange_rate_id'] ?? null,
                'exchange_rate' => $line['exchange_rate'] ?? null,
                'method' => $line['method'],
                'reference' => $line['reference'] ?? null,
                'payment_date' => $paymentDate,
                'note' => $paymentNote,
                'status' => 'completed',
                'replaces_payment_id' => $replacedPayment?->id,
                'created_by' => $actor?->id,
            ]);

            /** @var AccountTransaction $transaction */
            $transaction = $paymentAccount->transactions()->create([
                'business_id' => $businessId,
                'type' => 'credit',
                'amount' => $paymentAmount,
                'reference_type' => PurchasePayment::class,
                'reference_id' => $payment->id,
                'transaction_date' => $paymentDate,
                'note' => $paymentNote,
            ]);

            $journal = $this->accountingService->postJournal($businessId, [
                'type' => 'payment_out',
                'reference_type' => PurchasePayment::class,
                'reference_id' => $payment->id,
                'description' => 'Payment made for purchase '.$purchase->purchase_number,
                'posted_at' => $paymentDate,
                'entries' => [
                    [
                        'account_id' => $payableAccount->id,
                        'type' => 'debit',
                        'amount' => $paymentAmount,
                        'description' => 'Accounts payable settlement',
                    ],
                    [
                        'account_id' => $paymentAccount->coa_account_id,
                        'type' => 'credit',
                        'amount' => $paymentAmount,
                        'description' => 'Payment made',
                    ],
                ],
            ], $actor);

            $payments[] = $payment->load(['paymentAccount', 'creator', 'reverser', 'replacedPayment']);
            $journals[] = $journal;
            $transactionIds[] = $transaction->id;
        }

        $purchase->paid_amount = round((float) $purchase->paid_amount + $paymentTotal, 2);
        $purchase->payment_status = $purchase->paid_amount >= (float) $purchase->total_amount
            ? 'paid'
            : 'partial';
        $purchase->save();

        return [
            'payments' => $payments,
            'journals' => $journals,
            'payment_total' => $paymentTotal,
            'transaction_ids' => $transactionIds,
        ];
    }

    protected function reversePayment(
        string $businessId,
        Purchase $purchase,
        PurchasePayment $payment,
        string $reason,
        ?User $actor = null
    ): Journal {
        $paymentAccount = $this->resolvePaymentAccount($businessId, $payment->payment_account_id);

        if (! $paymentAccount->coa_account_id) {
            throw new DomainException('The selected payment account must be linked to a chart of account record.', 422);
        }

        /** @var Journal|null $journal */
        $journal = Journal::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('type', 'payment_out')
            ->where('reference_type', PurchasePayment::class)
            ->where('reference_id', $payment->id)
            ->whereNull('reversed_by_id')
            ->lockForUpdate()
            ->first();

        if (! $journal) {
            throw new DomainException('The original payment journal could not be found.', 422);
        }

        $paymentAccount->transactions()->create([
            'business_id' => $businessId,
            'type' => 'debit',
            'amount' => round((float) $payment->amount, 2),
            'reference_type' => PurchasePayment::class,
            'reference_id' => $payment->id,
            'transaction_date' => $dataDate = optional($payment->payment_date)->toDateString() ?? now()->toDateString(),
            'note' => 'Reversal for purchase payment correction: '.$reason,
        ]);

        $reversalJournal = $this->accountingService->reverseJournal(
            $businessId,
            $journal,
            'Purchase payment correction: '.$reason,
            $actor
        );

        $payment->status = 'reversed';
        $payment->reversed_by = $actor?->id;
        $payment->reversed_at = now();
        $payment->reversal_reason = $reason;
        $payment->save();

        $purchase->paid_amount = round(max(0, (float) $purchase->paid_amount - (float) $payment->amount), 2);
        $purchase->payment_status = $purchase->paid_amount <= 0
            ? 'unpaid'
            : ($purchase->paid_amount >= (float) $purchase->total_amount ? 'paid' : 'partial');
        $purchase->save();

        return $reversalJournal;
    }

    protected function loadPurchase(Purchase $purchase): Purchase
    {
        return $purchase->load([
            'branch',
            'warehouse.branch',
            'supplier',
            'creator',
            'receiver',
            'items.product.unit',
            'items.variation',
            'items.subUnit',
            'payments.paymentAccount',
            'payments.replacedPayment',
            'payments.reverser',
        ]);
    }
}
