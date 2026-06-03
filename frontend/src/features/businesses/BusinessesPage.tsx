'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { Add, BusinessOutlined, Search } from '@/components/ui/icons'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useAuthStore } from '@/stores/authStore'
import { BusinessFormDialog } from './BusinessFormDialog'
import {
  useCreateManagedBusinessMutation,
  useManagedBusinessesQuery,
  useUpdateManagedBusinessMutation,
} from './hooks'
import type {
  ManagedBusiness,
  ManagedBusinessFilters,
  ManagedBusinessPayload,
  ManagedBusinessStatus,
  ManagedBusinessTier,
} from '@/types/businessManagement'

const rowsPerPageOptions = [10, 25, 50]

function statusColor(status: ManagedBusinessStatus) {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'warning'
  return 'default'
}

function tierColor(tier: ManagedBusinessTier) {
  if (tier === 'enterprise') return 'secondary'
  if (tier === 'standard') return 'primary'
  return 'default'
}

export function BusinessesPage() {
  const { t } = useTranslation(['businesses', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ManagedBusinessStatus | ''>('')
  const [tier, setTier] = useState<ManagedBusinessTier | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingBusiness, setEditingBusiness] = useState<ManagedBusiness | null>(null)
  const superAdmin = isSuperAdmin()

  const filters: ManagedBusinessFilters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      tier: tier || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, status, tier]
  )

  const businessesQuery = useManagedBusinessesQuery(filters, superAdmin)
  const createBusiness = useCreateManagedBusinessMutation()
  const updateBusiness = useUpdateManagedBusinessMutation()
  const businesses = businessesQuery.data?.data ?? []
  const meta = businessesQuery.data?.meta
  const canCreate = can('businesses.create')
  const canEdit = can('businesses.edit')

  const openCreateForm = () => {
    setEditingBusiness(null)
    setFormOpen(true)
  }

  const openEditForm = (business: ManagedBusiness) => {
    setEditingBusiness(business)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: ManagedBusinessPayload) => {
    if (editingBusiness) {
      await updateBusiness.mutateAsync({ id: editingBusiness.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createBusiness.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  if (!superAdmin) {
    return (
      <Alert severity="warning">
        {t('errors.superAdminOnly')}
      </Alert>
    )
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
            <BusinessOutlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('actions.new')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('filters.search')}
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
              value={status}
              label={t('filters.status')}
              sx={{ minWidth: { md: 180 } }}
              onChange={(event) => {
                setStatus(event.target.value as ManagedBusinessStatus | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('statuses.active')}</MenuItem>
              <MenuItem value="suspended">{t('statuses.suspended')}</MenuItem>
              <MenuItem value="cancelled">{t('statuses.cancelled')}</MenuItem>
            </TextField>
            <TextField
              select
              value={tier}
              label={t('filters.tier')}
              sx={{ minWidth: { md: 180 } }}
              onChange={(event) => {
                setTier(event.target.value as ManagedBusinessTier | '')
                setPage(0)
              }}
            >
              <MenuItem value="">{t('filters.allTiers')}</MenuItem>
              <MenuItem value="basic">{t('tiers.basic')}</MenuItem>
              <MenuItem value="standard">{t('tiers.standard')}</MenuItem>
              <MenuItem value="enterprise">{t('tiers.enterprise')}</MenuItem>
            </TextField>
          </Stack>

          {businessesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(businessesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.business')}</TableCell>
                  <TableCell>{t('columns.owner')}</TableCell>
                  <TableCell>{t('columns.plan')}</TableCell>
                  <TableCell>{t('columns.usage')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {businessesQuery.isLoading && <TableStateRow colSpan={6} loading />}

                {!businessesQuery.isLoading && businesses.length === 0 && (
                  <TableStateRow colSpan={6} message={t('empty')} />
                )}

                {businesses.map((business) => (
                  <TableRow key={business.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{business.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {business.legal_name || business.email}
                        </Typography>
                        {business.tax_id && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('summary.taxId', { taxId: business.tax_id })}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
                          {business.owner?.full_name || t('summary.noOwner')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {business.owner?.email || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
                        <Chip
                          size="small"
                          color={tierColor(business.tier)}
                          label={t(`tiers.${business.tier}`)}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('summary.limits', {
                            users: business.max_users,
                            branches: business.max_branches,
                          })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                        <Chip size="small" variant="outlined" label={t('summary.usersCount', { count: business.usage.users_count })} />
                        <Chip size="small" variant="outlined" label={t('summary.branchesCount', { count: business.usage.branches_count })} />
                        <Chip size="small" variant="outlined" label={t('summary.warehousesCount', { count: business.usage.warehouses_count })} />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor(business.status)}
                        label={t(`statuses.${business.status}`)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={false}
                        onEdit={() => openEditForm(business)}
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

      <BusinessFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingBusiness?.id ?? 'new'}`}
        open={formOpen}
        business={editingBusiness}
        isSaving={createBusiness.isPending || updateBusiness.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  )
}
