export default {
  title: 'Brands',
  subtitle: 'Manage product brands used across the catalog.',
  empty: 'No brands found.',
  actions: {
    new: 'New brand',
  },
  buttons: {
    uploadImage: 'Upload image',
    removeImage: 'Remove image',
  },
  filters: {
    search: 'Search brands',
  },
  columns: {
    brand: 'Brand',
    description: 'Description',
    products: 'Products',
    actions: 'Actions',
  },
  fields: {
    name: 'Name',
    description: 'Description',
    imageUrl: 'Image URL',
    imageFile: 'Brand image',
  },
  form: {
    createTitle: 'Create brand',
    editTitle: 'Edit brand',
  },
  validation: {
    fixFormErrors: 'Please check the highlighted fields before saving.',
    fixFormErrorsWithFields: 'Please check before saving: {{fields}}.',
  },
  messages: {
    created: 'Brand created.',
    updated: 'Brand updated.',
    deleted: 'Brand deleted.',
  },
  deleteDialog: {
    title: 'Delete brand',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
