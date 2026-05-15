const rackLocations = {
  title: 'Rack Locations',
  subtitle: 'Manage warehouse rack, aisle, shelf, and bin locations used by catalog products.',
  empty: 'No rack locations found.',
  actions: {
    new: 'New rack location',
  },
  filters: {
    search: 'Search rack locations',
    warehouse: 'Warehouse',
    allWarehouses: 'All warehouses',
  },
  columns: {
    location: 'Location',
    warehouse: 'Warehouse',
    branch: 'Branch',
    description: 'Description',
    actions: 'Actions',
  },
  fields: {
    warehouse: 'Warehouse',
    name: 'Name',
    code: 'Code',
    description: 'Description',
  },
  form: {
    createTitle: 'Create rack location',
    editTitle: 'Edit rack location',
  },
  messages: {
    created: 'Rack location created.',
    updated: 'Rack location updated.',
    deleted: 'Rack location deleted.',
    noWarehouses: 'Create a warehouse before adding rack locations.',
  },
  deleteDialog: {
    title: 'Delete rack location',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}

export default rackLocations
