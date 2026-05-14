export default {
  title: 'Suppliers',
  subtitle: 'Manage supplier records, contact details, balances, and account status.',
  empty: 'No suppliers found.',
  actions: {
    new: 'New supplier',
  },
  filters: {
    search: 'Search suppliers',
    status: 'Status',
    allStatuses: 'All statuses',
  },
  columns: {
    supplier: 'Supplier',
    contact: 'Contact',
    company: 'Company',
    balance: 'Balance',
    status: 'Status',
    actions: 'Actions',
  },
  fields: {
    name: 'Name',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    mobile: 'Mobile',
    taxId: 'Tax ID',
    village: 'Village',
    commune: 'Commune',
    district: 'District',
    province_city: 'Province / City',
    country: 'Country',
    payTerm: 'Pay term days',
    openingBalance: 'Opening balance',
    status: 'Status',
    notes: 'Notes',
    documents: 'Documents',
  },
  placeholders: {
    documents: 'https://example.com/document.pdf',
  },
  help: {
    documents: 'Add one document URL or reference per line.',
  },
  form: {
    createTitle: 'Create supplier',
    editTitle: 'Edit supplier',
  },
  customFields: {
    title: 'Custom fields',
    loading: 'Loading custom fields...',
    noSelection: 'No selection',
  },
  validation: {
    fixFormErrors: 'Please check the highlighted fields before saving.',
    fixFormErrorsWithFields: 'Please check before saving: {{fields}}.',
    requiredCustomField: '{{field}} is required',
  },
  messages: {
    created: 'Supplier created.',
    updated: 'Supplier updated.',
    deleted: 'Supplier deleted.',
  },
  deleteDialog: {
    title: 'Delete supplier',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
