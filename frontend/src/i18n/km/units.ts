export default {
  title: 'ខ្នាត',
  subtitle: 'គ្រប់គ្រងខ្នាតមូលដ្ឋាន និងខ្នាតរងសម្រាប់បរិមាណផលិតផល។',
  empty: 'រកមិនឃើញខ្នាត។',
  emptySubUnits: 'មិនទាន់មានខ្នាតរង។',
  actions: {
    new: 'ខ្នាតថ្មី',
    addSubUnit: 'បន្ថែមខ្នាតរង',
    removeSubUnit: 'លុបខ្នាតរង',
  },
  filters: {
    search: 'ស្វែងរកខ្នាត',
  },
  columns: {
    unit: 'ខ្នាត',
    decimal: 'ទសភាគ',
    subUnits: 'ខ្នាតរង',
    actions: 'សកម្មភាព',
  },
  labels: {
    decimalAllowed: 'អនុញ្ញាតទសភាគ',
    wholeOnly: 'តែចំនួនគត់',
    noSubUnits: 'គ្មានខ្នាតរង',
    subUnitChip: '{{name}} x {{factor}}',
  },
  fields: {
    name: 'ឈ្មោះ',
    shortName: 'ឈ្មោះកាត់',
    allowDecimal: 'អនុញ្ញាតបរិមាណទសភាគ',
    subUnitName: 'ឈ្មោះខ្នាតរង',
    subUnitShortName: 'ឈ្មោះកាត់',
    conversionFactor: 'មេគុណបម្លែង',
    conversionFactorLocked: 'ចាក់សោ — បានប្រើក្នុងប្រតិបត្តិការរួចហើយ',
  },
  sections: {
    subUnits: 'ខ្នាតរង',
  },
  help: {
    subUnits: 'ឧទាហរណ៍៖ 1 កេស ស្មើ 24 ដប ដូច្នេះមេគុណបម្លែងគឺ 24។',
  },
  form: {
    createTitle: 'បង្កើតខ្នាត',
    editTitle: 'កែប្រែខ្នាត',
  },
  validation: {
    fixFormErrors: 'សូមពិនិត្យវាលដែលបានសម្គាល់ មុនពេលរក្សាទុក។',
    fixFormErrorsWithFields: 'សូមពិនិត្យមុនពេលរក្សាទុក៖ {{fields}}។',
  },
  messages: {
    created: 'បានបង្កើតខ្នាត។',
    updated: 'បានកែប្រែខ្នាត។',
    deleted: 'បានលុបខ្នាត។',
  },
  deleteDialog: {
    title: 'លុបខ្នាត',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
