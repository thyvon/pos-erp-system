export default {
  title: 'Units',
  subtitle: 'Manage base units and sub-units used for product quantities.',
  empty: 'No units found.',
  emptySubUnits: 'No sub-units added.',
  actions: {
    new: 'New unit',
    addSubUnit: 'Add sub-unit',
    removeSubUnit: 'Remove sub-unit',
  },
  filters: {
    search: 'Search units',
  },
  columns: {
    unit: 'Unit',
    decimal: 'Decimal',
    subUnits: 'Sub-units',
    actions: 'Actions',
  },
  labels: {
    decimalAllowed: 'Decimal allowed',
    wholeOnly: 'Whole numbers only',
    noSubUnits: 'No sub-units',
    subUnitChip: '{{name}} x {{factor}}',
  },
  fields: {
    name: 'Name',
    shortName: 'Short name',
    allowDecimal: 'Allow decimal quantities',
    subUnitName: 'Sub-unit name',
    subUnitShortName: 'Short name',
    conversionFactor: 'Conversion factor',
    conversionFactorLocked: 'Locked — already used in transactions',
  },
  sections: {
    subUnits: 'Sub-units',
  },
  help: {
    subUnits: 'Example: 1 case equals 24 bottles, so the conversion factor is 24.',
  },
  form: {
    createTitle: 'Create unit',
    editTitle: 'Edit unit',
  },
  validation: {
    fixFormErrors: 'Please check the highlighted fields before saving.',
    fixFormErrorsWithFields: 'Please check before saving: {{fields}}.',
  },
  messages: {
    created: 'Unit created.',
    updated: 'Unit updated.',
    deleted: 'Unit deleted.',
  },
  deleteDialog: {
    title: 'Delete unit',
    message: 'Delete {{name}}? This action cannot be undone.',
    confirm: 'Delete',
  },
}
