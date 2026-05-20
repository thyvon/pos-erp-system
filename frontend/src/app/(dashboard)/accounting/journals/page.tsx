'use client'

import NextLink from 'next/link'
import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, ReceiptLongOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { ReverseJournalDialog } from '@/features/accounting/ReverseJournalDialog'
import {
  useJournalQuery,
  useJournalsQuery,
  useReverseJournalMutation,
} from '@/features/accounting/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDateTime } from '@/utils/dateFormat'
import type { Journal, JournalFilters, JournalReversePayload, JournalStatus } from '@/types/accounting'

const rowsPerPageOptions = [10, 25, 50]
const statuses: JournalStatus[] = ['posted', 'reversed']
const journalTypes = ['manual', 'reversal']

function formatMoney(value: number | string | null | undefined, formatter: Intl.NumberFormat) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric)
    ? formatter.format(numeric)
    : '-'
}

export default function JournalsPage() {
  const { t, i18n } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JournalStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [viewingJournal, setViewingJournal] = useState<Journal | null>(null)
  const [reversingJournal, setReversingJournal] = useState<Journal | null>(null)

  const filters: JournalFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      journal_type: typeFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter, typeFilter]
  )

  const journalsQuery = useJournalsQuery(filters)
  const detailQuery = useJournalQuery(viewingJournal?.id ?? null)
  const reverseJournal = useReverseJournalMutation()
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const journals = journalsQuery.data?.data ?? []
  const summary = journalsQuery.data?.summary
  const meta = journalsQuery.data?.meta
  const selectedJournal = detailQuery.data ?? viewingJournal
  const canManage = can('accounting.journals') || can('accounting.index')

  const handleReverse = async (payload: JournalReversePayload) => {
    if (!reversingJournal) return

    await reverseJournal.mutateAsync({ id: reversingJournal.id, payload })
    enqueueSnackbar(t('journals.messages.reversed'), { variant: 'success' })
    setReversingJournal(null)
    if (viewingJournal?.id === reversingJournal.id) {
      setViewingJournal(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ReceiptLongOutlined color="primary" />
            <Typography variant="h4">{t('journals.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('journals.subtitle')}
          </Typography>
        </Box>
        {canManage && (
          <Button component={NextLink} href="/accounting/journals/create" startIcon={<Add />} variant="contained">
            {t('journals.actions.new')}
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {[
          ['total', summary?.total_journals ?? 0],
          ['posted', summary?.posted_journals ?? 0],
          ['reversed', summary?.reversed_journals ?? 0],
          ['volume', formatMoney(summary?.posted_volume ?? 0, currencyFormatter)],
        ].map(([key, value]) => (
          <Card key={key}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t(`journals.summary.${key}`)}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('journals.filters.search')}
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as JournalStatus | '')
                setPage(0)
              }}
              label={t('journals.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('journals.filters.allStatuses')}</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>{t(`journals.statuses.${status}`)}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value)
                setPage(0)
              }}
              label={t('journals.filters.type')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('journals.filters.allTypes')}</MenuItem>
              {journalTypes.map((type) => (
                <MenuItem key={type} value={type}>{t(`journals.types.${type}`)}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {journalsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(journalsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('journals.columns.number')}</TableCell>
                  <TableCell>{t('journals.columns.date')}</TableCell>
                  <TableCell>{t('journals.columns.type')}</TableCell>
                  <TableCell>{t('journals.columns.description')}</TableCell>
                  <TableCell align="right">{t('journals.columns.total')}</TableCell>
                  <TableCell>{t('journals.columns.status')}</TableCell>
                  <TableCell align="right">{t('journals.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {journalsQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!journalsQuery.isLoading && journals.length === 0 && (
                  <TableStateRow colSpan={7} message={t('journals.empty')} />
                )}
                {journals.map((journal) => (
                  <TableRow key={journal.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{journal.journal_number}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('journals.labels.lines', { count: journal.entry_count })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{formatAppDateTime(journal.date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>{t(`journals.types.${journal.journal_type}`, { defaultValue: journal.journal_type })}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 420,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {journal.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatMoney(journal.total, currencyFormatter)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`journals.statuses.${journal.status}`)}
                        color={journal.status === 'posted' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        viewLabel={t('common:buttons.view')}
                        editLabel={t('journals.actions.reverse')}
                        deleteLabel=""
                        showView
                        showEdit={canManage && journal.status === 'posted'}
                        showDelete={false}
                        onView={() => setViewingJournal(journal)}
                        onEdit={() => setReversingJournal(journal)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={meta?.total ?? 0}
            page={page}
            rowsPerPage={perPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!viewingJournal} onClose={() => setViewingJournal(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedJournal?.journal_number ?? t('journals.detail.title')}</DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {detailQuery.isError && (
            <Alert severity="error">{toAppApiError(detailQuery.error).message}</Alert>
          )}
          {selectedJournal && !detailQuery.isLoading && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('journals.columns.date')}
                  </Typography>
                  <Typography variant="body2">{formatAppDateTime(selectedJournal.date, dateFormat, i18n.language)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('journals.columns.type')}
                  </Typography>
                  <Typography variant="body2">
                    {t(`journals.types.${selectedJournal.journal_type}`, { defaultValue: selectedJournal.journal_type })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('journals.columns.total')}
                  </Typography>
                  <Typography variant="body2">{formatMoney(selectedJournal.total, currencyFormatter)}</Typography>
                </Box>
              </Box>

              <Divider />

              <Typography variant="body2">{selectedJournal.description}</Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('journals.entries.account')}</TableCell>
                      <TableCell>{t('journals.entries.description')}</TableCell>
                      <TableCell align="right">{t('journals.entries.debit')}</TableCell>
                      <TableCell align="right">{t('journals.entries.credit')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedJournal.entries ?? []).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.account ? `${entry.account.code} - ${entry.account.name}` : '-'}
                        </TableCell>
                        <TableCell>{entry.description || '-'}</TableCell>
                        <TableCell align="right">{entry.type === 'debit' ? formatMoney(entry.amount, currencyFormatter) : '-'}</TableCell>
                        <TableCell align="right">{entry.type === 'credit' ? formatMoney(entry.amount, currencyFormatter) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {canManage && selectedJournal?.status === 'posted' && (
            <Button
              color="warning"
              variant="contained"
              onClick={() => setReversingJournal(selectedJournal)}
            >
              {t('journals.actions.reverse')}
            </Button>
          )}
          <Button variant="outlined" onClick={() => setViewingJournal(null)}>
            {t('common:buttons.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <ReverseJournalDialog
        open={!!reversingJournal}
        journal={reversingJournal}
        isSaving={reverseJournal.isPending}
        onClose={() => setReversingJournal(null)}
        onSubmit={handleReverse}
      />
    </Stack>
  )
}
