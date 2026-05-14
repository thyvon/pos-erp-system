export default {
  title: 'ក្រុមពន្ធ',
  subtitle: 'ផ្សំអត្រាពន្ធច្រើនជាក្រុមដែលអាចប្រើឡើងវិញសម្រាប់ផលិតផល និងប្រតិបត្តិការ។',
  empty: 'រកមិនឃើញក្រុមពន្ធ។',
  actions: {
    new: 'ក្រុមពន្ធថ្មី',
  },
  filters: {
    search: 'ស្វែងរកក្រុមពន្ធ',
    status: 'ស្ថានភាព',
    allStatuses: 'ស្ថានភាពទាំងអស់',
  },
  columns: {
    name: 'ឈ្មោះ',
    taxRates: 'អត្រាពន្ធ',
    description: 'ពិពណ៌នា',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
  },
  fields: {
    name: 'ឈ្មោះ',
    taxRates: 'អត្រាពន្ធ',
    description: 'ពិពណ៌នា',
    active: 'ក្រុមពន្ធសកម្ម',
  },
  taxRateType: {
    percentage: 'ភាគរយ',
    fixed: 'ចំនួនថេរ',
  },
  badges: {
    rateCount: '{{count}} អត្រា',
    rateCount_plural: '{{count}} អត្រា',
  },
  help: {
    taxRates: 'ជ្រើសរើសអត្រាពន្ធមួយ ឬច្រើន។',
  },
  form: {
    createTitle: 'បង្កើតក្រុមពន្ធ',
    editTitle: 'កែប្រែក្រុមពន្ធ',
  },
  messages: {
    created: 'បានបង្កើតក្រុមពន្ធ។',
    updated: 'បានកែប្រែក្រុមពន្ធ។',
    deleted: 'បានលុបក្រុមពន្ធ។',
  },
  deleteDialog: {
    title: 'លុបក្រុមពន្ធ',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
