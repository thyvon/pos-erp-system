'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AccountBalanceWalletOutlined, ArrowBack, CategoryOutlined, Close, ReceiptLongOutlined, Search, SettingsOutlined } from '@/components/ui/icons'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useBrandsQuery } from '@/features/brands/hooks'
import { useCategoriesQuery } from '@/features/categories/hooks'
import { useCustomerGroupsQuery } from '@/features/customer-groups/hooks'
import { CustomerFormDialog } from '@/features/customers/CustomerFormDialog'
import { useCreateCustomerMutation, useCustomersQuery } from '@/features/customers/hooks'
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks'
import { inventoryApi } from '@/features/inventory/api'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { inventoryKeys } from '@/features/inventory/hooks'
import {
  buildDirectPaymentLines,
  buildSalePayload,
  buildSalePaymentChangePayloads,
  calculateSaleTotals,
  createClientRequestId,
  directPaymentLineBaseAmount,
  emptySaleFormValues,
  newDirectPaymentLine,
  round,
  saleFormValuesFromSale,
  toNumber,
} from './formHelpers'
import { saleFormSchema, type SaleFormInput, type SaleFormValues } from './schema'
import {
  useCashRegistersQuery,
  useCreateCashRegisterMutation,
  useCreateSaleMutation,
  useOpenCashRegisterSessionMutation,
  useSaleQuery,
  useSalesQuery,
  useUpdateSaleWithPaymentsMutation,
} from './hooks'
import type { CashRegister, SaleFilters } from '@/types/sales'
import type { Customer, CustomerPayload } from '@/types/customer'
import type { InventoryProductLookupItem } from '@/types/inventory'
import type { PriceGroup } from '@/types/priceGroup'
import type { Product } from '@/types/product'
import type { TaxRate } from '@/types/taxRate'
import { useDebouncedValue } from '@/utils/useDebouncedValue'
import { printInvoice } from './printInvoice'
import { PosCartSection } from './components/PosCartSection'
import { CashRegisterSessionDialog } from './components/CashRegisterSessionDialog'
import { PosHeaderFields } from './components/PosHeaderFields'
import { PosPaymentSection } from './components/PosPaymentSection'
import { PosProductGallery, type PosProductTab } from './components/PosProductGallery'
import { usePriceGroupsQuery } from '@/features/price-groups/hooks'
import { useProductsQuery } from '@/features/products/hooks'
import { useAppCurrency, useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useDefaultWarehouseSelection } from '@/features/warehouses/useDefaultWarehouseSelection'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useSettingsGroupQuery } from '@/features/settings/hooks'
import { buildLayoutSurfaceColors, getLayoutMetrics } from '@/theme'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'

let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext
      audioContext = new AudioCtx()
    }
    return audioContext
  } catch {
    return null
  }
}

const playAddProductSound = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  } catch {
    // Fallback if oscillator creation fails
  }
}

const discountTypes = ['fixed', 'percentage'] as const
const taxScopes = ['line', 'sale'] as const
const taxTypes = ['exclusive', 'inclusive'] as const

const footerButtonSx = {
  height: 'var(--app-control-height)',
  minHeight: 'var(--app-control-height)',
  whiteSpace: 'nowrap',
  flex: '0 0 auto',
  px: 1,
} as const

const recentTransactionRowsPerPageOptions = [10, 25, 50]

function priceGroupLabel(group: PriceGroup) {
  return group.name
}

function taxRateLabel(rate: TaxRate) {
  return `${rate.name} (${rate.rate}${rate.type === 'percentage' ? '%' : ''})`
}

function cashRegisterLabel(register: CashRegister) {
  return [register.name, register.branch?.name].filter(Boolean).join(' / ')
}

function productSearchTerm(product: Product) {
  return product.sku || product.variations?.[0]?.sku || product.name
}

interface PosFormPageProps {
  saleId?: string
}

export function PosFormPage({ saleId }: PosFormPageProps) {
  const { t, i18n } = useTranslation(['sales', 'common', 'customers'])
  const router = useRouter()
  const queryClient = useQueryClient()
  const theme = useTheme()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const currentUser = useAuthStore((state) => state.user)
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen)
  const topbarTheme = useUIStore((state) => state.topbarTheme)
  const layoutSize = useUIStore((state) => state.layoutSize)
  const posSettingsQuery = useSettingsGroupQuery('pos')
  const posSettings = posSettingsQuery.data
  const [serverError, setServerError] = useState('')
  const [productTab, setProductTab] = useState<PosProductTab>('featured')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [productGallerySearch, setProductGallerySearch] = useState('')
  const [addingTileProductIds, setAddingTileProductIds] = useState<string[]>([])
  const [productGalleryOpen, setProductGalleryOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingSummary, setEditingSummary] = useState<'discount' | 'tax' | 'shipping' | null>(null)
  const [cashRegisterDialogOpen, setCashRegisterDialogOpen] = useState(false)
  const [cashRegisterReportOpen, setCashRegisterReportOpen] = useState(false)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null)
  const [cashRegisterMode, setCashRegisterMode] = useState<'existing' | 'new'>('existing')
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState('')
  const [newCashRegisterName, setNewCashRegisterName] = useState('')
  const [openingFloat, setOpeningFloat] = useState(0)
  const [cashRegisterNotes, setCashRegisterNotes] = useState('')
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId())
  const [removedPaymentIds, setRemovedPaymentIds] = useState<string[]>([])
  const [recentTransactionsOpen, setRecentTransactionsOpen] = useState(false)
  const [recentTransactionsSearch, setRecentTransactionsSearch] = useState('')
  const [recentTransactionsPage, setRecentTransactionsPage] = useState(0)
  const [recentTransactionsPerPage, setRecentTransactionsPerPage] = useState(10)
  const [printingSaleId, setPrintingSaleId] = useState<string | null>(null)
  const isEdit = !!saleId
  const currency = useAppCurrency()
  const currencyFormatter = useCurrencyFormatter()
  const dateFormat = useAppDateFormat()
  const debouncedProductGallerySearch = useDebouncedValue(productGallerySearch, 250)
  const layoutMetrics = getLayoutMetrics(layoutSize)
  const posTopbarColors = buildLayoutSurfaceColors(theme, topbarTheme)
  const posTopbarActionSx = {
    height: 'var(--app-control-height)',
    minHeight: 'var(--app-control-height)',
    color: posTopbarColors.text,
    bgcolor: posTopbarColors.buttonBg,
    borderColor: posTopbarColors.border,
    whiteSpace: 'nowrap',
    px: 1.5,
    flex: '0 0 auto',
    '&:hover': {
      bgcolor: posTopbarColors.buttonHover,
      borderColor: posTopbarColors.border,
    },
  }
  const posTopbarFieldSx = {
    '& .MuiOutlinedInput-root': {
      height: 'var(--app-control-height)',
      minHeight: 'var(--app-control-height)',
      color: posTopbarColors.text,
      '& fieldset': {
        borderColor: posTopbarColors.border,
      },
      '&:hover fieldset': {
        borderColor: posTopbarColors.border,
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
      },
    },
    '& .MuiOutlinedInput-input::placeholder': {
      color: posTopbarColors.muted,
      opacity: 1,
    },
  }
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date())

  const recentTransactionsFilters: SaleFilters = useMemo(
    () => ({
      search: recentTransactionsSearch || undefined,
      type: 'pos_sale',
      page: recentTransactionsPage + 1,
      per_page: recentTransactionsPerPage,
    }),
    [recentTransactionsPage, recentTransactionsPerPage, recentTransactionsSearch],
  )

  const saleQuery = useSaleQuery(saleId ?? null)
  const recentTransactionsQuery = useSalesQuery(recentTransactionsFilters, recentTransactionsOpen)
  const warehousesQuery = useWarehousesQuery({ per_page: 100 })
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })
  const customerGroupsQuery = useCustomerGroupsQuery({ per_page: 100 }, customerDialogOpen && can('customers.create'))
  const customerCustomFieldsQuery = useCustomFieldsQuery(
    { module: 'customer', per_page: 100 },
    customerDialogOpen && can('customers.create'),
  )
  const categoriesQuery = useCategoriesQuery({ per_page: 100 })
  const brandsQuery = useBrandsQuery({ per_page: 100 })
  const productsQuery = useProductsQuery({
    search: debouncedProductGallerySearch || undefined,
    is_active: true,
    per_page: 30,
    category_id: productTab === 'category' ? categoryId : undefined,
    brand_id: productTab === 'brand' ? brandId : undefined,
  })
  const priceGroupsQuery = usePriceGroupsQuery({ per_page: 100 })
  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const paymentAccountsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const defaultExchangeRateQuery = useDefaultExchangeRateQuery('USD', 'KHR')
  const createSale = useCreateSaleMutation()
  const updateSaleWithPayments = useUpdateSaleWithPaymentsMutation()
  const createCustomer = useCreateCustomerMutation()
  const createRegister = useCreateCashRegisterMutation()
  const openSession = useOpenCashRegisterSessionMutation()
  const [isSubmittingSale, setIsSubmittingSale] = useState(false)
  const isSaving = isSubmittingSale || createSale.isPending || updateSaleWithPayments.isPending || createRegister.isPending || openSession.isPending

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SaleFormInput, unknown, SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptySaleFormValues({ type: 'pos_sale', directPaymentEnabled: true }),
  })

  const { fields: itemFields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })
  const {
    fields: directPaymentFields,
    append: appendDirectPayment,
    remove: removeDirectPayment,
  } = useFieldArray({ control, name: 'direct_payments', keyName: 'fieldId' })

  const [branchId, warehouseId, saleType, taxScope, cashRegisterSessionId] = useWatch({
    control,
    name: ['branch_id', 'warehouse_id', 'type', 'tax_scope', 'cash_register_session_id'],
  }) as [string, string, string, string, string]
  const editingLine = useWatch({
    control,
    name: `items.${editingItemIndex ?? 0}`,
    disabled: editingItemIndex === null,
  })

  const cashRegistersQuery = useCashRegistersQuery({
    branch_id: branchId || undefined,
    status: 'active',
    per_page: 100,
  }, !!branchId)

  const warehouses = useMemo(() => warehousesQuery.data?.data ?? [], [warehousesQuery.data?.data])
  const customers = useMemo(() => {
    const baseCustomers = customersQuery.data?.data ?? []
    if (!createdCustomer || baseCustomers.some((customer) => customer.id === createdCustomer.id)) {
      return baseCustomers
    }

    return [createdCustomer, ...baseCustomers]
  }, [createdCustomer, customersQuery.data?.data])
  const customerGroups = customerGroupsQuery.data?.data ?? []
  const customerCustomFields = useMemo(
    () =>
      [...(customerCustomFieldsQuery.data?.data ?? [])].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return a.field_label.localeCompare(b.field_label)
      }),
    [customerCustomFieldsQuery.data?.data],
  )
  const categories = categoriesQuery.data?.data ?? []
  const brands = brandsQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const cashRegisters = useMemo(() => cashRegistersQuery.data?.data ?? [], [cashRegistersQuery.data?.data])
  const recentTransactions = recentTransactionsQuery.data?.data ?? []
  const recentTransactionsMeta = recentTransactionsQuery.data?.meta
  const priceGroups = priceGroupsQuery.data?.data ?? []
  const taxRates = taxRatesQuery.data?.data ?? []
  const paymentAccounts = useMemo(
    () => (paymentAccountsQuery.data?.data ?? []).filter((account) => account.is_active),
    [paymentAccountsQuery.data?.data],
  )
  const defaultExchangeRate = defaultExchangeRateQuery.data ?? null
  const currentSale = saleQuery.data ?? null
  const currentSaleStatus = currentSale?.status
  const existingPayments = useMemo(
    () => (currentSale?.payments ?? []).filter((payment) => payment.status === 'completed'),
    [currentSale?.payments],
  )
  const existingPaymentById = useMemo(() => new Map(existingPayments.map((payment) => [payment.id, payment])), [existingPayments])
  const canCreateCustomer = can('customers.create')
  const canUseOtherOpenRegister = can('sales.edit')
  const canManageExistingPayments = isEdit && can('payments.edit') && currentSaleStatus === 'completed'
  const canDeleteExistingPayments = isEdit && can('payments.delete') && currentSaleStatus === 'completed'
  const canAddPaymentLines = (isEdit ? can('payments.create') && currentSaleStatus === 'completed' : true)

  const handlePrintRecentTransaction = async (id: string) => {
    if (printingSaleId) return

    setPrintingSaleId(id)

    try {
      await printInvoice(id, t('pos.receiptTitle'), t('print.frameUnavailable'), 'receipt')
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    } finally {
      setPrintingSaleId(null)
    }
  }
  const defaultExchangeRateValue = toNumber(defaultExchangeRate?.rate)
  const selectDefaultWarehouse = useCallback((warehouse: (typeof warehouses)[number]) => {
    setValue('warehouse_id', warehouse.id, { shouldDirty: false, shouldValidate: true })
    if (warehouse.branch_id) {
      setValue('branch_id', warehouse.branch_id, { shouldDirty: false, shouldValidate: true })
    }
  }, [setValue])

  useDefaultWarehouseSelection({
    warehouses,
    warehouseId,
    onWarehouseChange: selectDefaultWarehouse,
    enabled: !isEdit,
  })
  const selectedOpenCashRegister = useMemo(() => {
    if (!branchId) return null

    const branchOpenRegisters = cashRegisters.filter((register) =>
      register.branch_id === branchId
      && register.is_active
      && register.current_open_session?.status === 'open'
    )

    return branchOpenRegisters.find((register) => register.current_open_session?.user_id === currentUser?.id)
      ?? (canUseOtherOpenRegister ? branchOpenRegisters[0] : null)
      ?? null
  }, [branchId, canUseOtherOpenRegister, cashRegisters, currentUser?.id])
  const selectedCashRegister = cashRegisters.find((register) => register.current_open_session?.id === cashRegisterSessionId) ?? null
  const dialogCashRegister = cashRegisters.find((register) => register.id === selectedCashRegisterId) ?? null
  const liveDateTimeLabel = formatAppDateTime(currentDateTime, dateFormat, i18n.language)

  const isSuspended = saleType === 'suspended'
  const canCapturePayment = !isSuspended && (!isEdit || currentSaleStatus === 'completed')

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!currentSale) return

    if (currentSale.type !== 'pos_sale') {
      router.replace(`/sales/${currentSale.id}/edit`)
      return
    }

    reset(saleFormValuesFromSale(currentSale, {
      emptyType: 'pos_sale',
      forceType: 'pos_sale',
      directPaymentEnabled: (sale) => sale.status === 'completed',
    }))
  }, [currentSale, reset, router])

  useEffect(() => {
    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId)
    const nextBranchId = selectedWarehouse?.branch_id ?? ''

    if (warehouseId && nextBranchId && branchId !== nextBranchId) {
      setValue('branch_id', nextBranchId, { shouldDirty: true, shouldValidate: true })
    }
  }, [branchId, setValue, warehouseId, warehouses])

  useEffect(() => {
    if (isEdit || !branchId || cashRegistersQuery.isLoading) return

    const currentSessionRegister = cashRegisters.find((register) =>
      register.branch_id === branchId
      && register.current_open_session?.id === cashRegisterSessionId
    )

    if (currentSessionRegister) {
      return
    }

    if (selectedOpenCashRegister?.current_open_session) {
      setValue('cash_register_session_id', selectedOpenCashRegister.current_open_session.id, {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    if (cashRegisterSessionId) {
      setValue('cash_register_session_id', '', { shouldDirty: true, shouldValidate: true })
    }
  }, [
    branchId,
    cashRegisterSessionId,
    cashRegisters,
    cashRegistersQuery.isLoading,
    isEdit,
    selectedOpenCashRegister,
    setValue,
  ])

  useEffect(() => {
    if (paymentAccounts.length === 0) return

    const directPayments = getValues('direct_payments') ?? []
    directPayments.forEach((line, index) => {
      if (!line?.payment_account_id) {
        setValue(`direct_payments.${index}.payment_account_id`, paymentAccounts[0].id, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    })
  }, [directPaymentFields, getValues, paymentAccounts, setValue])

  useEffect(() => {
    if (!defaultExchangeRate) {
      const directPayments = getValues('direct_payments') ?? []
      directPayments.forEach((line, index) => {
        if (line?.payment_currency === 'KHR') {
          setValue(`direct_payments.${index}.payment_currency`, 'USD', {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      })
    }
  }, [defaultExchangeRate, directPaymentFields, getValues, setValue])

  useEffect(() => {
    setValue('direct_payment_enabled', !isSuspended && (!isEdit || currentSaleStatus === 'completed'), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [currentSaleStatus, isEdit, isSuspended, setValue])

  const addLookupItem = useCallback((item: InventoryProductLookupItem) => {
    const currentItems = getValues('items') ?? []
    const itemVariationId = item.variation_id ?? null
    const itemSubUnitId = null
    const itemLotId = item.lot_id ?? null
    const itemSerialId = item.serial_id ?? null
    const isSerialTrackedItem = item.stock_tracking === 'serial' || Boolean(itemSerialId)
    const existingIndex = currentItems.findIndex((line) =>
      line.product_id === item.product_id
      && (line.variation_id ?? null) === itemVariationId
      && (line.sub_unit_id ?? null) === itemSubUnitId
      && (line.lot_id ?? null) === itemLotId
      && (line.serial_id ?? null) === itemSerialId
    )

    if (existingIndex >= 0) {
      if (isSerialTrackedItem || currentItems[existingIndex]?.stock_tracking === 'serial') {
        enqueueSnackbar(
          t(itemSerialId ? 'pos.messages.serialAlreadyInCart' : 'pos.messages.serialRequired'),
          { variant: 'warning' },
        )
        return
      }

      const currentQuantity = toNumber(currentItems[existingIndex]?.quantity, 0)
      setValue(`items.${existingIndex}.quantity`, round(currentQuantity + 1), {
        shouldDirty: true,
        shouldValidate: true,
      })
      return
    }

    append({
      product_id: item.product_id,
      variation_id: itemVariationId,
      sub_unit_id: itemSubUnitId,
      unit_id: item.unit?.id ?? null,
      sub_unit_label: item.sub_unit?.short_name ?? null,
      _base_unit_label: item.unit?.short_name ?? null,
      _sub_unit_option_id: item.sub_unit?.id ?? null,
      _base_unit_price: toNumber(item.selling_price),
      _sub_unit_price: toNumber(item.sub_unit_selling_price ?? item.selling_price),
      _conversion_factor: item.sub_unit?.conversion_factor ?? null,
      lot_id: itemLotId,
      serial_id: itemSerialId,
      stock_tracking: item.stock_tracking ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      lot_number: item.lot_number ?? null,
      serial_number: item.serial_number ?? null,
      unit_label: item.unit?.short_name ?? null,
      available_quantity: item.available_quantity ?? null,
      quantity: 1,
      unit_price: toNumber(item.selling_price),
      discount_type: null,
      discount_amount: 0,
      tax_rate_id: '',
      tax_rate_type: null,
      tax_rate: 0,
      tax_type: 'exclusive',
      unit_cost: toNumber(item.unit_cost),
      notes: '',
    })
    playAddProductSound()
  }, [append, enqueueSnackbar, getValues, setValue, t])

  const openCashRegisterDialog = () => {
    if (!branchId) {
      enqueueSnackbar(t('form.selectWarehouseFirst'), { variant: 'warning' })
      return
    }

    setCashRegisterMode((current) => (cashRegisters.length === 0 ? 'new' : current))
    setSelectedCashRegisterId((current) => current || selectedCashRegister?.id || cashRegisters[0]?.id || '')
    setCashRegisterDialogOpen(true)
  }

  const handleCreateCustomer = async (payload: CustomerPayload) => {
    const customer = await createCustomer.mutateAsync(payload)
    setCreatedCustomer(customer)
    setValue('customer_id', customer.id, { shouldDirty: true, shouldValidate: true })
    enqueueSnackbar(t('customers:messages.created'), { variant: 'success' })
  }

  const selectOrOpenCashRegister = async () => {
    if (!branchId) {
      enqueueSnackbar(t('form.selectWarehouseFirst'), { variant: 'warning' })
      return
    }

    if (cashRegisterMode === 'new' && !newCashRegisterName.trim()) {
      enqueueSnackbar(t('pos.cashRegister.enterName'), { variant: 'warning' })
      return
    }

    const existingRegister = cashRegisters.find((item) => item.id === selectedCashRegisterId)

    if (cashRegisterMode === 'existing' && !existingRegister) {
      enqueueSnackbar(t('pos.cashRegister.selectRegister'), { variant: 'warning' })
      return
    }

    try {
      const register = cashRegisterMode === 'new'
        ? await createRegister.mutateAsync({
          branch_id: branchId,
          name: newCashRegisterName.trim(),
          is_active: true,
        })
        : existingRegister

      if (!register) return

      const session = register.current_open_session ?? await openSession.mutateAsync({
        id: register.id,
        payload: {
          opening_float: openingFloat,
          notes: cashRegisterNotes.trim() || null,
        },
      })

      setValue('cash_register_session_id', session.id, { shouldDirty: true, shouldValidate: true })
      setSelectedCashRegisterId(register.id)
      setNewCashRegisterName('')
      setCashRegisterMode('existing')
      setCashRegisterDialogOpen(false)
      enqueueSnackbar(t('pos.cashRegister.selected'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  const prefetchTileProduct = useCallback((product: Product) => {
    if (!warehouseId || !product.is_for_selling) return

    const term = productSearchTerm(product)
    void queryClient.prefetchQuery({
      queryKey: inventoryKeys.productLookup(term, warehouseId),
      queryFn: () => inventoryApi.productLookup({ q: term, warehouse_id: warehouseId }),
    })
  }, [queryClient, warehouseId])

  const addTileProduct = useCallback(async (product: Product) => {
    if (!warehouseId) {
      enqueueSnackbar(t('form.selectWarehouseFirst'), { variant: 'warning' })
      return
    }

    if (product.type !== 'variable' && product.stock_tracking === 'none') {
      const currentItems = getValues('items') ?? []
      const existingIndex = currentItems.findIndex((line) =>
        line.product_id === product.id
        && !line.variation_id
        && !line.lot_id
        && !line.serial_id
      )

      if (existingIndex >= 0) {
        const currentQuantity = toNumber(currentItems[existingIndex]?.quantity, 0)
        setValue(`items.${existingIndex}.quantity`, round(currentQuantity + 1), {
          shouldDirty: true,
          shouldValidate: true,
        })
        return
      }
    }

    const term = productSearchTerm(product)
    setAddingTileProductIds((current) => current.includes(product.id) ? current : [...current, product.id])

    try {
      const results = await queryClient.fetchQuery({
        queryKey: inventoryKeys.productLookup(term, warehouseId),
        queryFn: () => inventoryApi.productLookup({ q: term, warehouse_id: warehouseId }),
      })
      const match = results.find((item) => item.product_id === product.id && item.is_exact_match)
        ?? results.find((item) => item.product_id === product.id)
        ?? results[0]

      if (!match) {
        enqueueSnackbar(t('pos.messages.productNotAvailable'), { variant: 'warning' })
        return
      }

      addLookupItem(match)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    } finally {
      setAddingTileProductIds((current) => current.filter((id) => id !== product.id))
    }
  }, [addLookupItem, enqueueSnackbar, getValues, queryClient, setValue, t, warehouseId])

  const applyTaxRate = (index: number, taxRateId: string) => {
    const taxRate = taxRates.find((item) => item.id === taxRateId)
    setValue(`items.${index}.tax_rate_id`, taxRateId)
    setValue(`items.${index}.tax_rate_type`, taxRate?.type ?? null)
    setValue(`items.${index}.tax_rate`, taxRate?.rate ?? 0)
  }

  const applyTrackedLookupToLine = (index: number, item: InventoryProductLookupItem) => {
    const currentItems = getValues('items') ?? []
    const currentLine = currentItems[index]
    const tracking = currentLine?.stock_tracking ?? item.stock_tracking
    const nextTracking = tracking ?? item.stock_tracking ?? null

    if (
      item.product_id !== currentLine?.product_id
      || (item.variation_id ?? null) !== (currentLine?.variation_id ?? null)
    ) {
      enqueueSnackbar(t('pos.messages.trackedProductMismatch'), { variant: 'warning' })
      return
    }

    if (tracking === 'lot') {
      if (!item.lot_id) {
        enqueueSnackbar(t('pos.messages.lotRequired'), { variant: 'warning' })
        return
      }

      setValue(`items.${index}.stock_tracking`, nextTracking, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.lot_id`, item.lot_id, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.lot_number`, item.lot_number ?? null, { shouldDirty: true })
      setValue(`items.${index}.serial_id`, null, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.serial_number`, null, { shouldDirty: true })
      setValue(`items.${index}.unit_cost`, toNumber(item.unit_cost), { shouldDirty: true })
      setValue(`items.${index}.available_quantity`, item.available_quantity ?? null, { shouldDirty: true })
      return
    }

    if (tracking === 'serial') {
      if (!item.serial_id) {
        enqueueSnackbar(t('pos.messages.serialRequired'), { variant: 'warning' })
        return
      }

      const duplicateSerialIndex = currentItems.findIndex((line, lineIndex) =>
        lineIndex !== index && line.serial_id === item.serial_id
      )

      if (duplicateSerialIndex >= 0) {
        enqueueSnackbar(t('pos.messages.serialAlreadyInCart'), { variant: 'warning' })
        return
      }

      setValue(`items.${index}.stock_tracking`, nextTracking, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.serial_id`, item.serial_id, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.serial_number`, item.serial_number ?? null, { shouldDirty: true })
      setValue(`items.${index}.lot_id`, null, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.lot_number`, null, { shouldDirty: true })
      setValue(`items.${index}.quantity`, 1, { shouldDirty: true, shouldValidate: true })
      setValue(`items.${index}.unit_cost`, toNumber(item.unit_cost), { shouldDirty: true })
      setValue(`items.${index}.available_quantity`, item.available_quantity ?? null, { shouldDirty: true })
    }
  }

  const changeItemUnit = (index: number, nextSubUnitId: string | null, nextLabel: string, nextPrice: number) => {
    setValue(`items.${index}.sub_unit_id`, nextSubUnitId, { shouldDirty: true })
    setValue(`items.${index}.unit_label`, nextLabel, { shouldDirty: true })
    setValue(`items.${index}.unit_price`, nextPrice, { shouldDirty: true })
  }

  const changeDirectPaymentCurrency = (index: number, nextCurrency: 'USD' | 'KHR') => {
    const currentBaseAmount = directPaymentLineBaseAmount(
      getValues(`direct_payments.${index}`),
      defaultExchangeRateValue,
    )
    const nextPaymentAmount = nextCurrency === 'KHR' && defaultExchangeRateValue > 0
      ? round(currentBaseAmount * defaultExchangeRateValue)
      : currentBaseAmount

    setValue(`direct_payments.${index}.payment_currency`, nextCurrency, { shouldDirty: true, shouldValidate: true })
    setValue(`direct_payments.${index}.payment_amount`, nextPaymentAmount, { shouldDirty: true, shouldValidate: true })
  }

  const removeDirectPaymentLine = (index: number) => {
    const paymentId = getValues(`direct_payments.${index}`)?.sale_payment_id

    if (paymentId) {
      setRemovedPaymentIds((current) => current.includes(paymentId) ? current : [...current, paymentId])
    }

    removeDirectPayment(index)
  }

  const changeItemQuantity = (index: number, quantity: number) => {
    const item = getValues(`items.${index}`)
    if (item?.stock_tracking === 'serial' || item?.serial_id) {
      setValue(`items.${index}.quantity`, 1, { shouldDirty: true, shouldValidate: true })
      return
    }

    setValue(`items.${index}.quantity`, quantity, { shouldDirty: true })
  }

  const submitForm = async (values: SaleFormValues) => {
    if (isSubmittingSale) return

    setIsSubmittingSale(true)
    setServerError('')

    try {
      const saleTotal = calculateSaleTotals(values).total
      const directPaymentLines = !isEdit && values.type === 'pos_sale'
        ? buildDirectPaymentLines(values, defaultExchangeRateValue, defaultExchangeRate?.id ?? null, saleTotal)
        : []
      const paymentChanges = buildSalePaymentChangePayloads({
        values,
        exchangeRate: defaultExchangeRateValue,
        exchangeRateId: defaultExchangeRate?.id ?? null,
        saleTotal,
        existingPaymentById,
        removedPaymentIds,
        canManageExistingPayments: isEdit && !!saleId && values.type === 'pos_sale' && canManageExistingPayments,
        canAddPaymentLines: isEdit && !!saleId && values.type === 'pos_sale' && canAddPaymentLines,
        canDeleteExistingPayments: isEdit && !!saleId && values.type === 'pos_sale' && canDeleteExistingPayments,
        correctionReason: t('payment.posCorrectionReason'),
        deletionReason: t('payment.posDeleteReason'),
        newPaymentMode: 'entered',
      })

      const payload = {
        ...buildSalePayload({ ...values, type: 'pos_sale' }),
        ...(!isEdit ? { client_request_id: clientRequestId } : {}),
        ...(!isEdit && directPaymentLines.length > 0
          ? { payment_date: values.sale_date, payment_note: null, payments: directPaymentLines }
          : {}),
      }

      if (isEdit && saleId) {
        await updateSaleWithPayments.mutateAsync({
          id: saleId,
          payload: {
            ...payload,
            ...(paymentChanges.paymentDeletions.length > 0
              ? { payment_deletions: paymentChanges.paymentDeletions }
              : {}),
            ...(paymentChanges.paymentCorrections.length > 0
              ? { payment_corrections: paymentChanges.paymentCorrections }
              : {}),
            ...(paymentChanges.payments.length > 0
              ? { payment_date: values.sale_date, payment_note: null, payments: paymentChanges.payments }
              : {}),
          },
        })
      } else {
        await createSale.mutateAsync(payload)
      }

      if (values.type === 'pos_sale') {
        if (posSettings?.auto_print_receipt) {
          const id = isEdit ? saleId : createSale.data?.id
          if (id) {
            await printInvoice(id, t('pos.receiptTitle'), t('print.frameUnavailable'), 'receipt')
          }
        }
        
        if (directPaymentLines.length > 0) {
          enqueueSnackbar(t('pos.messages.completed'), { variant: 'success' })
        } else if (isEdit) {
          enqueueSnackbar(t('pos.messages.updated'), { variant: 'success' })
        } else {
          enqueueSnackbar(t('messages.completed'), { variant: 'success' })
        }
      } else if (values.type === 'suspended') {
        enqueueSnackbar(t('pos.messages.suspended'), { variant: 'success' })
      } else {
        enqueueSnackbar(t('messages.created'), { variant: 'success' })
      }

      if (isEdit) {
        router.push('/pos')
      } else {
        reset({
          ...emptySaleFormValues({
            type: 'pos_sale',
            directPaymentEnabled: true,
            cashRegisterSessionId: values.cash_register_session_id ?? '',
          }),
          branch_id: values.branch_id,
          warehouse_id: values.warehouse_id,
          price_group_id: values.price_group_id ?? '',
        })
        setClientRequestId(createClientRequestId())
      }
      setEditingItemIndex(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SaleFormInput, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    } finally {
      setIsSubmittingSale(false)
    }
  }

  const submitAs = (type: SaleFormValues['type']) => {
    const directPaymentEnabled = type === 'pos_sale' && (!isEdit || currentSaleStatus === 'completed')
    setValue('type', type, { shouldDirty: true, shouldValidate: false })
    setValue('direct_payment_enabled', directPaymentEnabled, { shouldDirty: true, shouldValidate: false })
    window.setTimeout(() => {
      void handleSubmit((values) => submitForm({ ...values, type, direct_payment_enabled: directPaymentEnabled }))()
    }, 0)
  }

  if (isEdit && saleQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isEdit && saleQuery.isError) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3 }}>
        <Alert severity="error">{toAppApiError(saleQuery.error).message}</Alert>
      </Box>
    )
  }

  const productGalleryContent = (
    <PosProductGallery
      productTab={productTab}
      onProductTabChange={setProductTab}
      categoryId={categoryId}
      onCategoryIdChange={setCategoryId}
      brandId={brandId}
      onBrandIdChange={setBrandId}
      search={productGallerySearch}
      onSearchChange={setProductGallerySearch}
      categories={categories}
      brands={brands}
      products={products}
      categoriesLoading={categoriesQuery.isLoading}
      brandsLoading={brandsQuery.isLoading}
      productsLoading={productsQuery.isLoading}
      warehouseId={warehouseId}
      isSaving={isSaving}
      addingProductIds={addingTileProductIds}
      currencyFormatter={currencyFormatter}
      onAddProduct={addTileProduct}
      onPrefetchProduct={prefetchTileProduct}
    />
  )

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(submitForm)}
      sx={{
        height: '100dvh',
        background: 'transparent',
        color: 'text.primary',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            px: { xs: 2, md: 3 },
            py: 1,
            minHeight: layoutMetrics.topbarHeight,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${posTopbarColors.border}`,
            background: posTopbarColors.bg,
            color: posTopbarColors.text,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{
              width: '100%',
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: { xs: '1 1 auto', md: '0 0 auto' } }}>
              <Typography variant="body2" sx={{ fontWeight: 800, flex: '0 0 auto' }}>{t('pos.location')}</Typography>
              <Box sx={{ width: { xs: '100%', md: 240 }, minWidth: 0 }}>
                <Controller
                  name="warehouse_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={warehouses}
                      value={warehouses.find((warehouse) => warehouse.id === field.value) ?? null}
                      loading={warehousesQuery.isLoading}
                      getOptionLabel={(warehouse) => [warehouse.name, warehouse.branch?.name].filter(Boolean).join(' / ')}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onBlur={field.onBlur}
                      onChange={(_, selectedWarehouse) => {
                        field.onChange(selectedWarehouse?.id ?? '')
                        setValue('branch_id', selectedWarehouse?.branch_id ?? '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                      slotProps={{
                        paper: { sx: { fontSize: '0.875rem' } },
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={t('fields.warehouse')}
                          error={!!errors.warehouse_id || !!errors.branch_id}
                          sx={posTopbarFieldSx}
                        />
                      )}
                    />
                  )}
                />
              </Box>
              <Box sx={{ height: 'var(--app-control-height)', minHeight: 'var(--app-control-height)', px: 1.5, borderRadius: 1, bgcolor: 'primary.main', color: 'primary.contrastText', flex: '0 0 auto', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {liveDateTimeLabel}
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                flex: '0 0 auto',
              }}
            >
              <Tooltip title={t('pos.toolbar.back')}>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/sales')} sx={posTopbarActionSx}>
                  {t('pos.toolbar.back')}
                </Button>
              </Tooltip>
              <Tooltip title={t('pos.toolbar.products')}>
                <Button
                  variant="outlined"
                  startIcon={<CategoryOutlined />}
                  onClick={() => setProductGalleryOpen(true)}
                  sx={{ ...posTopbarActionSx, display: { xl: 'none' } }}
                >
                  {t('pos.toolbar.products')}
                </Button>
              </Tooltip>
              <Tooltip title={selectedCashRegister ? selectedCashRegister.name : t('pos.cashRegister.title')}>
                <Button
                  variant="outlined"
                  startIcon={<AccountBalanceWalletOutlined />}
                  onClick={() => {
                    if (selectedCashRegister?.current_open_session) {
                      setCashRegisterReportOpen(true)
                      return
                    }

                    openCashRegisterDialog()
                  }}
                  sx={posTopbarActionSx}
                >
                  {selectedCashRegister?.name ?? t('pos.cashRegister.title')}
                </Button>
              </Tooltip>
              <Tooltip title={t('pos.toolbar.settings')}>
                <Button variant="outlined" startIcon={<SettingsOutlined />} onClick={() => setSettingsOpen(true)} sx={posTopbarActionSx}>
                  {t('pos.toolbar.settings')}
                </Button>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            minHeight: 0,
            overflow: 'hidden',
            overflowX: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', xl: 'minmax(720px, 1.5fr) minmax(380px, 440px)' },
          }}
        >
          <Box sx={{ minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
            <Stack spacing={0.75} sx={{ minWidth: 0, minHeight: 0, flex: '1 1 auto', contain: 'layout' }}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <PosHeaderFields
                control={control}
                errors={errors}
                customers={customers}
                customersLoading={customersQuery.isLoading}
                canCreateCustomer={canCreateCustomer}
                warehouseId={warehouseId}
                isSaving={isSaving}
                onAddCustomer={() => setCustomerDialogOpen(true)}
                onSelectItem={addLookupItem}
              />

              <PosCartSection
                control={control}
                errors={errors}
                itemFields={itemFields}
                isSaving={isSaving}
                currency={currency}
                currencyFormatter={currencyFormatter}
                exchangeRate={defaultExchangeRateValue}
                onQuantityChange={changeItemQuantity}
                onChangeUnit={changeItemUnit}
                onEditItem={setEditingItemIndex}
                onRemoveItem={remove}
                onEditSummary={setEditingSummary}
              >
                <PosPaymentSection
                  control={control}
                  errors={errors}
                  canCapturePayment={canCapturePayment}
                  canAddPaymentLines={canAddPaymentLines}
                  canManageExistingPayments={canManageExistingPayments}
                  canDeleteExistingPayments={canDeleteExistingPayments}
                  isSaving={isSaving}
                  paymentAccounts={paymentAccounts}
                  paymentAccountsLoading={paymentAccountsQuery.isLoading}
                  defaultExchangeRateLoading={defaultExchangeRateQuery.isLoading}
                  hasDefaultExchangeRate={!!defaultExchangeRate}
                  directPaymentFields={directPaymentFields}
                  onAddLine={() => appendDirectPayment(newDirectPaymentLine(paymentAccounts))}
                  onCurrencyChange={changeDirectPaymentCurrency}
                  onRemoveLine={removeDirectPaymentLine}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '0.7fr 1fr 1fr' },
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    contain: 'layout style',
                    minHeight: 70,
                  }}
                >
                  <Controller name="price_group_id" control={control} render={({ field }) => (
                    <Autocomplete
                      options={priceGroups}
                      value={priceGroups.find((group) => group.id === field.value) ?? null}
                      loading={priceGroupsQuery.isLoading}
                      getOptionLabel={priceGroupLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onBlur={field.onBlur}
                      onChange={(_, group) => field.onChange(group?.id ?? '')}
                      renderInput={(params) => <TextField {...params} label={t('fields.priceGroup')} error={!!errors.price_group_id} helperText={errors.price_group_id?.message || t('form.noPriceGroup')} />}
                      slotProps={{ paper: { sx: { fontSize: '0.875rem' } } }}
                    />
                  )} />
                  <Controller name="notes" control={control} render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} label={t('fields.notes')} error={!!errors.notes} helperText={errors.notes?.message} multiline minRows={1} maxRows={2} size="small" />
                  )} />
                  <Controller name="staff_note" control={control} render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} label={t('fields.staffNote')} error={!!errors.staff_note} helperText={errors.staff_note?.message} multiline minRows={1} maxRows={2} size="small" />
                  )} />
                </Box>
              </PosCartSection>
            </Stack>
          </Box>

          <Box
            sx={{
              minWidth: 0,
              display: { xs: 'none', xl: 'block' },
              borderLeftWidth: { xl: 1 },
              borderLeftStyle: { xl: 'solid' },
              borderLeftColor: 'divider',
              bgcolor: 'background.paper',
              p: 2,
              overflow: 'auto',
            }}
          >
            {productGalleryContent}
          </Box>
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            px: 1,
            py: 0.75,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'max-content minmax(0, 1fr) max-content' },
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Button
            type="button"
            variant="outlined"
            color="error"
            disabled={isSaving}
            onClick={() => reset(emptySaleFormValues({ type: 'pos_sale', directPaymentEnabled: true }))}
            sx={{ ...footerButtonSx, minWidth: 132 }}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              minWidth: 0,
              overflowX: 'auto',
              overflowY: 'hidden',
              pb: 0.25,
            }}
          >
            <Button type="button" variant="text" disabled={isSaving} onClick={() => submitAs('draft')} sx={{ ...footerButtonSx, minWidth: 96 }}>
              {t('types.draft')}
            </Button>
            <Button type="button" variant="text" disabled={isSaving} onClick={() => submitAs('quotation')} sx={{ ...footerButtonSx, minWidth: 112 }}>
              {t('types.quotation')}
            </Button>
            <Button type="button" variant="text" color="warning" disabled={isSaving} onClick={() => submitAs('suspended')} sx={{ ...footerButtonSx, minWidth: 112 }}>
              {t('types.suspended')}
            </Button>
            <Button type="button" variant="text" disabled sx={{ ...footerButtonSx, minWidth: 118 }}>
              {t('pos.actions.creditSale')}
            </Button>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              minWidth: 0,
              justifyContent: { md: 'flex-end' },
              overflowX: 'auto',
              overflowY: 'hidden',
              pb: 0.25,
            }}
          >
            <Button type="button" variant="outlined" onClick={() => setRecentTransactionsOpen(true)} sx={{ ...footerButtonSx, minWidth: 178 }}>
              {t('pos.recentTransactions')}
            </Button>
            <Button type="button" variant="contained" disabled={isSaving} onClick={() => submitAs(saleType as SaleFormValues['type'])} sx={{ ...footerButtonSx, minWidth: 104 }}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
            </Button>
          </Stack>
        </Box>
      </Box>
      <Drawer
        anchor="right"
        open={productGalleryOpen}
        onClose={() => setProductGalleryOpen(false)}
        sx={{ display: { xs: 'block', xl: 'none' } }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 'min(92vw, 420px)', sm: 420, md: 460 },
              p: 2,
            },
          },
        }}
      >
        <Stack spacing={1.5} sx={{ minHeight: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('pos.toolbar.products')}</Typography>
            <Tooltip title={t('common:buttons.close')}>
              <IconButton size="small" onClick={() => setProductGalleryOpen(false)}>
                <Close />
              </IconButton>
            </Tooltip>
          </Stack>
          {productGalleryContent}
        </Stack>
      </Drawer>
      <CustomerFormDialog
        key={customerDialogOpen ? 'pos-customer-open' : 'pos-customer-closed'}
        open={customerDialogOpen}
        customer={null}
        customerGroups={customerGroups}
        isLoadingCustomerGroups={customerGroupsQuery.isLoading}
        customFields={customerCustomFields}
        isLoadingCustomFields={customerCustomFieldsQuery.isLoading}
        isSaving={createCustomer.isPending}
        onClose={() => setCustomerDialogOpen(false)}
        onSubmit={handleCreateCustomer}
      />
      <Dialog
        open={recentTransactionsOpen}
        onClose={() => setRecentTransactionsOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>{t('pos.recentTransactions')}</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ p: 2, alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <TextField
              value={recentTransactionsSearch}
              onChange={(event) => {
                setRecentTransactionsSearch(event.target.value)
                setRecentTransactionsPage(0)
              }}
              placeholder={t('filters.search')}
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
          {recentTransactionsQuery.isError && (
            <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
              {toAppApiError(recentTransactionsQuery.error).message}
            </Alert>
          )}
          <TableContainer sx={{ maxHeight: { xs: 420, md: 560 } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.sale')}</TableCell>
                  <TableCell>{t('columns.customer')}</TableCell>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell>{t('columns.payment')}</TableCell>
                  <TableCell align="right">{t('columns.total')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactionsQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!recentTransactionsQuery.isLoading && recentTransactions.length === 0 && (
                  <TableStateRow colSpan={7} message={t('empty')} />
                )}
                {recentTransactions.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{sale.sale_number}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t(`types.${sale.type}`, { defaultValue: sale.type })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{sale.customer?.name ?? t('labels.walkInCustomer')}</TableCell>
                    <TableCell>{formatAppDate(sale.sale_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`statuses.${sale.status}`, { defaultValue: sale.status })}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`paymentStatuses.${sale.payment_status}`, { defaultValue: sale.payment_status })}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{formatMoney(sale.total_amount, currencyFormatter)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'center' }}>
                        <Tooltip title={t('print.quickPrint')}>
                          <span>
                            <IconButton
                              size="small"
                              aria-label={t('print.quickPrint')}
                              disabled={printingSaleId !== null}
                              onClick={() => void handlePrintRecentTransaction(sale.id)}
                            >
                              {printingSaleId === sale.id
                                ? <CircularProgress size={18} />
                                : <ReceiptLongOutlined />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <RowActions
                          viewLabel={t('common:buttons.view')}
                          editLabel={t('common:buttons.edit')}
                          deleteLabel={t('common:buttons.delete')}
                          showView
                          showEdit={can('sales.edit')}
                          showDelete={false}
                          onView={() => {
                            setRecentTransactionsOpen(false)
                            router.push(`/sales/${sale.id}`)
                          }}
                          onEdit={() => {
                            setRecentTransactionsOpen(false)
                            router.push(`/pos/${sale.id}/edit`)
                          }}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={recentTransactionsMeta?.total ?? 0}
            page={recentTransactionsPage}
            rowsPerPage={recentTransactionsPerPage}
            rowsPerPageOptions={recentTransactionRowsPerPageOptions}
            onPageChange={(_, nextPage) => setRecentTransactionsPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setRecentTransactionsPerPage(Number(event.target.value))
              setRecentTransactionsPage(0)
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRecentTransactionsOpen(false)}>
            {t('common:buttons.close')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingItemIndex !== null} onClose={() => setEditingItemIndex(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('pos.lineDialog.title')}</DialogTitle>
        <DialogContent>
          {editingItemIndex !== null && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Controller name={`items.${editingItemIndex}.discount_type`} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} select label={t('fields.discountType')} error={!!errors.items?.[editingItemIndex]?.discount_type}>
                    <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                    {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
                <Controller name={`items.${editingItemIndex}.discount_amount`} control={control} render={({ field }) => (
                  <TextField {...field} fullWidth value={field.value ?? ''} type="number" label={t('fields.discount')} error={!!errors.items?.[editingItemIndex]?.discount_amount} helperText={errors.items?.[editingItemIndex]?.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                )} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Controller name={`items.${editingItemIndex}.tax_rate_id`} control={control} render={({ field }) => (
                  <Autocomplete
                    fullWidth
                    options={taxRates}
                    value={taxRates.find((rate) => rate.id === field.value) ?? null}
                    loading={taxRatesQuery.isLoading}
                    getOptionLabel={taxRateLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disabled={taxScope !== 'line'}
                    onBlur={field.onBlur}
                    onChange={(_, rate) => applyTaxRate(editingItemIndex, rate?.id ?? '')}
                    renderInput={(params) => (
                      <TextField {...params} label={t('fields.tax')} error={!!errors.items?.[editingItemIndex]?.tax_rate_id} helperText={errors.items?.[editingItemIndex]?.tax_rate_id?.message || (taxScope !== 'line' ? t('pos.lineDialog.saleTaxMode') : undefined)} />
                    )}
                  />
                )} />
                <Controller name={`items.${editingItemIndex}.tax_type`} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? 'exclusive'} select label={t('fields.taxType')} error={!!errors.items?.[editingItemIndex]?.tax_type} helperText={errors.items?.[editingItemIndex]?.tax_type?.message} disabled={taxScope !== 'line'}>
                    {taxTypes.map((type) => <MenuItem key={type} value={type}>{t(`taxTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
              </Box>
              {(() => {
                const tracking = editingLine?.stock_tracking ?? (editingLine?.serial_id ? 'serial' : editingLine?.lot_id ? 'lot' : 'none')

                if (tracking !== 'lot' && tracking !== 'serial') return null

                return (
                  <Stack spacing={1}>
                    <InventoryProductLookupPicker
                      warehouseId={warehouseId || undefined}
                      disabled={!warehouseId || isSaving}
                      label={tracking === 'lot' ? t('pos.lineDialog.lotLookup') : t('pos.lineDialog.serialLookup')}
                      helperText={tracking === 'lot' ? t('pos.lineDialog.lotLookupHelp') : t('pos.lineDialog.serialLookupHelp')}
                      onSelect={(item) => applyTrackedLookupToLine(editingItemIndex, item)}
                    />
                    {(tracking === 'lot' && editingLine?.lot_number) || (tracking === 'serial' && editingLine?.serial_number) ? (
                      <Alert severity="info">
                        {tracking === 'lot'
                          ? t('pos.lineDialog.selectedLot', { lot: editingLine.lot_number })
                          : t('pos.lineDialog.selectedSerial', { serial: editingLine.serial_number })}
                      </Alert>
                    ) : (
                      <Alert severity="warning">
                        {tracking === 'lot' ? t('pos.lineDialog.lotRequired') : t('pos.lineDialog.serialRequired')}
                      </Alert>
                    )}
                  </Stack>
                )
              })()}
              <Controller name={`items.${editingItemIndex}.notes`} control={control} render={({ field }) => (
                <TextField {...field} fullWidth value={field.value ?? ''} label={t('fields.notes')} error={!!errors.items?.[editingItemIndex]?.notes} helperText={errors.items?.[editingItemIndex]?.notes?.message} multiline minRows={3} />
              )} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingItemIndex(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingItemIndex(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
      <CashRegisterSessionDialog
        key={selectedCashRegister?.current_open_session?.id ?? 'no-session'}
        open={cashRegisterReportOpen}
        register={selectedCashRegister}
        onClose={() => setCashRegisterReportOpen(false)}
        onClosed={() => {
          setValue('cash_register_session_id', '', {
            shouldDirty: true,
            shouldValidate: true,
          })
          setCashRegisterReportOpen(false)
        }}
      />
      <Dialog open={cashRegisterDialogOpen} onClose={() => setCashRegisterDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('pos.cashRegister.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {!branchId && <Alert severity="warning">{t('form.selectWarehouseFirst')}</Alert>}
            <ToggleButtonGroup
              color="primary"
              exclusive
              fullWidth
              value={cashRegisterMode}
              onChange={(_, value: 'existing' | 'new' | null) => {
                if (value) setCashRegisterMode(value)
              }}
            >
              <ToggleButton value="existing" disabled={cashRegisters.length === 0}>
                {t('pos.cashRegister.existingRegister')}
              </ToggleButton>
              <ToggleButton value="new">{t('pos.cashRegister.newRegister')}</ToggleButton>
            </ToggleButtonGroup>
            {cashRegisterMode === 'existing' ? (
              <Autocomplete
                options={cashRegisters}
                value={dialogCashRegister}
                loading={cashRegistersQuery.isLoading}
                getOptionLabel={cashRegisterLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, register) => setSelectedCashRegisterId(register?.id ?? '')}
                renderOption={(props, register) => (
                  <Box component="li" {...props} key={register.id}>
                    <Box>
                      <Typography variant="body2">{register.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {register.current_open_session ? t('pos.cashRegister.open') : t('pos.cashRegister.closed')}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('pos.cashRegister.register')}
                    helperText={cashRegisters.length === 0 && !cashRegistersQuery.isLoading ? t('pos.cashRegister.noRegisters') : undefined}
                  />
                )}
              />
            ) : (
              <TextField
                label={t('pos.cashRegister.newRegisterName')}
                value={newCashRegisterName}
                onChange={(event) => setNewCashRegisterName(event.target.value)}
                required
                autoFocus
              />
            )}
            {(cashRegisterMode === 'new' || !dialogCashRegister?.current_open_session) && (
              <>
                <TextField
                  type="number"
                  label={t('pos.cashRegister.openingFloat')}
                  value={openingFloat}
                  onChange={(event) => setOpeningFloat(toNumber(event.target.value))}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }}
                />
                <TextField
                  label={t('pos.cashRegister.notes')}
                  value={cashRegisterNotes}
                  onChange={(event) => setCashRegisterNotes(event.target.value)}
                  multiline
                  minRows={2}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCashRegisterDialogOpen(false)}>{t('common:buttons.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => void selectOrOpenCashRegister()}
            disabled={createRegister.isPending || openSession.isPending || (cashRegisterMode === 'existing' && !selectedCashRegisterId)}
          >
            {createRegister.isPending || openSession.isPending ? <CircularProgress size={20} color="inherit" /> : t('pos.cashRegister.useRegister')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingSummary === 'discount'} onClose={() => setEditingSummary(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('pos.summaryDialog.discountTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller name="discount_type" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} select label={t('fields.discountType')} error={!!errors.discount_type} helperText={errors.discount_type?.message}>
                <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="discount_amount" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.discount')} error={!!errors.discount_amount} helperText={errors.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
            )} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingSummary(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingSummary(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingSummary === 'tax'} onClose={() => setEditingSummary(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('pos.summaryDialog.taxTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl error={!!errors.tax_scope}>
              <InputLabel id="pos-tax-scope-dialog-label">{t('fields.taxScope')}</InputLabel>
              <Controller name="tax_scope" control={control} render={({ field }) => (
                <Select {...field} MenuProps={{ disableScrollLock: true }} labelId="pos-tax-scope-dialog-label" label={t('fields.taxScope')}>
                  {taxScopes.map((scope) => <MenuItem key={scope} value={scope}>{t(`taxScopes.${scope}`)}</MenuItem>)}
                </Select>
              )} />
              <FormHelperText>{errors.tax_scope?.message}</FormHelperText>
            </FormControl>
            {taxScope === 'sale' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Controller name="tax_rate_id" control={control} render={({ field }) => (
                  <Autocomplete
                    options={taxRates}
                    value={taxRates.find((rate) => rate.id === field.value) ?? null}
                    loading={taxRatesQuery.isLoading}
                    getOptionLabel={taxRateLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, taxRate) => {
                      field.onChange(taxRate?.id ?? '')
                      setValue('tax_rate_type', taxRate?.type ?? null)
                      setValue('tax_rate', taxRate?.rate ?? 0)
                    }}
                    renderInput={(params) => <TextField {...params} label={t('fields.tax')} error={!!errors.tax_rate_id} helperText={errors.tax_rate_id?.message || t('form.noTax')} />}
                  />
                )} />
                <Controller name="tax_type" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? 'exclusive'} select label={t('fields.taxType')} error={!!errors.tax_type} helperText={errors.tax_type?.message}>
                    {taxTypes.map((type) => <MenuItem key={type} value={type}>{t(`taxTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingSummary(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingSummary(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingSummary === 'shipping'} onClose={() => setEditingSummary(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('pos.summaryDialog.shippingTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller name="shipping_charges" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.shipping')} error={!!errors.shipping_charges} helperText={errors.shipping_charges?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }} />
            )} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingSummary(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingSummary(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
