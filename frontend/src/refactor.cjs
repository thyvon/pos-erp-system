const fs = require('fs');
const path = 'd:/Project/erp-system/frontend/src/views/PosView.vue';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import { useAuthStore } from '@stores/auth'",
  "import { storeToRefs } from 'pinia'\nimport { useAuthStore } from '@stores/auth'\nimport { usePosStore } from '@stores/pos'"
);

// 2. Remove default scopes
content = content.replace("const DEFAULT_DISCOUNT_SCOPE = 'sale'\nconst DEFAULT_TAX_SCOPE = 'sale'\n", '');

// 3. Replace cart, form, paymentRows setup with store instantiation
const searchCartStr = `const cart = ref([])
const filterMode = ref('category')
const activeFilterId = ref('')
const productSearch = ref('')

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const lineModal = reactive({ show: false, item: null })
const form = reactive({
  branch_id: '',
  warehouse_id: '',
  customer_id: '',
  cash_register_session_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  discount_scope: DEFAULT_DISCOUNT_SCOPE,
  discount_type: '',
  discount_amount: 0,
  tax_scope: DEFAULT_TAX_SCOPE,
  tax_rate_id: '',
  tax_rate_type: '',
  tax_rate: 0,
  tax_type: 'exclusive',
  notes: '',
})
const createPaymentRow = (overrides = {}) => ({
  payment_account_id: '',
  amount: 0,
  method: 'cash',
  reference: '',
  payment_date: new Date().toISOString().slice(0, 10),
  note: '',
  ...overrides,
})
const paymentRows = ref([createPaymentRow()])`;

const replaceCartStr = `const posStore = usePosStore()
const { cart, form, paymentRows, showLineDiscountControls, summarySubtotal, subtotal, lineDiscountTotal, orderDiscountAmount, totalDiscountAmount, documentTaxAmount, taxTotal, grandTotal, totalQuantity, totalPaid, changeDue } = storeToRefs(posStore)
const { createPaymentRow, lineGross, lineDiscountAmount, lineTaxable, lineBaseAmount, lineTaxAmount, lineNetTotal, lineTotal, clearCart: storeClearCart } = posStore

const filterMode = ref('category')
const activeFilterId = ref('')
const productSearch = ref('')

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const lineModal = reactive({ show: false, item: null })`;

content = content.replace(searchCartStr, replaceCartStr);

// 4. Remove calculations
const startCalcStr = "const showLineDiscountControls = computed(() => form.discount_scope === 'line')";
const endCalcStr = "const changeDue = computed(() => Math.max(0, totalPaid.value - grandTotal.value))";

const startIndex = content.indexOf(startCalcStr);
const endIndex = content.indexOf(endCalcStr) + endCalcStr.length;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex + 1); // +1 to remove newline
}

// 5. Remove clearCart
const startClearCart = "const clearCart = () => {";
const endClearCart = "  paymentModalOpen.value = false\n}";
const startClearIndex = content.indexOf(startClearCart);
const endClearIndex = content.indexOf(endClearCart) + endClearCart.length;

if (startClearIndex !== -1 && endClearIndex !== -1) {
    content = content.substring(0, startClearIndex) + "const clearCart = () => {\n  storeClearCart()\n  closeLineModal()\n  paymentModalOpen.value = false\n  attemptedSubmit.value = false\n}" + content.substring(endClearIndex);
    // Wait, in my original logic, I replaced `clearCart` completely. Let's just override it to call the store and handle UI state.
}

// 6. Remove watch
const watchStr = `watch(grandTotal, (value) => {
  if (!paymentRows.value[0]?.amount || totalPaid.value < Number(value)) {
    paymentRows.value[0].amount = Number((Number(paymentRows.value[0].amount || 0) + (value - totalPaid.value)).toFixed(2))
  }
})
`;
content = content.replace(watchStr, '');

fs.writeFileSync(path, content, 'utf8');
console.log('done');
