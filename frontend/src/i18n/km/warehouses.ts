export default {
  title: 'ឃ្លាំង',
  subtitle: 'គ្រប់គ្រងទីតាំងស្តុក សាខាដែលភ្ជាប់ ប្រភេទឃ្លាំង និងអាកប្បកិរិយាសន្និធិ។',
  empty: 'រកមិនឃើញឃ្លាំង។',
  actions: {
    new: 'ឃ្លាំងថ្មី',
  },
  filters: {
    search: 'ស្វែងរកឃ្លាំង',
    type: 'ប្រភេទ',
    branch: 'សាខា',
    allTypes: 'ប្រភេទទាំងអស់',
    allBranches: 'សាខាទាំងអស់',
  },
  columns: {
    warehouse: 'ឃ្លាំង',
    type: 'ប្រភេទ',
    branch: 'សាខា',
    stockPolicy: 'គោលការណ៍ស្តុក',
    default: 'លំនាំដើម',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
  },
  type: {
    main: 'ចម្បង',
    transit: 'កំពុងដឹកជញ្ជូន',
    returns: 'ទំនិញត្រឡប់',
    damaged: 'ខូចខាត',
  },
  badges: {
    default: 'លំនាំដើម',
    negativeStock: 'អនុញ្ញាតស្តុកអវិជ្ជមាន',
  },
  fields: {
    name: 'ឈ្មោះ',
    code: 'លេខកូដ',
    branch: 'សាខា',
    type: 'ប្រភេទ',
    active: 'ឃ្លាំងសកម្ម',
    default: 'ឃ្លាំងលំនាំដើម',
    allowNegativeStock: 'អនុញ្ញាតស្តុកអវិជ្ជមាន',
  },
  help: {
    code: 'ទុកទទេដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ។',
  },
  placeholders: {
    noBranch: 'គ្មានសាខា',
  },
  form: {
    createTitle: 'បង្កើតឃ្លាំង',
    editTitle: 'កែប្រែឃ្លាំង',
  },
  messages: {
    created: 'បានបង្កើតឃ្លាំង។',
    updated: 'បានកែប្រែឃ្លាំង។',
    deleted: 'បានលុបឃ្លាំង។',
  },
  deleteDialog: {
    title: 'លុបឃ្លាំង',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
