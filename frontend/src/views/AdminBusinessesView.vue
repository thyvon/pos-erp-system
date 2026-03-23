<template>
  <AppLayout
    title="Businesses"
    subtitle="Register new tenants, assign their first admin, and manage lifecycle across the platform."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Businesses' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert
        v-model:show="alert.show"
        :type="alert.type"
        :title="alert.title"
        :message="alert.message"
      />

      <DataTable
        title="Businesses"
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
          <button v-if="canCreateBusiness" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            Register business
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.owner?.email || row.email }}
            </div>
          </div>
        </template>

        <template #tier="{ row }">
          <span class="inline-flex rounded-[5px] bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            {{ row.tier }}
          </span>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>

        <template #usage="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            <div>{{ row.usage?.users_count || 0 }} users</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.usage?.branches_count || 0 }} branches • {{ row.usage?.warehouses_count || 0 }} warehouses
            </div>
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="canEditBusiness" class="flex items-center gap-2">
            <button type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Register business' : 'Manage business'"
        icon="platform tenant"
        size="xl"
        @close="closeModal"
      >
        <Form :key="formKey" :validation-schema="schema" :initial-values="formValues" @submit="submitForm">
          <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="erp-label" for="name">Business name</label>
                  <Field id="name" name="name" class="erp-input" />
                  <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="legal_name">Legal name</label>
                  <Field id="legal_name" name="legal_name" class="erp-input" />
                  <ErrorMessage name="legal_name" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="erp-label" for="email">Business email</label>
                  <Field id="email" name="email" type="email" class="erp-input" />
                  <ErrorMessage name="email" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="phone">Phone</label>
                  <Field id="phone" name="phone" class="erp-input" />
                  <ErrorMessage name="phone" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label class="erp-label" for="currency">Currency</label>
                  <Field id="currency" name="currency" class="erp-input uppercase" />
                  <ErrorMessage name="currency" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="timezone">Timezone</label>
                  <Field id="timezone" name="timezone" as="select" class="erp-select">
                    <option v-for="zone in timezones" :key="zone" :value="zone">{{ zone }}</option>
                  </Field>
                  <ErrorMessage name="timezone" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="tier">Tier</label>
                  <Field id="tier" name="tier" as="select" class="erp-select">
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="enterprise">Enterprise</option>
                  </Field>
                  <ErrorMessage name="tier" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="status">Status</label>
                  <Field id="status" name="status" as="select" class="erp-select">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </Field>
                  <ErrorMessage name="status" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label class="erp-label" for="max_users">Max users</label>
                  <Field id="max_users" name="max_users" type="number" min="1" class="erp-input" />
                  <ErrorMessage name="max_users" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="max_branches">Max branches</label>
                  <Field id="max_branches" name="max_branches" type="number" min="1" class="erp-input" />
                  <ErrorMessage name="max_branches" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="country">Country</label>
                  <Field id="country" name="country" class="erp-input uppercase" />
                  <ErrorMessage name="country" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>

                <div>
                  <label class="erp-label" for="locale">Locale</label>
                  <Field id="locale" name="locale" class="erp-input" />
                  <ErrorMessage name="locale" class="erp-helper text-rose-500 dark:text-rose-400" />
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-[5px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Owner admin
                </div>
                <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  This first user becomes the tenant admin and can immediately manage that business.
                </p>

                <div class="mt-4 space-y-4">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="erp-label" for="owner_first_name">First name</label>
                      <Field id="owner_first_name" name="owner.first_name" class="erp-input" :disabled="modal.mode === 'edit'" />
                      <ErrorMessage name="owner.first_name" class="erp-helper text-rose-500 dark:text-rose-400" />
                    </div>

                    <div>
                      <label class="erp-label" for="owner_last_name">Last name</label>
                      <Field id="owner_last_name" name="owner.last_name" class="erp-input" :disabled="modal.mode === 'edit'" />
                      <ErrorMessage name="owner.last_name" class="erp-helper text-rose-500 dark:text-rose-400" />
                    </div>
                  </div>

                  <div>
                    <label class="erp-label" for="owner_email">Owner email</label>
                    <Field id="owner_email" name="owner.email" type="email" class="erp-input" :disabled="modal.mode === 'edit'" />
                    <ErrorMessage name="owner.email" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div>
                    <label class="erp-label" for="owner_phone">Owner phone</label>
                    <Field id="owner_phone" name="owner.phone" class="erp-input" :disabled="modal.mode === 'edit'" />
                    <ErrorMessage name="owner.phone" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div v-if="modal.mode === 'create'">
                    <label class="erp-label" for="owner_password">Owner password</label>
                    <Field id="owner_password" name="owner.password" type="password" class="erp-input" />
                    <ErrorMessage name="owner.password" class="erp-helper text-rose-500 dark:text-rose-400" />
                  </div>

                  <div v-else class="rounded-[5px] border border-cyan-200/80 bg-cyan-50/80 px-3 py-2 text-sm text-cyan-700 dark:border-cyan-950/60 dark:bg-cyan-950/30 dark:text-cyan-200">
                    Owner account changes stay out of this screen for now. This page manages the business record itself.
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
              {{ modal.mode === 'create' ? 'Register business' : 'Save business' }}
            </button>
          </div>
        </Form>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import DataTable from '@components/ui/DataTable.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAdminBusinessesStore } from '@stores/adminBusinesses'

import { useAuthStore } from '@stores/auth'

const auth = useAuthStore()
const store = useAdminBusinessesStore()
const timezones = ['Asia/Phnom_Penh', 'Asia/Bangkok', 'UTC']

const canCreateBusiness = computed(() => auth.can('businesses.create'))
const canEditBusiness = computed(() => auth.can('businesses.edit'))

const columns = computed(() => {
  const baseColumns = [
    { key: 'name', label: 'Business' },
    { key: 'email', label: 'Business Email' },
    { key: 'tier', label: 'Tier' },
    { key: 'status', label: 'Status' },
    { key: 'usage', label: 'Usage' },
  ]

  if (canEditBusiness.value) {
    baseColumns.push({ key: 'actions', label: 'Actions' })
  }

  return baseColumns
})

const alert = reactive({
  show: false,
  type: 'success',
  title: 'Success',
  message: '',
})

const modal = reactive({
  show: false,
  mode: 'create',
  business: null,
})

const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.business?.name ?? '',
  legal_name: modal.business?.legal_name ?? '',
  email: modal.business?.email ?? '',
  phone: modal.business?.phone ?? '',
  currency: modal.business?.currency ?? 'USD',
  timezone: modal.business?.timezone ?? 'Asia/Phnom_Penh',
  tier: modal.business?.tier ?? 'standard',
  status: modal.business?.status ?? 'active',
  max_users: modal.business?.max_users ?? 10,
  max_branches: modal.business?.max_branches ?? 1,
  country: modal.business?.country ?? 'KH',
  locale: modal.business?.locale ?? 'en',
  tax_id: modal.business?.tax_id ?? '',
  owner: {
    first_name: modal.business?.owner?.full_name?.split(' ')[0] ?? '',
    last_name: modal.business?.owner?.full_name?.split(' ').slice(1).join(' ') ?? '',
    email: modal.business?.owner?.email ?? '',
    phone: modal.business?.owner?.phone ?? '',
    password: '',
  },
}))

const schema = computed(() =>
  yup.object({
    name: yup.string().required().max(255),
    legal_name: yup.string().nullable().max(255),
    email: yup.string().email().required().max(255),
    phone: yup.string().nullable().max(20),
    currency: yup.string().required().length(3),
    timezone: yup.string().required().max(100),
    tier: yup.string().oneOf(['basic', 'standard', 'enterprise']).required(),
    status: yup.string().oneOf(['active', 'suspended', 'cancelled']).required(),
    max_users: yup.number().required().min(1),
    max_branches: yup.number().required().min(1),
    country: yup.string().nullable().length(2),
    locale: yup.string().nullable().max(10),
    tax_id: yup.string().nullable().max(50),
    owner: modal.mode === 'create'
      ? yup.object({
          first_name: yup.string().required().max(100),
          last_name: yup.string().nullable().max(100),
          email: yup.string().email().required().max(255),
          phone: yup.string().nullable().max(20),
          password: yup.string().required().min(8),
        })
      : yup.object({
          first_name: yup.string().nullable(),
          last_name: yup.string().nullable(),
          email: yup.string().nullable(),
          phone: yup.string().nullable(),
          password: yup.string().nullable(),
        }),
  })
)

const showAlert = (type, title, message) => {
  alert.type = type
  alert.title = title
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => {
    alert.show = true
  })
}

const openCreateModal = () => {
  if (!canCreateBusiness.value) {
    return
  }

  modal.mode = 'create'
  modal.business = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (business) => {
  if (!canEditBusiness.value) {
    return
  }

  modal.mode = 'edit'
  modal.business = business
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.business = null
}

const submitForm = async (values) => {
  try {
    if (modal.mode === 'create') {
      if (!canCreateBusiness.value) {
        return
      }

      await store.createBusiness(values)
      showAlert('success', 'Business registered', 'The new business and its first admin account were created.')
    } else {
      if (!canEditBusiness.value) {
        return
      }

      const payload = { ...values }
      delete payload.owner
      await store.updateBusiness(modal.business.id, payload)
      showAlert('success', 'Business updated', 'Business settings were updated successfully.')
    }

    closeModal()
  } catch (error) {
    showAlert(
      'danger',
      'Save failed',
      error.response?.data?.message || 'Unable to save the business right now.'
    )
  }
}

const handleSearch = async (value) => {
  await store.fetchBusinesses({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchBusinesses({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchBusinesses({ per_page: perPage, page: 1 })
}

onMounted(async () => {
  try {
    await store.fetchBusinesses()
  } catch (error) {
    showAlert(
      'danger',
      'Unable to load',
      error.response?.data?.message || 'Businesses could not be loaded.'
    )
  }
})
</script>
