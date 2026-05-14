export default {
  title: 'Tax Groups',
  subtitle: 'Combine multiple tax rates into reusable groups for products and transactions.',
  empty: 'No tax groups found.',
  actions: {
    new: 'New tax group',
  },
  filters: {
    search: 'Search tax groups',
    status: 'Status',
    allStatuses: 'All statuses',
  },
  columns: {
    name: 'Name',
    taxRates: 'Tax rates',
    description: 'Description',
    status: 'Status',
    actions: 'Actions',
  },
  fields: {
    name: 'Name',
    taxRates: 'Tax rates',
    description: 'Description',
    active: 'Active tax group',
  },
  taxRateType: {
    percentage: 'Percentage',
    fixed: 'Fixed amount',
  },
  badges: {
    rateCount: '{{count}} rate',
    rateCount_plural: '{{count}} rates',
  },
  help: {
    taxRates: 'Select one or more tax rates.',
  },
  form: {
    createTitle: 'Create tax group',
    editTitle: 'Edit tax group',
  },
  messages: {
    created: 'Tax group created.',
    updated: 'Tax group updated.',
    deleted: 'Tax group deleted.',
  },
  deleteDialog: {
    title: 'Delete tax group',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
