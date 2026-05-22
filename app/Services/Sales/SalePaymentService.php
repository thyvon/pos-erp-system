<?php

namespace App\Services\Sales;

use App\Exceptions\Domain\DomainException;
use App\Models\AccountTransaction;
use App\Models\ChartOfAccount;
use App\Models\ExchangeRate;
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

            $paymentLines = $this->paymentLines($businessId, $data);
            $receivableAccount = $this->resolveAccountByCode($businessId, '1200');
            $paymentTotal = round(array_sum(array_map(
                fn (array $line): float => round((float) $line['amount'], 2),
                $paymentLines
            )), 2);
            $outstandingAmount = $this->outstandingAmount($lockedSale);

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
                $paymentDate = $line['payment_date'] ?? $data['payment_date'];
                $paymentNote = $line['note'] ?? $data['note'] ?? null;

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
                    'payment_currency' => $paymentCurrency,
                    'payment_amount' => $enteredAmount,
                    'exchange_rate_id' => $line['exchange_rate_id'] ?? null,
                    'exchange_rate' => $line['exchange_rate'] ?? null,
                    'method' => $line['method'],
                    'gift_card_id' => $line['gift_card_id'] ?? null,
                    'reference' => $line['reference'] ?? null,
                    'payment_date' => $paymentDate,
                    'note' => $paymentNote,
                    'created_by' => $actor?->id,
                ]);

                /** @var AccountTransaction $transaction */
                $transaction = $paymentAccount->transactions()->create([
                    'business_id' => $businessId,
                    'type' => 'credit',
                    'amount' => $paymentAmount,
                    'reference_type' => SalePayment::class,
                    'reference_id' => $payment->id,
                    'transaction_date' => $paymentDate,
                    'note' => $paymentNote,
                ]);

                $journal = $this->accountingService->postJournal($businessId, [
                    'type' => 'payment_in',
                    'reference_type' => SalePayment::class,
                    'reference_id' => $payment->id,
                    'description' => 'Payment received for sale '.$lockedSale->sale_number,
                    'posted_at' => $paymentDate,
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

                $payments[] = $payment->load(['paymentAccount', 'creator']);
                $journals[] = $journal;
                $transactionIds[] = $transaction->id;
            }

            $lockedSale->paid_amount = round((float) $lockedSale->paid_amount + $paymentTotal, 2);
            $lockedSale->payment_status = $lockedSale->paid_amount >= (float) $lockedSale->total_amount
                ? 'paid'
                : 'partial';
            $lockedSale->save();

            $lockedSale = $this->loadSale($lockedSale);

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
                    'payment_id' => $payments[0]->id,
                    'payment_ids' => array_map(fn (SalePayment $payment): string => $payment->id, $payments),
                    'payment_amount' => (string) $paymentTotal,
                    'payment_count' => count($payments),
                    'payment_method' => $payments[0]->method,
                    'journal_id' => $journals[0]->id,
                    'journal_ids' => array_map(fn ($journal): string => $journal->id, $journals),
                    'transaction_id' => $transactionIds[0],
                    'transaction_ids' => $transactionIds,
                    'branch_id' => $lockedSale->branch_id,
                ]
            );

            return [
                'sale' => $lockedSale,
                'payment' => $payments[0],
                'payments' => collect($payments),
                'journal' => $journals[0],
                'journals' => collect($journals),
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
            'gift_card_id' => $data['gift_card_id'] ?? null,
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
            'gift_card_id' => $line['gift_card_id'] ?? null,
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
