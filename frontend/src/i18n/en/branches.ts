export default {
  title: 'Branches',
  subtitle: 'Manage business locations, codes, contact details, and default branch behavior.',
  empty: 'No branches found.',
  actions: {
    new: 'New branch',
  },
  filters: {
    search: 'Search branches',
    status: 'Status',
    allStatuses: 'All statuses',
  },
  columns: {
    branch: 'Branch',
    type: 'Type',
    manager: 'Manager',
    contact: 'Contact',
    default: 'Default',
    status: 'Status',
    actions: 'Actions',
  },
  type: {
    retail: 'Retail',
    warehouse: 'Warehouse',
    office: 'Office',
    online: 'Online',
  },
  badges: {
    default: 'Default',
  },
  fields: {
    name: 'Name',
    code: 'Code',
    type: 'Type',
    manager: 'Manager',
    phone: 'Phone',
    email: 'Email',
    addressLine1: 'Address line 1',
    city: 'City',
    active: 'Active branch',
    default: 'Default branch',
    businessHours: 'Business hours',
    invoiceSettings: 'Invoice settings',
  },
  help: {
    code: 'Leave blank to auto-generate.',
    businessHours: 'JSON object, for example {"mon":"08:00-17:00"}.',
    invoiceSettings: 'JSON object, for example {"prefix":"INV"}.',
  },
  placeholders: {
    noManager: 'No manager',
  },
  form: {
    createTitle: 'Create branch',
    editTitle: 'Edit branch',
  },
  messages: {
    created: 'Branch created.',
    updated: 'Branch updated.',
    deleted: 'Branch deleted.',
  },
  deleteDialog: {
    title: 'Delete branch',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
