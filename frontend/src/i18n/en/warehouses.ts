export default {
  title: 'Warehouses',
  subtitle: 'Manage stock locations, linked branches, warehouse type, and inventory behavior.',
  empty: 'No warehouses found.',
  actions: {
    new: 'New warehouse',
  },
  filters: {
    search: 'Search warehouses',
    type: 'Type',
    branch: 'Branch',
    allTypes: 'All types',
    allBranches: 'All branches',
  },
  columns: {
    warehouse: 'Warehouse',
    type: 'Type',
    branch: 'Branch',
    stockPolicy: 'Stock policy',
    default: 'Default',
    status: 'Status',
    actions: 'Actions',
  },
  type: {
    main: 'Main',
    transit: 'Transit',
    returns: 'Returns',
    damaged: 'Damaged',
  },
  badges: {
    default: 'Default',
    negativeStock: 'Negative stock',
  },
  fields: {
    name: 'Name',
    code: 'Code',
    branch: 'Branch',
    type: 'Type',
    active: 'Active warehouse',
    default: 'Default warehouse',
    allowNegativeStock: 'Allow negative stock',
  },
  help: {
    code: 'Leave blank to auto-generate.',
  },
  placeholders: {
    noBranch: 'No branch',
  },
  form: {
    createTitle: 'Create warehouse',
    editTitle: 'Edit warehouse',
  },
  messages: {
    created: 'Warehouse created.',
    updated: 'Warehouse updated.',
    deleted: 'Warehouse deleted.',
  },
  deleteDialog: {
    title: 'Delete warehouse',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
