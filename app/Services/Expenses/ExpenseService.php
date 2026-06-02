<?php

namespace App\Services\Expenses;

use App\Exceptions\Domain\DomainException;
use App\Models\AccountTransaction;
use App\Models\ChartOfAccount;
use App\Models\Expense;
use App\Models\Journal;
use App\Models\PaymentAccount;
use App\Models\User;
use App\Repositories\Expenses\ExpenseRepository;
use App\Services\Accounting\AccountingService;
use App\Services\AuditService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ExpenseService
{
    public function __construct(
        protected ExpenseRepository $expenses,
        protected AuditService $auditService,
        protected AccountingService $accountingService,
    ) {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->expenses->paginateFiltered($filters, $user);
    }

    public function create(string $businessId, array $data, ?User $actor = null): Expense
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Expense {
            $expenseAccount = $this->resolveExpenseAccount($businessId, $data['expense_account_id']);
            $paymentAccount = $this->resolvePaymentAccount($businessId, $data['payment_account_id']);

            /** @var Expense $expense */
            $expense = $this->expenses->create([
                'business_id' => $businessId,
                'branch_id' => $data['branch_id'],
                'expense_account_id' => $expenseAccount->id,
                'payment_account_id' => $paymentAccount->id,
                'expense_date' => $data['expense_date'],
                'reference_no' => $data['reference_no'] ?? null,
                'description' => $data['description'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            $expense->load(['expenseAccount', 'paymentAccount']);

            $this->recordAccountTransaction($businessId, $expense, $paymentAccount);
            $this->postJournal($businessId, $expense, $paymentAccount, $actor);

            $this->auditService->log(
                'created',
                Expense::class,
                $expense->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($expense),
            );

            return $expense->load(['branch', 'expenseAccount', 'paymentAccount', 'creator']);
        });
    }

    public function update(string $businessId, Expense $expense, array $data, ?User $actor = null): Expense
    {
        return DB::transaction(function () use ($businessId, $expense, $data, $actor): Expense {
            /** @var Expense $lockedExpense */
            $lockedExpense = Expense::withoutGlobalScopes()
                ->with(['branch', 'expenseAccount', 'paymentAccount', 'creator'])
                ->where('business_id', $businessId)
                ->whereKey($expense->id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldValues = $this->auditPayload($lockedExpense);

            $expenseAccount = $this->resolveExpenseAccount($businessId, $data['expense_account_id']);
            $paymentAccount = $this->resolvePaymentAccount($businessId, $data['payment_account_id']);

            $this->reverseExpenseAccounting($businessId, $lockedExpense, 'Expense updated', $actor);

            $this->expenses->update($lockedExpense, [
                'branch_id' => $data['branch_id'],
                'expense_account_id' => $expenseAccount->id,
                'payment_account_id' => $paymentAccount->id,
                'expense_date' => $data['expense_date'],
                'reference_no' => $data['reference_no'] ?? null,
                'description' => $data['description'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $lockedExpense->refresh()->load(['expenseAccount', 'paymentAccount']);
            $this->recordAccountTransaction($businessId, $lockedExpense, $paymentAccount);
            $this->postJournal($businessId, $lockedExpense, $paymentAccount, $actor);

            $this->auditService->log(
                'updated',
                Expense::class,
                $lockedExpense->id,
                $actor,
                $businessId,
                $oldValues,
                $this->auditPayload($lockedExpense),
            );

            return $lockedExpense->load(['branch', 'expenseAccount', 'paymentAccount', 'creator']);
        });
    }

    public function delete(string $businessId, Expense $expense, User $actor): void
    {
        DB::transaction(function () use ($businessId, $expense, $actor): void {
            /** @var Expense $lockedExpense */
            $lockedExpense = Expense::withoutGlobalScopes()
                ->with(['branch', 'expenseAccount', 'paymentAccount', 'creator'])
                ->where('business_id', $businessId)
                ->whereKey($expense->id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldValues = $this->auditPayload($lockedExpense);

            $this->reverseExpenseAccounting($businessId, $lockedExpense, 'Expense deleted', $actor);

            $this->expenses->delete($lockedExpense);

            $this->auditService->log(
                'deleted',
                Expense::class,
                $lockedExpense->id,
                $actor,
                $businessId,
                $oldValues,
                null,
            );
        });
    }

    protected function recordAccountTransaction(string $businessId, Expense $expense, PaymentAccount $paymentAccount): void
    {
        AccountTransaction::create([
            'business_id' => $businessId,
            'payment_account_id' => $paymentAccount->id,
            'type' => 'debit',
            'amount' => $expense->amount,
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'transaction_date' => $expense->expense_date,
            'note' => 'Expense: ' . $expense->description,
        ]);
    }

    protected function reverseAccountTransaction(string $businessId, Expense $expense, string $reason): void
    {
        AccountTransaction::create([
            'business_id' => $businessId,
            'payment_account_id' => $expense->payment_account_id,
            'type' => 'credit',
            'amount' => $expense->amount,
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'transaction_date' => $expense->expense_date,
            'note' => 'Reversal for expense: '.$reason,
        ]);
    }

    protected function postJournal(string $businessId, Expense $expense, PaymentAccount $paymentAccount, ?User $actor): void
    {
        $this->accountingService->postJournal($businessId, [
            'type' => 'expense',
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'description' => $expense->description,
            'posted_at' => $expense->expense_date,
            'entries' => [
                [
                    'account_id' => $expense->expense_account_id,
                    'type' => 'debit',
                    'amount' => (float) $expense->amount,
                    'description' => $expense->description,
                ],
                [
                    'account_id' => $paymentAccount->coa_account_id,
                    'type' => 'credit',
                    'amount' => (float) $expense->amount,
                    'description' => $expense->description,
                ],
            ],
        ], $actor);
    }

    protected function reverseExpenseAccounting(string $businessId, Expense $expense, string $reason, ?User $actor): void
    {
        /** @var Journal|null $journal */
        $journal = Journal::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('type', 'expense')
            ->where('reference_type', Expense::class)
            ->where('reference_id', $expense->id)
            ->whereNull('reversed_by_id')
            ->lockForUpdate()
            ->first();

        if (! $journal) {
            throw new DomainException('The original expense journal could not be found.', 422);
        }

        $this->reverseAccountTransaction($businessId, $expense, $reason);
        $this->accountingService->reverseJournal($businessId, $journal, $reason, $actor);
    }

    protected function resolveExpenseAccount(string $businessId, string $accountId): ChartOfAccount
    {
        $account = ChartOfAccount::where('business_id', $businessId)
            ->where('id', $accountId)
            ->where('type', 'expense')
            ->first();

        if (! $account) {
            throw new DomainException('Expense account not found.', 404);
        }

        return $account;
    }

    protected function resolvePaymentAccount(string $businessId, string $accountId): PaymentAccount
    {
        $account = PaymentAccount::where('business_id', $businessId)
            ->where('id', $accountId)
            ->first();

        if (! $account) {
            throw new DomainException('Payment account not found.', 404);
        }

        if (! $account->is_active) {
            throw new DomainException('Payment account is inactive.', 422);
        }

        if (! $account->coa_account_id) {
            throw new DomainException('Payment account is not linked to a chart of account.', 422);
        }

        return $account;
    }

    protected function auditPayload(Expense $expense): array
    {
        return [
            'expense_date' => optional($expense->expense_date)->toDateString(),
            'reference_no' => $expense->reference_no,
            'description' => $expense->description,
            'amount' => (string) $expense->amount,
            'branch_id' => $expense->branch_id,
            'expense_account_id' => $expense->expense_account_id,
            'payment_account_id' => $expense->payment_account_id,
            'payment_method' => $expense->payment_method,
        ];
    }
}
