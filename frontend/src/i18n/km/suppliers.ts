export default {
  title: 'អ្នកផ្គត់ផ្គង់',
  subtitle: 'គ្រប់គ្រងព័ត៌មានអ្នកផ្គត់ផ្គង់ ទំនាក់ទំនង សមតុល្យ និងស្ថានភាពគណនី។',
  empty: 'រកមិនឃើញអ្នកផ្គត់ផ្គង់។',
  actions: {
    new: 'អ្នកផ្គត់ផ្គង់ថ្មី',
  },
  filters: {
    search: 'ស្វែងរកអ្នកផ្គត់ផ្គង់',
    status: 'ស្ថានភាព',
    allStatuses: 'ស្ថានភាពទាំងអស់',
  },
  columns: {
    supplier: 'អ្នកផ្គត់ផ្គង់',
    contact: 'ទំនាក់ទំនង',
    company: 'ក្រុមហ៊ុន',
    balance: 'សមតុល្យ',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
  },
  fields: {
    name: 'ឈ្មោះ',
    company: 'ក្រុមហ៊ុន',
    email: 'អ៊ីមែល',
    phone: 'ទូរស័ព្ទ',
    mobile: 'ទូរស័ព្ទចល័ត',
    taxId: 'លេខពន្ធ',
    village: 'ភូមិ',
    commune: 'ឃុំ / សង្កាត់',
    district: 'ស្រុក / ខណ្ឌ',
    province_city: 'ខេត្ត / រាជធានី',
    country: 'ប្រទេស',
    payTerm: 'ថ្ងៃកំណត់ទូទាត់',
    openingBalance: 'សមតុល្យដើម',
    status: 'ស្ថានភាព',
    notes: 'កំណត់ចំណាំ',
    documents: 'ឯកសារ',
  },
  placeholders: {
    documents: 'https://example.com/document.pdf',
  },
  help: {
    documents: 'បញ្ចូល URL ឬលេខយោងឯកសារមួយក្នុងមួយបន្ទាត់។',
  },
  form: {
    createTitle: 'បង្កើតអ្នកផ្គត់ផ្គង់',
    editTitle: 'កែប្រែអ្នកផ្គត់ផ្គង់',
  },
  customFields: {
    title: 'វាលផ្ទាល់ខ្លួន',
    loading: 'កំពុងផ្ទុកវាលផ្ទាល់ខ្លួន...',
    noSelection: 'មិនជ្រើសរើស',
  },
  validation: {
    fixFormErrors: 'សូមពិនិត្យវាលដែលបានសម្គាល់ មុនពេលរក្សាទុក។',
    fixFormErrorsWithFields: 'សូមពិនិត្យមុនពេលរក្សាទុក៖ {{fields}}។',
    requiredCustomField: 'ត្រូវបំពេញ {{field}}',
  },
  messages: {
    created: 'បានបង្កើតអ្នកផ្គត់ផ្គង់។',
    updated: 'បានកែប្រែអ្នកផ្គត់ផ្គង់។',
    deleted: 'បានលុបអ្នកផ្គត់ផ្គង់។',
  },
  deleteDialog: {
    title: 'លុបអ្នកផ្គត់ផ្គង់',
    message: 'លុប {{name}}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    confirm: 'លុប',
  },
}
