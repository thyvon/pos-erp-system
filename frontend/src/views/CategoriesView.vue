<template>
  <AppLayout
    title="Categories"
    subtitle="Manage product categories with one optional parent level and reusable codes."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Categories' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Categories"
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
          <div class="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div class="w-full max-w-sm">
              <AppSelect
                :model-value="normalizedFilterParentId"
                :options="filterOptions"
                clearable
                searchable
                placeholder="All category levels"
                search-placeholder="Search parent categories"
                empty-text="No parent categories found."
                @update:model-value="handleParentFilterChange"
              />
            </div>

            <button v-if="canCreateCategory" type="button" class="erp-button-primary" @click="openCreateModal">
              <i class="fa-solid fa-plus"></i>
              New
            </button>
          </div>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span v-if="row.code">Code: {{ row.code }}</span>
              <span v-if="row.short_code">Short: {{ row.short_code }}</span>
              <span v-if="!row.code && !row.short_code">No codes</span>
            </div>
          </div>
        </template>

        <template #parent="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.parent?.name || 'Root level' }}
          </span>
        </template>

        <template #children="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.children_count }} child{{ row.children_count === 1 ? '' : 'ren' }}
          </span>
        </template>

        <template #sort_order="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ row.sort_order }}</span>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditCategory" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteCategory" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create category' : 'Edit category'"
        icon="category tree"
        size="xl"
        @close="closeModal"
      >
        <Form
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="name">Category name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="parent_id">Parent category</label>
              <AppSelect
                :model-value="formParentValue"
                :options="parentOptions"
                clearable
                searchable
                placeholder="Root category"
                search-placeholder="Search parent categories"
                empty-text="No parent categories available."
                @update:model-value="formParentValue = $event"
              />
              <p class="erp-helper text-slate-500 dark:text-slate-400">
                Leave blank for a root category. Child categories can only be one level deep.
              </p>
            </div>

            <div>
              <label class="erp-label" for="code">Code</label>
              <Field id="code" name="code" class="erp-input" />
              <ErrorMessage name="code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="short_code">Short code</label>
              <Field id="short_code" name="short_code" class="erp-input" />
              <ErrorMessage name="short_code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="sort_order">Sort order</label>
              <Field id="sort_order" name="sort_order" type="number" min="0" step="1" class="erp-input" />
              <ErrorMessage name="sort_order" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="image_url">Image URL</label>
              <Field id="image_url" name="image_url" class="erp-input" />
              <ErrorMessage name="image_url" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving || store.optionsLoading">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create category' : 'Save category' }}
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
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useCategoriesStore } from '@stores/categories'

const auth = useAuthStore()
const store = useCategoriesStore()

const canCreateCategory = computed(() => auth.can('categories.create'))
const canEditCategory = computed(() => auth.can('categories.edit'))
const canDeleteCategory = computed(() => auth.can('categories.delete'))
const showActionsColumn = computed(() => canEditCategory.value || canDeleteCategory.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Category' },
    { key: 'parent', label: 'Parent' },
    { key: 'children', label: 'Children' },
    { key: 'sort_order', label: 'Sort' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', category: null })
const deleteDialog = reactive({ show: false, category: null, itemName: '' })
const formKey = ref(0)
const formParentValue = ref(null)

const formValues = computed(() => ({
  name: modal.category?.name ?? '',
  code: modal.category?.code ?? '',
  short_code: modal.category?.short_code ?? '',
  image_url: modal.category?.image_url ?? '',
  sort_order: modal.category?.sort_order ?? 0,
}))

const normalizedFilterParentId = computed(() =>
  store.filters.parent_id === '' ? null : store.filters.parent_id
)

const parentOptions = computed(() =>
  store.options
    .filter((option) => option.id !== modal.category?.id)
    .map((option) => ({
      value: option.id,
      label: option.name,
      description: option.short_code || option.code || 'Root category',
      keywords: [option.name, option.code, option.short_code].filter(Boolean).join(' '),
    }))
)

const filterOptions = computed(() => [
  ...store.options.map((option) => ({
    value: option.id,
    label: option.name,
    description: option.short_code || option.code || 'Parent category',
    keywords: [option.name, option.code, option.short_code].filter(Boolean).join(' '),
  })),
])

const schema = yup.object({
  name: yup.string().required().max(150),
  code: yup.string().nullable().max(50),
  short_code: yup.string().nullable().max(10),
  image_url: yup.string().nullable().url().max(500),
  sort_order: yup.number().typeError('Sort order is required.').required().min(0).max(65535),
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

const openCreateModal = () => {
  if (!canCreateCategory.value) return
  modal.mode = 'create'
  modal.category = null
  formParentValue.value = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (category) => {
  if (!canEditCategory.value) return
  modal.mode = 'edit'
  modal.category = category
  formParentValue.value = category.parent_id ?? null
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.category = null
  formParentValue.value = null
}

const openDeleteModal = (category) => {
  if (!canDeleteCategory.value) return
  deleteDialog.show = true
  deleteDialog.category = category
  deleteDialog.itemName = category.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.category = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchCategories({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchCategories({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchCategories({ per_page: perPage, page: 1 })
}

const handleParentFilterChange = async (value) => {
  await store.fetchCategories({ parent_id: value || '', page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      code: values.code || null,
      short_code: values.short_code || null,
      image_url: values.image_url || null,
      sort_order: Number(values.sort_order),
      parent_id: formParentValue.value || null,
    }

    if (modal.mode === 'create') {
      await store.createCategory(payload)
      showToast('success', 'Category created successfully.')
    } else {
      await store.updateCategory(modal.category.id, payload)
      showToast('success', 'Category updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the category.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.category) return

  try {
    await store.deleteCategory(deleteDialog.category.id)
    showToast('success', 'Category deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the category.')
  }
}

onMounted(async () => {
  await Promise.all([store.fetchCategories(), store.fetchOptions()])
})
</script>
