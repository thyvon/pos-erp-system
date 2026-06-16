'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Add, LocalAtmOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { PriceGroupFormDialog } from '@/features/price-groups/PriceGroupFormDialog'
import {
  useCreatePriceGroupMutation,
  useDeletePriceGroupMutation,
  usePriceGroupsQuery,
  useUpdatePriceGroupMutation,
} from '@/features/price-groups/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { PriceGroup, PriceGroupFilters, PriceGroupPayload } from '@/types/priceGroup'

export default function PriceGroupsPage() {
  const { t } = useTranslation(['priceGroups', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPriceGroup, setEditingPriceGroup] = useState<PriceGroup | null>(null)
  const [deletingPriceGroup, setDeletingPriceGroup] = useState<PriceGroup | null>(null)

  const filters: PriceGroupFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const priceGroupsQuery = usePriceGroupsQuery(filters)
  const createPriceGroup = useCreatePriceGroupMutation()
  const updatePriceGroup = useUpdatePriceGroupMutation()
  const deletePriceGroup = useDeletePriceGroupMutation()

  const priceGroups = priceGroupsQuery.data?.data ?? []
  const meta = priceGroupsQuery.data?.meta
  const canCreate = can('price_groups.create')
  const canEdit = can('price_groups.edit')
  const canDelete = can('price_groups.delete')

  const openCreateForm = () => {
    setEditingPriceGroup(null)
    setFormOpen(true)
  }

  const openEditForm = (priceGroup: PriceGroup) => {
    setEditingPriceGroup(priceGroup)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: PriceGroupPayload) => {
    if (editingPriceGroup) {
      await updatePriceGroup.mutateAsync({ id: editingPriceGroup.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createPriceGroup.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingPriceGroup) return

    try {
      await deletePriceGroup.mutateAsync(deletingPriceGroup.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingPriceGroup(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const columns: EntityTableColumn<PriceGroup>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('columns.name'),
        render: (priceGroup) => (
          <Typography variant="subtitle2">{priceGroup.name}</Typography>
        ),
      },
      {
        key: 'description',
        label: t('columns.description'),
        render: (priceGroup) => (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 520,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {priceGroup.description || '-'}
          </Typography>
        ),
      },
      {
        key: 'default',
        label: t('columns.default'),
        render: (priceGroup) => (
          <Chip
            size="small"
            label={priceGroup.is_default ? t('labels.default') : t('labels.standard')}
            color={priceGroup.is_default ? 'primary' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        key: 'customerGroups',
        label: t('columns.customerGroups'),
        render: (priceGroup) => priceGroup.customer_groups_count,
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<LocalAtmOutlined color="primary" />}
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
      />

      {priceGroupsQuery.isError && (
        <Alert severity="error">{toAppApiError(priceGroupsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={priceGroups}
        columns={columns}
        getRowKey={(priceGroup) => priceGroup.id}
        loading={priceGroupsQuery.isLoading}
        emptyIcon={<LocalAtmOutlined />}
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
        rowActions={(priceGroup) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deletePriceGroup.isPending}
            onEdit={() => openEditForm(priceGroup)}
            onDelete={() => setDeletingPriceGroup(priceGroup)}
          />
        )}
      />

      <PriceGroupFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingPriceGroup?.id ?? 'new'}`}
        open={formOpen}
        priceGroup={editingPriceGroup}
        isSaving={createPriceGroup.isPending || updatePriceGroup.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingPriceGroup}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingPriceGroup?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deletePriceGroup.isPending}
        onClose={() => setDeletingPriceGroup(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
