export default {
  title: 'អត្រាពន្ធ',
  subtitle: 'គ្រប់គ្រងអត្រាពន្ធភាគរយ និងចំនួនថេរ ដែលប្រើសម្រាប់ផលិតផល ការលក់ និងក្រុមពន្ធ។',
  empty: 'រកមិនឃើញអត្រាពន្ធ។',
  actions: {
    new: 'អត្រាពន្ធថ្មី',
  },
  filters: {
    search: 'ស្វែងរកអត្រាពន្ធ',
    type: 'ប្រភេទ',
    status: 'ស្ថានភាព',
    allTypes: 'ប្រភេទទាំងអស់',
    allStatuses: 'ស្ថានភាពទាំងអស់',
  },
  columns: {
    name: 'ឈ្មោះ',
    type: 'ប្រភេទ',
    rate: 'អត្រា',
    default: 'លំនាំដើម',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
  },
  type: {
    percentage: 'ភាគរយ',
    fixed: 'ចំនួនថេរ',
  },
  badges: {
    default: 'លំនាំដើម',
  },
  fields: {
    name: 'ឈ្មោះ',
    type: 'ប្រភេទ',
    rate: 'អត្រា',
    active: 'អត្រាពន្ធសកម្ម',
    default: 'អត្រាពន្ធលំនាំដើម',
  },
  form: {
    createTitle: 'បង្កើតអត្រាពន្ធ',
    editTitle: 'កែប្រែអត្រាពន្ធ',
  },
  messages: {
    created: 'បានបង្កើតអត្រាពន្ធ។',
    updated: 'បានកែប្រែអត្រាពន្ធ។',
    deleted: 'បានលុបអត្រាពន្ធ។',
  },
  deleteDialog: {
    title: 'លុបអត្រាពន្ធ',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
