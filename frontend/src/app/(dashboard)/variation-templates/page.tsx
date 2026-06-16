'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Add, PaletteOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
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

  const columns: EntityTableColumn<VariationTemplate>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('columns.name'),
        render: (template) => (
          <Typography variant="subtitle2">{template.name}</Typography>
        ),
      },
      {
        key: 'values',
        label: t('columns.values'),
        render: (template) => (
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
        ),
      },
      {
        key: 'valueCount',
        label: t('columns.valueCount'),
        render: (template) => template.values_count,
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<PaletteOutlined color="primary" />}
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

      {templatesQuery.isError && (
        <Alert severity="error">{toAppApiError(templatesQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={templates}
        columns={columns}
        getRowKey={(template) => template.id}
        loading={templatesQuery.isLoading}
        emptyIcon={<PaletteOutlined />}
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
        rowActions={(template) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteTemplate.isPending}
            onEdit={() => openEditForm(template)}
            onDelete={() => setDeletingTemplate(template)}
          />
        )}
      />

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
