'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { Add, BusinessOutlined } from '@/components/ui/icons'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { useAuthStore } from '@/stores/authStore'
import { BusinessFormDialog } from './BusinessFormDialog'
import { BusinessModulesDialog } from './BusinessModulesDialog'
import {
  useCreateManagedBusinessMutation,
  useManagedBusinessModulesQuery,
  useManagedBusinessesQuery,
  useUpdateManagedBusinessModulesMutation,
  useUpdateManagedBusinessMutation,
} from './hooks'
import type {
  ManagedBusiness,
  ManagedBusinessFilters,
  ManagedBusinessPayload,
  ManagedBusinessStatus,
  ManagedBusinessTier,
} from '@/types/businessManagement'

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
  const [modulesBusiness, setModulesBusiness] = useState<ManagedBusiness | null>(null)
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
  const modulesQuery = useManagedBusinessModulesQuery(modulesBusiness?.id ?? null, superAdmin && !!modulesBusiness)
  const createBusiness = useCreateManagedBusinessMutation()
  const updateBusiness = useUpdateManagedBusinessMutation()
  const updateModules = useUpdateManagedBusinessModulesMutation()
  const businesses = businessesQuery.data?.data ?? []
  const meta = businessesQuery.data?.meta
  const canCreate = can('businesses.create')
  const canEdit = can('businesses.edit')

  const columns = useMemo<EntityTableColumn<ManagedBusiness>[]>(
    () => [
      {
        key: 'business',
        label: t('columns.business'),
        render: (business) => (
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
        ),
      },
      {
        key: 'owner',
        label: t('columns.owner'),
        render: (business) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">
              {business.owner?.full_name || t('summary.noOwner')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {business.owner?.email || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'plan',
        label: t('columns.plan'),
        render: (business) => (
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
        ),
      },
      {
        key: 'usage',
        label: t('columns.usage'),
        render: (business) => (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
            <Chip size="small" variant="outlined" label={t('summary.usersCount', { count: business.usage.users_count })} />
            <Chip size="small" variant="outlined" label={t('summary.branchesCount', { count: business.usage.branches_count })} />
            <Chip size="small" variant="outlined" label={t('summary.warehousesCount', { count: business.usage.warehouses_count })} />
          </Stack>
        ),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (business) => (
          <Chip
            size="small"
            color={statusColor(business.status)}
            label={t(`statuses.${business.status}`)}
          />
        ),
      },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingBusiness(null)
    setFormOpen(true)
  }

  const openEditForm = (business: ManagedBusiness) => {
    setEditingBusiness(business)
    setFormOpen(true)
  }

  const openModulesDialog = (business: ManagedBusiness) => {
    setModulesBusiness(business)
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

  const handleModulesSubmit = async (modules: Parameters<typeof updateModules.mutateAsync>[0]['modules']) => {
    if (!modulesBusiness) return

    await updateModules.mutateAsync({ id: modulesBusiness.id, modules })
    enqueueSnackbar(t('modules.messages.updated'), { variant: 'success' })
    setModulesBusiness(null)
  }

  if (!superAdmin) {
    return (
      <Alert severity="warning">
        {t('errors.superAdminOnly')}
      </Alert>
    )
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<BusinessOutlined color="primary" />}
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('actions.new')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filters={
          <>
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
          </>
        }
      />

      {businessesQuery.isError && (
        <Alert severity="error">
          {toAppApiError(businessesQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={businesses}
        columns={columns}
        getRowKey={(business) => business.id}
        loading={businessesQuery.isLoading}
        emptyTitle={t('empty')}
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => {
            setPerPage(nextPerPage)
            setPage(0)
          },
        }}
        rowActions={(business) => (
          <RowActions
            viewLabel={t('modules.actions.manage')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView={canEdit}
            showEdit={canEdit}
            showDelete={false}
            onView={() => openModulesDialog(business)}
            onEdit={() => openEditForm(business)}
          />
        )}
      />

      <BusinessFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingBusiness?.id ?? 'new'}`}
        open={formOpen}
        business={editingBusiness}
        isSaving={createBusiness.isPending || updateBusiness.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <BusinessModulesDialog
        open={!!modulesBusiness}
        business={modulesBusiness}
        modules={modulesQuery.data ?? []}
        isLoading={modulesQuery.isLoading}
        isSaving={updateModules.isPending}
        error={modulesQuery.error}
        onClose={() => setModulesBusiness(null)}
        onSubmit={handleModulesSubmit}
      />
    </Stack>
  )
}
