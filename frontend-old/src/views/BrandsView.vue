<template>
  <AppLayout
    title="Brands"
    subtitle="Manage reusable product brands for catalog and product setup."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Brands' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Brands"
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
          <button v-if="canCreateBrand" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New brand
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.description || 'No description' }}
            </div>
          </div>
        </template>

        <template #image="{ row }">
          <div class="flex items-center gap-3">
            <div
              v-if="row.image_url"
              class="h-10 w-10 overflow-hidden rounded-[5px] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            >
              <img :src="row.image_url" :alt="row.name" class="h-full w-full object-cover" />
            </div>
            <span v-else class="text-sm text-slate-500 dark:text-slate-400">No image</span>
          </div>
        </template>

        <template #usage="{ row }">
          <span class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.products_count }} product{{ row.products_count === 1 ? '' : 's' }}
          </span>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditBrand" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteBrand" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create brand' : 'Edit brand'"
        icon="brand"
        size="lg"
        @close="closeModal"
      >
        <Form
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-4">
            <div>
              <label class="erp-label" for="name">Brand name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="description">Description</label>
              <Field id="description" name="description" as="textarea" rows="3" class="erp-input min-h-[6rem]" />
              <ErrorMessage name="description" class="erp-helper text-rose-500 dark:text-rose-400" />
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
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create brand' : 'Save brand' }}
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
import { useBrandsStore } from '@stores/brands'

const auth = useAuthStore()
const store = useBrandsStore()

const canCreateBrand = computed(() => auth.can('brands.create'))
const canEditBrand = computed(() => auth.can('brands.edit'))
const canDeleteBrand = computed(() => auth.can('brands.delete'))
const showActionsColumn = computed(() => canEditBrand.value || canDeleteBrand.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Brand' },
    { key: 'image', label: 'Image' },
    { key: 'usage', label: 'Usage' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', brand: null })
const deleteDialog = reactive({ show: false, brand: null, itemName: '' })
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.brand?.name ?? '',
  description: modal.brand?.description ?? '',
  image_url: modal.brand?.image_url ?? '',
}))

const schema = yup.object({
  name: yup.string().required().max(150),
  description: yup.string().nullable(),
  image_url: yup.string().nullable().url().max(500),
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
  if (!canCreateBrand.value) return
  modal.mode = 'create'
  modal.brand = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (brand) => {
  if (!canEditBrand.value) return
  modal.mode = 'edit'
  modal.brand = brand
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.brand = null
}

const openDeleteModal = (brand) => {
  if (!canDeleteBrand.value) return
  deleteDialog.show = true
  deleteDialog.brand = brand
  deleteDialog.itemName = brand.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.brand = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchBrands({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchBrands({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchBrands({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      description: values.description || null,
      image_url: values.image_url || null,
    }

    if (modal.mode === 'create') {
      await store.createBrand(payload)
      showToast('success', 'Brand created successfully.')
    } else {
      await store.updateBrand(modal.brand.id, payload)
      showToast('success', 'Brand updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the brand.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.brand) return

  try {
    await store.deleteBrand(deleteDialog.brand.id)
    showToast('success', 'Brand deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the brand.')
  }
}

onMounted(async () => {
  await Promise.all([store.fetchBrands(), store.fetchOptions()])
})
</script>
