<template>
  <AppModal
    :show="show"
    :title="mode === 'quotation' ? t('sales.documentModal.quotationTitle') : t('sales.documentModal.saleTitle')"
    :icon="mode === 'quotation' ? t('sales.documentModal.quotationIcon') : t('sales.documentModal.saleIcon')"
    size="xl"
    @close="$emit('close')"
  >
    <SaleDocumentForm
      :show="show"
      :mode="mode"
      :saving="saving"
      :default-type="defaultType"
      :document-type-options="documentTypeOptions"
      :branches="branches"
      :warehouses="warehouses"
      :customers="customers"
      :products="products"
      :register-sessions="registerSessions"
      :tax-rates="taxRates"
      @cancel="$emit('close')"
      @submit="$emit('submit', $event)"
    />
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import SaleDocumentForm from '@components/sales/SaleDocumentForm.vue'
import AppModal from '@components/ui/AppModal.vue'

defineProps({
  show: { type: Boolean, default: false },
  mode: { type: String, default: 'sale' },
  saving: { type: Boolean, default: false },
  defaultType: { type: String, default: 'invoice' },
  documentTypeOptions: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  warehouses: { type: Array, default: () => [] },
  customers: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  registerSessions: { type: Array, default: () => [] },
  taxRates: { type: Array, default: () => [] },
})

defineEmits(['close', 'submit'])

const { t } = useI18n()
</script>
