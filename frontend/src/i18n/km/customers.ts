export default {
  title: 'អតិថិជន',
  subtitle: 'គ្រប់គ្រងព័ត៌មានអតិថិជន ទំនាក់ទំនង សមតុល្យ និងស្ថានភាពគណនី។',
  empty: 'រកមិនឃើញអតិថិជន។',
  actions: {
    new: 'អតិថិជនថ្មី',
  },
  filters: {
    search: 'ស្វែងរកអតិថិជន',
    status: 'ស្ថានភាព',
    allStatuses: 'ស្ថានភាពទាំងអស់',
  },
  columns: {
    customer: 'អតិថិជន',
    contact: 'ទំនាក់ទំនង',
    type: 'ប្រភេទ',
    balance: 'សមតុល្យ',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
  },
  type: {
    individual: 'បុគ្គល',
    company: 'ក្រុមហ៊ុន',
  },
  fields: {
    name: 'ឈ្មោះ',
    type: 'ប្រភេទ',
    email: 'អ៊ីមែល',
    phone: 'ទូរស័ព្ទ',
    mobile: 'ទូរស័ព្ទចល័ត',
    taxId: 'លេខពន្ធ',
    creditLimit: 'កម្រិតឥណទាន',
    payTerm: 'ថ្ងៃកំណត់ទូទាត់',
    openingBalance: 'សមតុល្យដើម',
    status: 'ស្ថានភាព',
    notes: 'កំណត់ចំណាំ',
  },
  form: {
    createTitle: 'បង្កើតអតិថិជន',
    editTitle: 'កែប្រែអតិថិជន',
  },
  messages: {
    created: 'បានបង្កើតអតិថិជន។',
    updated: 'បានកែប្រែអតិថិជន។',
    deleted: 'បានលុបអតិថិជន។',
  },
  deleteDialog: {
    title: 'លុបអតិថិជន',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
