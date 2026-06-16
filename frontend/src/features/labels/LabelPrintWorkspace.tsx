'use client'

import { useMemo, useState, type ReactNode } from 'react'
import NextLink from 'next/link'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import PageLoader from '@/components/ui/PageLoader'
import { ArrowBack, LocalOfferOutlined, SaveOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import { useSettingsGroupQuery, useUpdateSettingsGroupMutation } from '@/features/settings/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { SettingValue, SettingsGroupValues } from '@/types/settings'
import { Code39Barcode } from './Code39Barcode'
import type { ExpandedLabelItem, LabelBarcodeLayout, LabelPrintOptions, LabelQuantityMode, LabelSourceItem, LabelTemplateKey } from './types'

interface LabelPrintWorkspaceProps {
  items: LabelSourceItem[]
  title: string
  subtitle: string
  backUrl: string
  sourceSelector?: ReactNode
}

const defaultOptions: LabelPrintOptions = {
  template: 'product',
  paperSize: 'a4',
  widthMm: 50,
  heightMm: 30,
  columns: 3,
  gapMm: 2,
  marginMm: 6,
  quantityMode: 'received_quantity',
  fixedQuantity: 1,
  barcodeType: 'code39',
  barcodeLayout: 'single',
  showBusinessName: true,
  showProductName: true,
  showSku: true,
  showPrice: true,
  showLot: true,
  showExpiry: true,
  showBarcodeTextLines: true,
  showReceivedDate: false,
  showPurchaseNumber: false,
  showWarehouse: false,
}

function numberSetting(value: SettingValue | undefined, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback
}

function booleanSetting(value: SettingValue | undefined, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['1', 'true', 'yes'].includes(value.toLowerCase())
  if (typeof value === 'number') return value === 1
  return fallback
}

function textSetting<T extends string>(value: SettingValue | undefined, fallback: T, allowed: readonly T[]) {
  return allowed.includes(value as T) ? value as T : fallback
}

function optionsFromSettings(settings: SettingsGroupValues | undefined): LabelPrintOptions {
  return {
    ...defaultOptions,
    template: textSetting<LabelTemplateKey>(settings?.default_template, defaultOptions.template, ['product', 'lot', 'serial', 'price_tag']),
    paperSize: textSetting(settings?.paper_size, defaultOptions.paperSize, ['a4', 'roll', 'custom']),
    widthMm: numberSetting(settings?.label_width_mm, defaultOptions.widthMm),
    heightMm: numberSetting(settings?.label_height_mm, defaultOptions.heightMm),
    columns: numberSetting(settings?.columns, defaultOptions.columns),
    gapMm: numberSetting(settings?.gap_mm, defaultOptions.gapMm),
    marginMm: numberSetting(settings?.margin_mm, defaultOptions.marginMm),
    quantityMode: textSetting<LabelQuantityMode>(settings?.quantity_mode, defaultOptions.quantityMode, ['received_quantity', 'one_each_line', 'one_each_serial', 'fixed']),
    barcodeType: textSetting(settings?.barcode_type, defaultOptions.barcodeType, ['code39', 'none']),
    barcodeLayout: textSetting<LabelBarcodeLayout>(settings?.barcode_layout, defaultOptions.barcodeLayout, ['single', 'two_barcodes', 'combined']),
    showBusinessName: booleanSetting(settings?.show_business_name, defaultOptions.showBusinessName),
    showProductName: booleanSetting(settings?.show_product_name, defaultOptions.showProductName),
    showSku: booleanSetting(settings?.show_sku, defaultOptions.showSku),
    showPrice: booleanSetting(settings?.show_price, defaultOptions.showPrice),
    showLot: booleanSetting(settings?.show_lot, defaultOptions.showLot),
    showExpiry: booleanSetting(settings?.show_expiry, defaultOptions.showExpiry),
    showBarcodeTextLines: booleanSetting(settings?.show_barcode_text_lines, defaultOptions.showBarcodeTextLines),
    showReceivedDate: booleanSetting(settings?.show_received_date, defaultOptions.showReceivedDate),
    showPurchaseNumber: booleanSetting(settings?.show_purchase_number, defaultOptions.showPurchaseNumber),
    showWarehouse: booleanSetting(settings?.show_warehouse, defaultOptions.showWarehouse),
  }
}

function settingsFromOptions(options: LabelPrintOptions): SettingsGroupValues {
  return {
    default_template: options.template,
    paper_size: options.paperSize,
    label_width_mm: options.widthMm,
    label_height_mm: options.heightMm,
    columns: options.columns,
    gap_mm: options.gapMm,
    margin_mm: options.marginMm,
    quantity_mode: options.quantityMode,
    barcode_type: options.barcodeType,
    barcode_layout: options.barcodeLayout,
    show_business_name: options.showBusinessName,
    show_product_name: options.showProductName,
    show_sku: options.showSku,
    show_price: options.showPrice,
    show_lot: options.showLot,
    show_expiry: options.showExpiry,
    show_barcode_text_lines: options.showBarcodeTextLines,
    show_received_date: options.showReceivedDate,
    show_purchase_number: options.showPurchaseNumber,
    show_warehouse: options.showWarehouse,
  }
}

function expandLabels(items: LabelSourceItem[], options: LabelPrintOptions): ExpandedLabelItem[] {
  return items.flatMap((item) => {
    const copies = options.quantityMode === 'fixed'
      ? options.fixedQuantity
      : options.quantityMode === 'one_each_line'
        ? 1
        : options.quantityMode === 'one_each_serial'
          ? (item.serialNumber ? 1 : 0)
          : Math.max(1, Math.ceil(Number(item.quantity) || 1))

    return Array.from({ length: Math.max(0, copies) }, (_, index) => ({
      ...item,
      printKey: `${item.id}-${index}`,
    }))
  })
}

function barcodeValue(item: LabelSourceItem) {
  return item.serialNumber || item.lotNumber || item.sku || item.productName
}

function trackingValue(item: LabelSourceItem) {
  return item.serialNumber || item.lotNumber || null
}

function combinedBarcodeValue(item: LabelSourceItem) {
  const tracking = trackingValue(item)
  if (item.sku && tracking) return `${item.sku}|${tracking}`
  return barcodeValue(item)
}

export function LabelPrintWorkspace({
  items,
  title,
  subtitle,
  backUrl,
  sourceSelector,
}: LabelPrintWorkspaceProps) {
  const { t, i18n } = useTranslation(['purchases', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const business = useAuthStore((state) => state.business)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const settingsQuery = useSettingsGroupQuery('label_printing')
  const updateSettings = useUpdateSettingsGroupMutation('label_printing')
  const [draftOptions, setDraftOptions] = useState<LabelPrintOptions | null>(null)
  const options = draftOptions ?? optionsFromSettings(settingsQuery.data)
  const labels = useMemo(() => expandLabels(items, options), [items, options])
  const canEditSettings = can('settings.edit')

  const updateOption = <K extends keyof LabelPrintOptions>(key: K, value: LabelPrintOptions[K]) => {
    setDraftOptions((current) => ({ ...(current ?? options), [key]: value }))
  }

  const saveDefaults = async () => {
    try {
      await updateSettings.mutateAsync(settingsFromOptions(options))
      enqueueSnackbar(t('labelPrinting.defaultsSaved'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  if (settingsQuery.isLoading) {
    return <PageLoader />
  }

  const renderSwitch = (key: keyof LabelPrintOptions, label: string) => (
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(options[key])}
          onChange={(event) => updateOption(key, event.target.checked as never)}
        />
      }
      label={label}
    />
  )

  return (
    <Stack spacing={3}>
      <GlobalStyles
        styles={{
          '@media print': {
            '@page': {
              size: options.paperSize === 'roll' ? `${options.widthMm}mm ${options.heightMm}mm` : 'A4',
              margin: 0,
            },
            'body *': {
              visibility: 'hidden',
            },
            '.label-print-root, .label-print-root *': {
              visibility: 'visible',
            },
            '.label-print-root': {
              position: 'absolute',
              inset: 0,
              width: '100%',
              background: '#fff',
            },
            '.label-print-controls': {
              display: 'none !important',
            },
            '.label-sheet': {
              boxShadow: 'none !important',
              border: '0 !important',
            },
            '.label-card': {
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            },
          },
        }}
      />

      <Stack className="label-print-controls" direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('common:actions.back')}>
            <IconButton size="small" component={NextLink} href={backUrl}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <PageHeader
            icon={<LocalOfferOutlined color="primary" />}
            title={title}
            description={subtitle}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {canEditSettings && (
            <Button
              variant="outlined"
              startIcon={updateSettings.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
              disabled={updateSettings.isPending}
              onClick={saveDefaults}
            >
              {t('labelPrinting.saveDefaults')}
            </Button>
          )}
          <Button variant="contained" startIcon={<LocalOfferOutlined />} disabled={labels.length === 0} onClick={() => window.print()}>
            {t('labelPrinting.print')}
          </Button>
        </Stack>
      </Stack>

      {settingsQuery.isError && (
        <Alert className="label-print-controls" severity="warning">
          {t('labelPrinting.settingsFallback')}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' }, gap: 3 }}>
        <Stack className="label-print-controls" spacing={2}>
          {sourceSelector}

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="subtitle2">{t('labelPrinting.layout')}</Typography>
                <TextField select label={t('labelPrinting.template')} value={options.template} onChange={(event) => updateOption('template', event.target.value as LabelTemplateKey)}>
                  <MenuItem value="product">{t('labelPrinting.templates.product')}</MenuItem>
                  <MenuItem value="lot">{t('labelPrinting.templates.lot')}</MenuItem>
                  <MenuItem value="serial">{t('labelPrinting.templates.serial')}</MenuItem>
                  <MenuItem value="price_tag">{t('labelPrinting.templates.price_tag')}</MenuItem>
                </TextField>
                <TextField select label={t('labelPrinting.quantityMode')} value={options.quantityMode} onChange={(event) => updateOption('quantityMode', event.target.value as LabelQuantityMode)}>
                  <MenuItem value="received_quantity">{t('labelPrinting.quantityModes.received_quantity')}</MenuItem>
                  <MenuItem value="one_each_line">{t('labelPrinting.quantityModes.one_each_line')}</MenuItem>
                  <MenuItem value="one_each_serial">{t('labelPrinting.quantityModes.one_each_serial')}</MenuItem>
                  <MenuItem value="fixed">{t('labelPrinting.quantityModes.fixed')}</MenuItem>
                </TextField>
                {options.quantityMode === 'fixed' && (
                  <TextField
                    type="number"
                    label={t('labelPrinting.fixedQuantity')}
                    value={options.fixedQuantity}
                    onChange={(event) => updateOption('fixedQuantity', Math.max(1, Number(event.target.value) || 1))}
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                  />
                )}
                <TextField select label={t('labelPrinting.barcodeType')} value={options.barcodeType} onChange={(event) => updateOption('barcodeType', event.target.value as never)}>
                  <MenuItem value="code39">{t('labelPrinting.barcodeTypes.code39')}</MenuItem>
                  <MenuItem value="none">{t('labelPrinting.barcodeTypes.none')}</MenuItem>
                </TextField>
                <TextField select label={t('labelPrinting.barcodeLayout')} value={options.barcodeLayout} onChange={(event) => updateOption('barcodeLayout', event.target.value as LabelBarcodeLayout)}>
                  <MenuItem value="single">{t('labelPrinting.barcodeLayouts.single')}</MenuItem>
                  <MenuItem value="two_barcodes">{t('labelPrinting.barcodeLayouts.two_barcodes')}</MenuItem>
                  <MenuItem value="combined">{t('labelPrinting.barcodeLayouts.combined')}</MenuItem>
                </TextField>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                  <TextField type="number" label={t('labelPrinting.widthMm')} value={options.widthMm} onChange={(event) => updateOption('widthMm', Math.max(20, Number(event.target.value) || defaultOptions.widthMm))} />
                  <TextField type="number" label={t('labelPrinting.heightMm')} value={options.heightMm} onChange={(event) => updateOption('heightMm', Math.max(15, Number(event.target.value) || defaultOptions.heightMm))} />
                  <TextField type="number" label={t('labelPrinting.columns')} value={options.columns} onChange={(event) => updateOption('columns', Math.max(1, Math.min(8, Number(event.target.value) || 1)))} />
                  <TextField type="number" label={t('labelPrinting.gapMm')} value={options.gapMm} onChange={(event) => updateOption('gapMm', Math.max(0, Number(event.target.value) || 0))} />
                  <TextField type="number" label={t('labelPrinting.marginMm')} value={options.marginMm} onChange={(event) => updateOption('marginMm', Math.max(0, Number(event.target.value) || 0))} />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2">{t('labelPrinting.fields')}</Typography>
                {renderSwitch('showBusinessName', t('labelPrinting.fieldNames.businessName'))}
                {renderSwitch('showProductName', t('labelPrinting.fieldNames.productName'))}
                {renderSwitch('showSku', t('labelPrinting.fieldNames.sku'))}
                {renderSwitch('showPrice', t('labelPrinting.fieldNames.price'))}
                {renderSwitch('showLot', t('labelPrinting.fieldNames.lot'))}
                {renderSwitch('showExpiry', t('labelPrinting.fieldNames.expiry'))}
                {renderSwitch('showBarcodeTextLines', t('labelPrinting.fieldNames.barcodeTextLines'))}
                {renderSwitch('showReceivedDate', t('labelPrinting.fieldNames.receivedDate'))}
                {renderSwitch('showPurchaseNumber', t('labelPrinting.fieldNames.purchaseNumber'))}
                {renderSwitch('showWarehouse', t('labelPrinting.fieldNames.warehouse'))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Box className="label-print-root">
          <Box
            className="label-sheet"
            sx={{
              bgcolor: '#fff',
              color: '#111',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: `${options.marginMm}mm`,
              overflow: 'auto',
              boxShadow: 1,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${options.columns}, ${options.widthMm}mm)`,
                gap: `${options.gapMm}mm`,
                alignItems: 'start',
              }}
            >
              {labels.map((label) => (
                <LabelCard
                  key={label.printKey}
                  item={label}
                  options={options}
                  businessName={business?.name ?? ''}
                  dateFormat={dateFormat}
                  language={i18n.language}
                  currencyFormatter={currencyFormatter}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Stack>
  )
}

function LabelCard({
  item,
  options,
  businessName,
  dateFormat,
  language,
  currencyFormatter,
}: {
  item: ExpandedLabelItem
  options: LabelPrintOptions
  businessName: string
  dateFormat: string
  language: string
  currencyFormatter: Intl.NumberFormat
}) {
  const showLot = options.showLot && item.lotNumber && options.template !== 'serial'
  const showSerial = item.serialNumber && ['serial', 'product'].includes(options.template)
  const showPrice = options.showPrice && item.price !== null && options.template !== 'lot' && options.template !== 'serial'
  const tracking = trackingValue(item)
  const showTwoBarcodes = options.barcodeLayout === 'two_barcodes' && !!item.sku && !!tracking

  return (
    <Box
      className="label-card"
      sx={{
        width: `${options.widthMm}mm`,
        height: `${options.heightMm}mm`,
        border: '1px solid #d0d0d0',
        p: '2mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        bgcolor: '#fff',
        color: '#111',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Stack spacing={0.2} sx={{ minWidth: 0 }}>
        {options.showBusinessName && businessName && (
          <Typography sx={{ fontSize: 8, fontWeight: 800, lineHeight: 1.1, color: '#111' }} noWrap>
            {businessName}
          </Typography>
        )}
        {options.showProductName && (
          <Typography sx={{ fontSize: options.template === 'price_tag' ? 10 : 8.5, fontWeight: 900, lineHeight: 1.08, color: '#111' }}>
            {item.productName}
          </Typography>
        )}
        {showPrice && (
          <Typography sx={{ fontSize: options.template === 'price_tag' ? 13 : 9, fontWeight: 900, lineHeight: 1, color: '#111' }}>
            {formatMoney(item.price, currencyFormatter)}
          </Typography>
        )}
      </Stack>

      {options.barcodeType === 'code39' && (
        <Stack spacing={0.2}>
          {showTwoBarcodes ? (
            <>
              <Code39Barcode value={item.sku ?? ''} height={options.heightMm <= 24 ? 13 : 16} showText={false} />
              <Code39Barcode value={tracking ?? ''} height={options.heightMm <= 24 ? 13 : 16} showText={false} />
            </>
          ) : (
            <Code39Barcode
              value={options.barcodeLayout === 'combined' ? combinedBarcodeValue(item) : barcodeValue(item)}
              height={options.heightMm <= 24 ? 20 : 26}
              showText={false}
            />
          )}
          {options.showBarcodeTextLines && (
            <Stack spacing={0.1}>
              {item.sku && (
                <Typography sx={{ fontSize: 7, fontWeight: 800, lineHeight: 1, color: '#111' }} noWrap>
                  SKU: {item.sku}
                </Typography>
              )}
              {(item.serialNumber || item.lotNumber) && (
                <Typography sx={{ fontSize: 7, fontWeight: 800, lineHeight: 1, color: '#111' }} noWrap>
                  {item.serialNumber ? `SN: ${item.serialNumber}` : `LOT: ${item.lotNumber}`}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      )}

      <Stack spacing={0.15} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {options.showSku && item.sku && <Chip size="small" label={item.sku} sx={{ height: 15, fontSize: 7, bgcolor: '#f5f5f5', color: '#111' }} />}
          {showLot && <Chip size="small" label={`Lot ${item.lotNumber}`} sx={{ height: 15, fontSize: 7, bgcolor: '#f5f5f5', color: '#111' }} />}
          {showSerial && <Chip size="small" label={`SN ${item.serialNumber}`} sx={{ height: 15, fontSize: 7, bgcolor: '#f5f5f5', color: '#111' }} />}
        </Stack>
        {options.showExpiry && item.expiryDate && (
          <Typography sx={{ fontSize: 7, lineHeight: 1, color: '#111' }}>
            EXP: {formatAppDate(item.expiryDate, dateFormat, language)}
          </Typography>
        )}
        {options.showReceivedDate && item.receivedAt && (
          <Typography sx={{ fontSize: 7, lineHeight: 1, color: '#111' }}>
            REC: {formatAppDate(item.receivedAt, dateFormat, language)}
          </Typography>
        )}
        {(options.showPurchaseNumber || options.showWarehouse) && <Divider sx={{ borderColor: '#ddd' }} />}
        {options.showPurchaseNumber && (
          <Typography sx={{ fontSize: 6.8, lineHeight: 1, color: '#111' }} noWrap>
            PO: {item.purchaseNumber}
          </Typography>
        )}
        {options.showWarehouse && item.warehouseName && (
          <Typography sx={{ fontSize: 6.8, lineHeight: 1, color: '#111' }} noWrap>
            {item.warehouseName}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
