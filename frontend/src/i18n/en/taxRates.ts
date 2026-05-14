export default {
  title: 'Tax Rates',
  subtitle: 'Manage percentage and fixed tax rates used by products, sales, and tax groups.',
  empty: 'No tax rates found.',
  actions: {
    new: 'New tax rate',
  },
  filters: {
    search: 'Search tax rates',
    type: 'Type',
    status: 'Status',
    allTypes: 'All types',
    allStatuses: 'All statuses',
  },
  columns: {
    name: 'Name',
    type: 'Type',
    rate: 'Rate',
    default: 'Default',
    status: 'Status',
    actions: 'Actions',
  },
  type: {
    percentage: 'Percentage',
    fixed: 'Fixed amount',
  },
  badges: {
    default: 'Default',
  },
  fields: {
    name: 'Name',
    type: 'Type',
    rate: 'Rate',
    active: 'Active tax rate',
    default: 'Default tax rate',
  },
  form: {
    createTitle: 'Create tax rate',
    editTitle: 'Edit tax rate',
  },
  messages: {
    created: 'Tax rate created.',
    updated: 'Tax rate updated.',
    deleted: 'Tax rate deleted.',
  },
  deleteDialog: {
    title: 'Delete tax rate',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
