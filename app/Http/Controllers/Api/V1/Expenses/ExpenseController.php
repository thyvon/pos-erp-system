<?php

namespace App\Http\Controllers\Api\V1\Expenses;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Expenses\StoreExpenseRequest;
use App\Http\Requests\Expenses\UpdateExpenseRequest;
use App\Http\Resources\Expenses\ExpenseResource;
use App\Models\Expense;
use App\Services\Expenses\ExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends BaseApiController
{
    public function __construct(protected ExpenseService $expenses)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Expense::class);

        $expenses = $this->expenses->paginate($request->only([
            'search',
            'branch_id',
            'expense_account_id',
            'payment_account_id',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($expenses, ExpenseResource::class);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $this->authorize('create', Expense::class);

        $expense = $this->expenses->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new ExpenseResource($expense), 'Expense created successfully.', 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        $this->authorize('view', $expense);

        return $this->success(new ExpenseResource(
            $expense->load(['branch', 'expenseAccount', 'paymentAccount', 'creator'])
        ));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $expense = $this->expenses->update(
            $request->user()->business_id,
            $expense,
            $request->validated(),
            $request->user()
        );

        return $this->success(new ExpenseResource($expense), 'Expense updated successfully.');
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);

        $this->expenses->delete($request->user()->business_id, $expense, $request->user());

        return $this->success(null, 'Expense deleted successfully.');
    }
}
