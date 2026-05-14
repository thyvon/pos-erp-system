export default {
  title: 'Customers',
  subtitle: 'Manage customer records, contact details, balances, and account status.',
  empty: 'No customers found.',
  actions: {
    new: 'New customer',
  },
  filters: {
    search: 'Search customers',
    status: 'Status',
    allStatuses: 'All statuses',
  },
  columns: {
    customer: 'Customer',
    contact: 'Contact',
    type: 'Type',
    balance: 'Balance',
    status: 'Status',
    actions: 'Actions',
  },
  type: {
    individual: 'Individual',
    company: 'Company',
  },
  fields: {
    name: 'Name',
    type: 'Type',
    email: 'Email',
    phone: 'Phone',
    mobile: 'Mobile',
    taxId: 'Tax ID',
    creditLimit: 'Credit limit',
    payTerm: 'Pay term days',
    openingBalance: 'Opening balance',
    status: 'Status',
    notes: 'Notes',
  },
  form: {
    createTitle: 'Create customer',
    editTitle: 'Edit customer',
  },
  messages: {
    created: 'Customer created.',
    updated: 'Customer updated.',
    deleted: 'Customer deleted.',
  },
  deleteDialog: {
    title: 'Delete customer',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
