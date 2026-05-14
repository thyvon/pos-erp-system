export default {
  title: 'Categories',
  subtitle: 'Organize products into parent and child catalog categories.',
  empty: 'No categories found.',
  actions: {
    new: 'New category',
  },
  filters: {
    search: 'Search categories',
    parent: 'Parent category',
    allParents: 'All parent categories',
  },
  columns: {
    category: 'Category',
    parent: 'Parent',
    shortCode: 'Short code',
    sortOrder: 'Sort order',
    children: 'Children',
    actions: 'Actions',
  },
  fields: {
    parent: 'Parent category',
    name: 'Name',
    code: 'Code',
    shortCode: 'Short code',
    imageUrl: 'Image URL',
    sortOrder: 'Sort order',
  },
  labels: {
    root: 'Root',
  },
  help: {
    parent: 'Leave empty to create a root category. Child categories cannot become parents.',
  },
  form: {
    createTitle: 'Create category',
    editTitle: 'Edit category',
  },
  validation: {
    fixFormErrors: 'Please check the highlighted fields before saving.',
    fixFormErrorsWithFields: 'Please check before saving: {{fields}}.',
  },
  messages: {
    created: 'Category created.',
    updated: 'Category updated.',
    deleted: 'Category deleted.',
  },
  deleteDialog: {
    title: 'Delete category',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
