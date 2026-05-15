export default {
  title: 'Price Groups',
  subtitle: 'Manage selling price groups used by customers and product pricing.',
  empty: 'No price groups found.',
  actions: {
    new: 'New price group',
  },
  filters: {
    search: 'Search price groups',
  },
  columns: {
    name: 'Name',
    description: 'Description',
    default: 'Default',
    customerGroups: 'Customer groups',
    actions: 'Actions',
  },
  labels: {
    default: 'Default',
    standard: 'Standard',
  },
  fields: {
    name: 'Name',
    description: 'Description',
    isDefault: 'Use as default price group',
  },
  form: {
    createTitle: 'Create price group',
    editTitle: 'Edit price group',
  },
  messages: {
    created: 'Price group created.',
    updated: 'Price group updated.',
    deleted: 'Price group deleted.',
  },
  deleteDialog: {
    title: 'Delete price group',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
