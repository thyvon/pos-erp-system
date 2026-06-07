'use client'

import { Box } from '@mui/material'
import type { TFunction } from 'i18next'
import {
  AccountBalanceWalletOutlined,
  CheckCircleOutlined,
  DangerCircleOutlined,
  Inventory2Outlined,
  PaymentsOutlined,
  ReceiptLongOutlined,
  TrendingUpOutlined,
} from '@/components/ui/icons'
import { formatMoney } from '@/utils/formatMoney'
import type {
  CashRegistersReportSummary,
  ExpensesReportSummary,
  PurchasePaymentsReportSummary,
  PurchaseReturnsReportSummary,
  PurchasesReportSummary,
  SalePaymentsReportSummary,
  SalesReportSummary,
  SalesReturnReportSummary,
  StockReportSummary,
} from '@/types/report'
import type { ReportType } from '../reportConfig'
import { SummaryCard } from './SummaryCard'

interface ReportSummaryCardsProps {
  reportType: ReportType
  t: TFunction<['reports', 'common']>
  currencyFormatter: Intl.NumberFormat
  salesSummary?: SalesReportSummary
  salesReturnSummary?: SalesReturnReportSummary
  purchasesSummary?: PurchasesReportSummary
  purchaseReturnsSummary?: PurchaseReturnsReportSummary
  salePaymentsSummary?: SalePaymentsReportSummary
  purchasePaymentsSummary?: PurchasePaymentsReportSummary
  stockSummary?: StockReportSummary
  expensesSummary?: ExpensesReportSummary
  cashRegistersSummary?: CashRegistersReportSummary
}

export function ReportSummaryCards({
  reportType,
  t,
  currencyFormatter,
  salesSummary,
  salesReturnSummary,
  purchasesSummary,
  purchaseReturnsSummary,
  salePaymentsSummary,
  purchasePaymentsSummary,
  stockSummary,
  expensesSummary,
  cashRegistersSummary,
}: ReportSummaryCardsProps) {
  const countLabel =
    reportType === 'sales'
      ? 'summary.sales'
      : reportType === 'salesReturns'
        ? 'summary.salesReturns'
        : reportType === 'purchases'
          ? 'summary.purchases'
          : reportType === 'purchaseReturns'
            ? 'summary.purchaseReturns'
            : reportType === 'salePayments'
              ? 'summary.salePayments'
              : reportType === 'purchasePayments'
                ? 'summary.purchasePayments'
                : reportType === 'stock'
                  ? 'summary.stock'
                  : reportType === 'expenses'
                    ? 'summary.expenses'
                    : 'summary.cashRegisters'
  const totalLabel =
    reportType === 'sales'
      ? 'summary.total'
      : reportType === 'salesReturns'
        ? 'summary.returnedTotal'
        : reportType === 'purchases'
          ? 'summary.purchaseTotal'
          : reportType === 'purchaseReturns'
            ? 'summary.purchaseReturnedTotal'
            : reportType === 'salePayments'
              ? 'summary.collectedTotal'
              : reportType === 'purchasePayments'
                ? 'summary.paidOutTotal'
                : reportType === 'stock'
                  ? 'summary.onHand'
                  : reportType === 'expenses'
                    ? 'summary.expenseTotal'
                    : 'summary.registerSales'
  const countValue =
    reportType === 'sales'
      ? salesSummary?.count ?? 0
      : reportType === 'salesReturns'
        ? salesReturnSummary?.count ?? 0
        : reportType === 'purchases'
          ? purchasesSummary?.count ?? 0
          : reportType === 'purchaseReturns'
            ? purchaseReturnsSummary?.count ?? 0
            : reportType === 'salePayments'
              ? salePaymentsSummary?.count ?? 0
              : reportType === 'purchasePayments'
                ? purchasePaymentsSummary?.count ?? 0
                : reportType === 'stock'
                  ? stockSummary?.count ?? 0
                  : reportType === 'expenses'
                    ? expensesSummary?.count ?? 0
                    : cashRegistersSummary?.count ?? 0
  const totalValue =
    reportType === 'stock'
      ? stockSummary?.on_hand_quantity ?? '0.0000'
      : formatMoney(
          reportType === 'sales'
            ? salesSummary?.total_amount
            : reportType === 'salesReturns'
              ? salesReturnSummary?.total_amount
              : reportType === 'purchases'
                ? purchasesSummary?.total_amount
                : reportType === 'purchaseReturns'
                  ? purchaseReturnsSummary?.total_amount
                  : reportType === 'salePayments'
                    ? salePaymentsSummary?.total_amount
                    : reportType === 'purchasePayments'
                      ? purchasePaymentsSummary?.total_amount
                      : reportType === 'expenses'
                        ? expensesSummary?.total_amount
                        : cashRegistersSummary?.total_sales,
          currencyFormatter,
        )
  const countIcon = reportType === 'stock' ? Inventory2Outlined : ReceiptLongOutlined
  const totalIcon =
    reportType === 'stock'
      ? Inventory2Outlined
      : reportType === 'salePayments' || reportType === 'purchasePayments' || reportType === 'cashRegisters'
        ? PaymentsOutlined
        : TrendingUpOutlined

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(auto-fit, minmax(190px, 1fr))',
        },
      }}
    >
      <SummaryCard label={t(countLabel)} value={countValue} icon={countIcon} />
      <SummaryCard label={t(totalLabel)} value={totalValue} icon={totalIcon} color="info" />
      {reportType === 'stock' && (
        <>
          <SummaryCard
            label={t('summary.reserved')}
            value={stockSummary?.reserved_quantity ?? '0.0000'}
            icon={AccountBalanceWalletOutlined}
            color="warning"
          />
          <SummaryCard
            label={t('summary.available')}
            value={stockSummary?.available_quantity ?? '0.0000'}
            icon={CheckCircleOutlined}
            color="success"
          />
          <SummaryCard
            label={t('summary.lowStock')}
            value={stockSummary?.low_stock_count ?? 0}
            icon={DangerCircleOutlined}
            color="error"
          />
        </>
      )}
      {(reportType === 'sales' || reportType === 'purchases') && (
        <>
          <SummaryCard
            label={t('summary.paid')}
            value={formatMoney(
              reportType === 'sales' ? salesSummary?.paid_amount : purchasesSummary?.paid_amount,
              currencyFormatter,
            )}
            icon={CheckCircleOutlined}
            color="success"
          />
          <SummaryCard
            label={t('summary.due')}
            value={formatMoney(
              reportType === 'sales' ? salesSummary?.due_amount : purchasesSummary?.due_amount,
              currencyFormatter,
            )}
            icon={AccountBalanceWalletOutlined}
            color="warning"
          />
        </>
      )}
      {reportType === 'cashRegisters' && (
        <>
          <SummaryCard
            label={t('summary.openRegisters')}
            value={cashRegistersSummary?.open_count ?? 0}
            icon={CheckCircleOutlined}
            color="success"
          />
          <SummaryCard
            label={t('summary.cashDifference')}
            value={formatMoney(cashRegistersSummary?.difference, currencyFormatter)}
            icon={AccountBalanceWalletOutlined}
            color="warning"
          />
        </>
      )}
    </Box>
  )
}
