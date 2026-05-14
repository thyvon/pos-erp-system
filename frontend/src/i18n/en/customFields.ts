export default {
  title: 'Custom Fields',
  subtitle: 'Manage extra fields for products, customers, and suppliers.',
  empty: 'No custom fields found.',
  actions: {
    new: 'New custom field',
  },
  filters: {
    search: 'Search custom fields',
    module: 'Module',
    allModules: 'All modules',
  },
  columns: {
    field: 'Field',
    module: 'Module',
    type: 'Type',
    options: 'Options',
    required: 'Required',
    sortOrder: 'Sort order',
    actions: 'Actions',
  },
  module: {
    product: 'Product',
    customer: 'Customer',
    supplier: 'Supplier',
  },
  fieldType: {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    select: 'Select',
    checkbox: 'Checkbox',
  },
  fields: {
    module: 'Module',
    fieldName: 'Field name',
    fieldLabel: 'Field label',
    fieldType: 'Field type',
    options: 'Options',
    required: 'Required field',
    sortOrder: 'Sort order',
  },
  badges: {
    yes: 'Yes',
    no: 'No',
    moreOptions: '+{{count}} more',
  },
  help: {
    fieldName: 'Use lowercase letters, numbers, and underscores. Start with a letter.',
    options: 'Add one option per line.',
  },
  placeholders: {
    options: 'Retail\nWholesale\nVIP',
  },
  form: {
    createTitle: 'Create custom field',
    editTitle: 'Edit custom field',
  },
  messages: {
    created: 'Custom field created.',
    updated: 'Custom field updated.',
    deleted: 'Custom field deleted.',
  },
  deleteDialog: {
    title: 'Delete custom field',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
