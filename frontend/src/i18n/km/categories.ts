export default {
  title: 'ប្រភេទផលិតផល',
  subtitle: 'រៀបចំផលិតផលជាប្រភេទមេ និងប្រភេទរងក្នុងកាតាឡុក។',
  empty: 'រកមិនឃើញប្រភេទផលិតផល។',
  actions: {
    new: 'ប្រភេទថ្មី',
  },
  filters: {
    search: 'ស្វែងរកប្រភេទ',
    parent: 'ប្រភេទមេ',
    allParents: 'ប្រភេទមេទាំងអស់',
  },
  columns: {
    category: 'ប្រភេទ',
    parent: 'ប្រភេទមេ',
    shortCode: 'កូដខ្លី',
    sortOrder: 'លំដាប់',
    children: 'ប្រភេទរង',
    actions: 'សកម្មភាព',
  },
  fields: {
    parent: 'ប្រភេទមេ',
    name: 'ឈ្មោះ',
    code: 'កូដ',
    shortCode: 'កូដខ្លី',
    imageUrl: 'URL រូបភាព',
    sortOrder: 'លំដាប់',
  },
  labels: {
    root: 'ប្រភេទមេ',
  },
  help: {
    parent: 'ទុកទំនេរ ដើម្បីបង្កើតប្រភេទមេ។ ប្រភេទរងមិនអាចក្លាយជាប្រភេទមេបានទេ។',
  },
  form: {
    createTitle: 'បង្កើតប្រភេទ',
    editTitle: 'កែប្រែប្រភេទ',
  },
  validation: {
    fixFormErrors: 'សូមពិនិត្យវាលដែលបានសម្គាល់ មុនពេលរក្សាទុក។',
    fixFormErrorsWithFields: 'សូមពិនិត្យមុនពេលរក្សាទុក៖ {{fields}}។',
  },
  messages: {
    created: 'បានបង្កើតប្រភេទ។',
    updated: 'បានកែប្រែប្រភេទ។',
    deleted: 'បានលុបប្រភេទ។',
  },
  deleteDialog: {
    title: 'លុបប្រភេទ',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
