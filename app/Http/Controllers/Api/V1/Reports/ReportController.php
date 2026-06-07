<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Reports\CashRegistersReportRequest;
use App\Http\Requests\Reports\ExpensesReportRequest;
use App\Http\Requests\Reports\PurchasePaymentsReportRequest;
use App\Http\Requests\Reports\PurchaseReturnsReportRequest;
use App\Http\Requests\Reports\PurchasesReportRequest;
use App\Http\Requests\Reports\SalePaymentsReportRequest;
use App\Http\Requests\Reports\SalesReportRequest;
use App\Http\Requests\Reports\SalesReturnReportRequest;
use App\Http\Requests\Reports\StockReportRequest;
use App\Services\Reports\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends BaseApiController
{
    public function __construct(protected ReportService $reports)
    {
    }

    public function sales(SalesReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->sales($request->user(), $request->validated())
        );
    }

    public function salesReturns(SalesReturnReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->salesReturns($request->user(), $request->validated())
        );
    }

    public function purchases(PurchasesReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->purchases($request->user(), $request->validated())
        );
    }

    public function purchaseReturns(PurchaseReturnsReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->purchaseReturns($request->user(), $request->validated())
        );
    }

    public function salePayments(SalePaymentsReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->salePayments($request->user(), $request->validated())
        );
    }

    public function purchasePayments(PurchasePaymentsReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->purchasePayments($request->user(), $request->validated())
        );
    }

    public function stock(StockReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->stock($request->user(), $request->validated())
        );
    }

    public function expenses(ExpensesReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->expenses($request->user(), $request->validated())
        );
    }

    public function cashRegisters(CashRegistersReportRequest $request): JsonResponse
    {
        return $this->success(
            $this->reports->cashRegisters($request->user(), $request->validated())
        );
    }
}
