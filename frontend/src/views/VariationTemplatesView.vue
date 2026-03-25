<template>
  <AppLayout
    title="Variation Templates"
    subtitle="Manage reusable variant sets like Size, Color, or Flavor for variable products."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Variation Templates' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Variation Templates"
        :columns="columns"
        :rows="store.items"
        :loading="store.loading"
        :total="store.pagination.total"
        :current-page="store.pagination.current_page"
        :last-page="store.pagination.last_page"
        :per-page="store.pagination.per_page"
        :search-term="store.filters.search"
        @search="handleSearch"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #toolbar>
          <button v-if="canCreateTemplate" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New template
          </button>
        </template>

        <template #name="{ row }">
          <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
        </template>

        <template #values="{ row }">
          <div class="space-y-1">
            <div v-if="row.values?.length" class="flex flex-wrap gap-2">
              <span
                v-for="value in row.values"
                :key="value.id"
                class="inline-flex rounded-[5px] bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {{ value.name }}
              </span>
            </div>
            <span v-else class="text-sm text-slate-500 dark:text-slate-400">No values</span>
          </div>
        </template>

        <template #usage="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.values_count }} value{{ row.values_count === 1 ? '' : 's' }}
          </span>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditTemplate" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteTemplate" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create variation template' : 'Edit variation template'"
        icon="variation"
        size="xl"
        @close="closeModal"
      >
        <Form
          v-slot="{ values, setFieldValue }"
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div>
            <label class="erp-label" for="name">Template name</label>
            <Field id="name" name="name" class="erp-input" />
            <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <div class="mt-6 rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-slate-900 dark:text-white">Variation values</div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add reusable values such as Small, Medium, Large or Red, Blue, Green.
                </div>
              </div>
              <button type="button" class="erp-button-secondary" @click="addValue(values, setFieldValue)">
                <i class="fa-solid fa-plus"></i>
                Add value
              </button>
            </div>

            <div v-if="values.values.length" class="mt-4 space-y-4">
              <div
                v-for="(value, index) in values.values"
                :key="value.id || index"
                class="rounded-[5px] border border-slate-200/80 p-4 dark:border-slate-800/80"
              >
                <div class="grid gap-4 md:grid-cols-[1.5fr_1fr_auto] md:items-start">
                  <div>
                    <label class="erp-label" :for="`values.${index}.name`">Value name</label>
                    <Field :id="`values.${index}.name`" :name="`values[${index}].name`" class="erp-input" />
                    <ErrorMessage :name="`values[${index}].name`" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div>
                    <label class="erp-label" :for="`values.${index}.sort_order`">Sort order</label>
                    <Field
                      :id="`values.${index}.sort_order`"
                      :name="`values[${index}].sort_order`"
                      type="number"
                      min="0"
                      step="1"
                      class="erp-input"
                    />
                    <ErrorMessage :name="`values[${index}].sort_order`" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div class="md:pt-7">
                    <button type="button" class="erp-button-icon" @click="removeValue(values, setFieldValue, index)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create template' : 'Save template' }}
            </button>
          </div>
        </Form>
      </AppModal>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deleting"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useVariationTemplatesStore } from '@stores/variationTemplates'

const auth = useAuthStore()
const store = useVariationTemplatesStore()

const canCreateTemplate = computed(() => auth.can('variation_templates.create'))
const canEditTemplate = computed(() => auth.can('variation_templates.edit'))
const canDeleteTemplate = computed(() => auth.can('variation_templates.delete'))
const showActionsColumn = computed(() => canEditTemplate.value || canDeleteTemplate.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Template' },
    { key: 'values', label: 'Values' },
    { key: 'usage', label: 'Usage' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', template: null })
const deleteDialog = reactive({ show: false, template: null, itemName: '' })
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.template?.name ?? '',
  values: (modal.template?.values ?? []).map((value, index) => ({
    id: value.id,
    name: value.name,
    sort_order: value.sort_order ?? ((index + 1) * 10),
  })),
}))

const schema = yup.object({
  name: yup.string().required().max(150),
  values: yup.array().of(
    yup.object({
      id: yup.string().nullable(),
      name: yup.string().required().max(150),
      sort_order: yup.number().typeError('Sort order is required.').required().min(0).max(65535),
    })
  ).min(1).required(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
}

const addValue = (values, setFieldValue) => {
  setFieldValue('values', [
    ...(values.values || []),
    {
      id: null,
      name: '',
      sort_order: ((values.values?.length || 0) + 1) * 10,
    },
  ])
}

const removeValue = (values, setFieldValue, index) => {
  setFieldValue(
    'values',
    (values.values || []).filter((_, itemIndex) => itemIndex !== index)
  )
}

const openCreateModal = () => {
  if (!canCreateTemplate.value) return
  modal.mode = 'create'
  modal.template = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (template) => {
  if (!canEditTemplate.value) return
  modal.mode = 'edit'
  modal.template = template
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.template = null
}

const openDeleteModal = (template) => {
  if (!canDeleteTemplate.value) return
  deleteDialog.show = true
  deleteDialog.template = template
  deleteDialog.itemName = template.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.template = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchVariationTemplates({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchVariationTemplates({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchVariationTemplates({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      values: (values.values || []).map((value, index) => ({
        id: value.id || null,
        name: value.name,
        sort_order: Number(value.sort_order ?? ((index + 1) * 10)),
      })),
    }

    if (modal.mode === 'create') {
      await store.createVariationTemplate(payload)
      showToast('success', 'Variation template created successfully.')
    } else {
      await store.updateVariationTemplate(modal.template.id, payload)
      showToast('success', 'Variation template updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the variation template.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.template) return

  try {
    await store.deleteVariationTemplate(deleteDialog.template.id)
    showToast('success', 'Variation template deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the variation template.')
  }
}

onMounted(async () => {
  await Promise.all([store.fetchVariationTemplates(), store.fetchOptions()])
})
</script>
