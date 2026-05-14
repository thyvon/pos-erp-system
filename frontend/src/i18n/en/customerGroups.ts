export default {
  title: 'Customer Groups',
  subtitle: 'Group customers for discounts and price group assignment.',
  empty: 'No customer groups found.',
  actions: {
    new: 'New customer group',
  },
  filters: {
    search: 'Search customer groups',
  },
  columns: {
    name: 'Name',
    discount: 'Discount',
    priceGroup: 'Price group',
    actions: 'Actions',
  },
  fields: {
    name: 'Name',
    discount: 'Discount (%)',
    priceGroup: 'Price group',
  },
  placeholders: {
    noPriceGroup: 'No price group',
  },
  form: {
    createTitle: 'Create customer group',
    editTitle: 'Edit customer group',
  },
  messages: {
    created: 'Customer group created.',
    updated: 'Customer group updated.',
    deleted: 'Customer group deleted.',
  },
  deleteDialog: {
    title: 'Delete customer group',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
