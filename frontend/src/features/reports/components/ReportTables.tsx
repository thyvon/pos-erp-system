'use client'

import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { TFunction } from 'i18next'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type {
  CashRegistersReportRow,
  ExpensesReportRow,
  PurchasePaymentsReportRow,
  PurchaseReturnsReportRow,
  PurchasesReportRow,
  SalePaymentsReportRow,
  SalesReportRow,
  SalesReturnReportRow,
  StockReportRow,
} from '@/types/report'

interface ReportTableProps {
  dateFormat: string
  language: string
  currencyFormatter: Intl.NumberFormat
  emptyMessage: string
  loading: boolean
  t: TFunction<['reports', 'common']>
}

export function SalesReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: SalesReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.saleNumber')}</TableCell>
            <TableCell>{t('columns.customer')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell>{t('columns.payment')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
            <TableCell align="right">{t('columns.paid')}</TableCell>
            <TableCell align="right">{t('columns.due')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={9} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={9} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.sale_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.sale_number}
                </Typography>
              </TableCell>
              <TableCell>{row.customer?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell>{t(`paymentStatuses.${row.payment_status}`, { defaultValue: row.payment_status })}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.paid_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.due_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function SalesReturnReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: SalesReturnReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.returnNumber')}</TableCell>
            <TableCell>{t('columns.saleNumber')}</TableCell>
            <TableCell>{t('columns.customer')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell>{t('columns.refundMethod')}</TableCell>
            <TableCell align="right">{t('columns.items')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={9} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={9} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.return_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.return_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.sale?.sale_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.customer?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell>
                {row.refund_method ? t(`refundMethods.${row.refund_method}`, { defaultValue: row.refund_method }) : '-'}
              </TableCell>
              <TableCell align="right">{row.items_count}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function PurchasesReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: PurchasesReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.purchaseNumber')}</TableCell>
            <TableCell>{t('columns.supplierInvoice')}</TableCell>
            <TableCell>{t('columns.supplier')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell>{t('columns.payment')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
            <TableCell align="right">{t('columns.paid')}</TableCell>
            <TableCell align="right">{t('columns.due')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={10} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={10} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.purchase_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.purchase_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.supplier_invoice_no || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.supplier?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell>{t(`paymentStatuses.${row.payment_status}`, { defaultValue: row.payment_status })}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.paid_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.due_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function PurchaseReturnsReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: PurchaseReturnsReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.returnNumber')}</TableCell>
            <TableCell>{t('columns.purchaseNumber')}</TableCell>
            <TableCell>{t('columns.supplier')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.items')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={8} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={8} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.return_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.return_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.purchase?.purchase_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.supplier?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{row.items_count}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function SalePaymentsReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: SalePaymentsReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.saleNumber')}</TableCell>
            <TableCell>{t('columns.reference')}</TableCell>
            <TableCell>{t('columns.customer')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.method')}</TableCell>
            <TableCell>{t('columns.account')}</TableCell>
            <TableCell>{t('columns.cashier')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.amount')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={10} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={10} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.payment_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.sale?.sale_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.reference || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.customer?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`paymentMethods.${row.method}`, { defaultValue: row.method })}</TableCell>
              <TableCell>{row.payment_account?.name ?? '-'}</TableCell>
              <TableCell>{row.cashier?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{formatMoney(row.amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function PurchasePaymentsReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: PurchasePaymentsReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.purchaseNumber')}</TableCell>
            <TableCell>{t('columns.reference')}</TableCell>
            <TableCell>{t('columns.supplier')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.method')}</TableCell>
            <TableCell>{t('columns.account')}</TableCell>
            <TableCell>{t('columns.cashier')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.amount')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={10} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={10} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.payment_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.purchase?.purchase_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.reference || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.supplier?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`paymentMethods.${row.method}`, { defaultValue: row.method })}</TableCell>
              <TableCell>{row.payment_account?.name ?? '-'}</TableCell>
              <TableCell>{row.cashier?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{formatMoney(row.amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function StockReportTable({
  rows,
  loading,
  dateFormat,
  language,
  emptyMessage,
  t,
}: ReportTableProps & { rows: StockReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.product')}</TableCell>
            <TableCell>{t('columns.sku')}</TableCell>
            <TableCell>{t('columns.category')}</TableCell>
            <TableCell>{t('columns.warehouse')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.tracking')}</TableCell>
            <TableCell align="right">{t('columns.onHand')}</TableCell>
            <TableCell align="right">{t('columns.reserved')}</TableCell>
            <TableCell align="right">{t('columns.available')}</TableCell>
            <TableCell>{t('columns.lots')}</TableCell>
            <TableCell>{t('columns.updated')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={11} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={11} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography variant="body2">{row.product?.name ?? '-'}</Typography>
                  {row.variation?.name && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.variation.name}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.variation?.sku ?? row.product?.sku ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.category?.name ?? '-'}</TableCell>
              <TableCell>{row.warehouse?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`tracking.${row.product?.stock_tracking ?? 'none'}`)}</TableCell>
              <TableCell align="right">{row.quantity}</TableCell>
              <TableCell align="right">{row.reserved_quantity}</TableCell>
              <TableCell align="right">{row.available_quantity}</TableCell>
              <TableCell sx={{ minWidth: 210 }}>
                {row.lots.length === 0 ? (
                  '-'
                ) : (
                  <Stack spacing={0.25}>
                    {row.lots.slice(0, 2).map((lot) => (
                      <Typography key={lot.id} variant="caption" sx={{ display: 'block' }}>
                        {lot.lot_number}: {lot.qty_available}
                        {lot.expiry_date ? ` | ${formatAppDate(lot.expiry_date, dateFormat, language)}` : ''}
                      </Typography>
                    ))}
                    {row.lots.length > 2 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('columns.moreLots', { count: row.lots.length - 2 })}
                      </Typography>
                    )}
                  </Stack>
                )}
              </TableCell>
              <TableCell>{formatAppDate(row.updated_at, dateFormat, language)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function ExpensesReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: ExpensesReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.reference')}</TableCell>
            <TableCell>{t('columns.description')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.expenseAccount')}</TableCell>
            <TableCell>{t('columns.method')}</TableCell>
            <TableCell>{t('columns.account')}</TableCell>
            <TableCell>{t('columns.cashier')}</TableCell>
            <TableCell align="right">{t('columns.amount')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={9} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={9} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.expense_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.reference_no || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>
                {row.expense_account ? `${row.expense_account.code} - ${row.expense_account.name}` : '-'}
              </TableCell>
              <TableCell>
                {row.payment_method
                  ? t(`paymentMethods.${row.payment_method}`, { defaultValue: row.payment_method })
                  : '-'}
              </TableCell>
              <TableCell>{row.payment_account?.name ?? '-'}</TableCell>
              <TableCell>{row.cashier?.name ?? '-'}</TableCell>
              <TableCell align="right">{formatMoney(row.amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function CashRegistersReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: CashRegistersReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.opened')}</TableCell>
            <TableCell>{t('columns.closed')}</TableCell>
            <TableCell>{t('columns.cashRegister')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.cashier')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.openingFloat')}</TableCell>
            <TableCell align="right">{t('columns.totalSales')}</TableCell>
            <TableCell align="right">{t('columns.expectedCash')}</TableCell>
            <TableCell align="right">{t('columns.closingFloat')}</TableCell>
            <TableCell align="right">{t('columns.difference')}</TableCell>
            <TableCell align="right">{t('columns.sales')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={12} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={12} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.opened_at, dateFormat, language)}</TableCell>
              <TableCell>{row.closed_at ? formatAppDate(row.closed_at, dateFormat, language) : '-'}</TableCell>
              <TableCell>{row.cash_register?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{row.cashier?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{formatMoney(row.opening_float, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.total_sales, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.expected_cash, currencyFormatter)}</TableCell>
              <TableCell align="right">
                {row.closing_float ? formatMoney(row.closing_float, currencyFormatter) : '-'}
              </TableCell>
              <TableCell align="right">
                {row.difference ? formatMoney(row.difference, currencyFormatter) : '-'}
              </TableCell>
              <TableCell align="right">{row.sales_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
