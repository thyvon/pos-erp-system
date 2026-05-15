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
import { Add, PaletteOutlined, Search } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { VariationTemplateFormDialog } from '@/features/variation-templates/VariationTemplateFormDialog'
import {
  useCreateVariationTemplateMutation,
  useDeleteVariationTemplateMutation,
  useUpdateVariationTemplateMutation,
  useVariationTemplatesQuery,
} from '@/features/variation-templates/hooks'
import { useAuthStore } from '@/stores/authStore'
import type {
  VariationTemplate,
  VariationTemplateFilters,
  VariationTemplatePayload,
} from '@/types/variationTemplate'

const rowsPerPageOptions = [10, 25, 50]

export default function VariationTemplatesPage() {
  const { t } = useTranslation(['variationTemplates', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<VariationTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<VariationTemplate | null>(null)

  const filters: VariationTemplateFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const templatesQuery = useVariationTemplatesQuery(filters)
  const createTemplate = useCreateVariationTemplateMutation()
  const updateTemplate = useUpdateVariationTemplateMutation()
  const deleteTemplate = useDeleteVariationTemplateMutation()

  const templates = templatesQuery.data?.data ?? []
  const meta = templatesQuery.data?.meta
  const canCreate = can('variation_templates.create')
  const canEdit = can('variation_templates.edit')
  const canDelete = can('variation_templates.delete')

  const openCreateForm = () => {
    setEditingTemplate(null)
    setFormOpen(true)
  }

  const openEditForm = (template: VariationTemplate) => {
    setEditingTemplate(template)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: VariationTemplatePayload) => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createTemplate.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingTemplate) return

    try {
      await deleteTemplate.mutateAsync(deletingTemplate.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingTemplate(null)
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
            <PaletteOutlined color="primary" />
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
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
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

          {templatesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(templatesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.name')}</TableCell>
                  <TableCell>{t('columns.values')}</TableCell>
                  <TableCell>{t('columns.valueCount')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templatesQuery.isLoading && <TableStateRow colSpan={4} loading />}

                {!templatesQuery.isLoading && templates.length === 0 && (
                  <TableStateRow colSpan={4} message={t('empty')} />
                )}

                {templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{template.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        {template.values.length > 0 ? (
                          template.values.map((value) => (
                            <Chip key={value.id} size="small" label={value.name} variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('labels.noValues')}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{template.values_count}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteTemplate.isPending}
                        onEdit={() => openEditForm(template)}
                        onDelete={() => setDeletingTemplate(template)}
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

      <VariationTemplateFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingTemplate?.id ?? 'new'}`}
        open={formOpen}
        template={editingTemplate}
        isSaving={createTemplate.isPending || updateTemplate.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingTemplate}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingTemplate?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteTemplate.isPending}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
