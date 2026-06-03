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
import { Add, LocalAtmOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { PriceGroupFormDialog } from '@/features/price-groups/PriceGroupFormDialog'
import {
  useCreatePriceGroupMutation,
  useDeletePriceGroupMutation,
  usePriceGroupsQuery,
  useUpdatePriceGroupMutation,
} from '@/features/price-groups/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { PriceGroup, PriceGroupFilters, PriceGroupPayload } from '@/types/priceGroup'

const rowsPerPageOptions = [10, 25, 50]

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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <LocalAtmOutlined color="primary" />
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
          <TextField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder={t('filters.search')}
            sx={{ mb: 2.5, width: '100%' }}
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

          {priceGroupsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(priceGroupsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.name')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell>{t('columns.default')}</TableCell>
                  <TableCell>{t('columns.customerGroups')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceGroupsQuery.isLoading && <TableStateRow colSpan={5} loading />}

                {!priceGroupsQuery.isLoading && priceGroups.length === 0 && (
                  <TableStateRow colSpan={5} message={t('empty')} />
                )}

                {priceGroups.map((priceGroup) => (
                  <TableRow key={priceGroup.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{priceGroup.name}</Typography>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={priceGroup.is_default ? t('labels.default') : t('labels.standard')}
                        color={priceGroup.is_default ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{priceGroup.customer_groups_count}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deletePriceGroup.isPending}
                        onEdit={() => openEditForm(priceGroup)}
                        onDelete={() => setDeletingPriceGroup(priceGroup)}
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
