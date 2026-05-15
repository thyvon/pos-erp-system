const variationTemplates = {
  title: 'Variation Templates',
  subtitle: 'Manage reusable product variation sets such as size, color, and material.',
  empty: 'No variation templates found.',
  emptyValues: 'Add at least one variation value.',
  actions: {
    new: 'New variation template',
    addValue: 'Add value',
    removeValue: 'Remove value',
  },
  filters: {
    search: 'Search variation templates',
  },
  columns: {
    name: 'Name',
    values: 'Values',
    valueCount: 'Value count',
    actions: 'Actions',
  },
  labels: {
    noValues: 'No values',
  },
  fields: {
    name: 'Name',
    valueName: 'Value name',
    sortOrder: 'Sort order',
  },
  sections: {
    values: 'Variation values',
  },
  help: {
    values: 'Examples: Small, Medium, Large or Red, Blue, Black.',
  },
  form: {
    createTitle: 'Create variation template',
    editTitle: 'Edit variation template',
  },
  validation: {
    fixFormErrors: 'Please check the highlighted fields before saving.',
    fixFormErrorsWithFields: 'Please check before saving: {{fields}}.',
  },
  messages: {
    created: 'Variation template created.',
    updated: 'Variation template updated.',
    deleted: 'Variation template deleted.',
  },
  deleteDialog: {
    title: 'Delete variation template',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}

export default variationTemplates
