export default {
  title: 'សាខា',
  subtitle: 'គ្រប់គ្រងទីតាំងអាជីវកម្ម លេខកូដ ព័ត៌មានទំនាក់ទំនង និងសាខាលំនាំដើម។',
  empty: 'រកមិនឃើញសាខា។',
  actions: {
    new: 'សាខាថ្មី',
  },
  filters: {
    search: 'ស្វែងរកសាខា',
    status: 'ស្ថានភាព',
    allStatuses: 'ស្ថានភាពទាំងអស់',
  },
  columns: {
    branch: 'សាខា',
    type: 'ប្រភេទ',
    manager: 'អ្នកគ្រប់គ្រង',
    contact: 'ទំនាក់ទំនង',
    default: 'លំនាំដើម',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
  },
  type: {
    retail: 'លក់រាយ',
    warehouse: 'ឃ្លាំង',
    office: 'ការិយាល័យ',
    online: 'អនឡាញ',
  },
  badges: {
    default: 'លំនាំដើម',
  },
  fields: {
    name: 'ឈ្មោះ',
    code: 'លេខកូដ',
    type: 'ប្រភេទ',
    manager: 'អ្នកគ្រប់គ្រង',
    phone: 'ទូរស័ព្ទ',
    email: 'អ៊ីមែល',
    addressLine1: 'អាសយដ្ឋានជួរទី ១',
    city: 'ទីក្រុង',
    active: 'សាខាសកម្ម',
    default: 'សាខាលំនាំដើម',
    businessHours: 'ម៉ោងអាជីវកម្ម',
    invoiceSettings: 'ការកំណត់វិក្កយបត្រ',
  },
  help: {
    code: 'ទុកទទេដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ។',
    businessHours: 'JSON object ឧទាហរណ៍ {"mon":"08:00-17:00"}។',
    invoiceSettings: 'JSON object ឧទាហរណ៍ {"prefix":"INV"}។',
  },
  placeholders: {
    noManager: 'គ្មានអ្នកគ្រប់គ្រង',
  },
  form: {
    createTitle: 'បង្កើតសាខា',
    editTitle: 'កែប្រែសាខា',
  },
  messages: {
    created: 'បានបង្កើតសាខា។',
    updated: 'បានកែប្រែសាខា។',
    deleted: 'បានលុបសាខា។',
  },
  deleteDialog: {
    title: 'លុបសាខា',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
