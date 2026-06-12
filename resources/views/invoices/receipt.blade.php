<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
@php
  $documentTitle = __('RECEIPT');
  $currency = $settings['currency_symbol'] ?? '$';
  $totalQty = $sale->items->sum(fn ($i) => (float) $i->quantity);
  $balance = max(0, (float) $sale->total_amount - (float) $sale->paid_amount);

  $formatMoney  = fn ($v) => $currency . number_format((float) $v, 2);
  $formatNumber = fn ($v) => rtrim(rtrim(number_format((float) $v, 4), '0'), '.');

  $businessNameKh = $business->name_kh ?? $business->secondary_name ?? null;
  $businessNameEn = $business->name;

  $paperSize = $settings['receipt_paper_size'] ?? '80mm';
  $isSmallPaper = $paperSize === '58mm';
@endphp
<title>{{ $documentTitle }} {{ $sale->sale_number }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
<style>
@page {
    size: {{ $paperSize }} auto;
    margin: 0;
}
* { box-sizing: border-box; }
body {
    margin: 0; padding: {{ $isSmallPaper ? '2mm' : '4mm' }};
    font-family: 'Public Sans', 'Kantumruy Pro', sans-serif;
    font-size: {{ $isSmallPaper ? '8pt' : '9pt' }}; color: #000; background: #fff;
    line-height: 1.3;
}
.receipt { width: 100%; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.bold { font-weight: bold; }
.divider { border-top: 1px dashed #666; margin: 2mm 0; }

/* HEADER */
.header { margin-bottom: 3mm; }
.logo { margin-bottom: 2mm; }
.logo img { max-width: {{ $isSmallPaper ? '30mm' : '40mm' }}; max-height: 20mm; }
.company-kh { font-size: {{ $isSmallPaper ? '12pt' : '14pt' }}; font-weight: bold; margin-bottom: 1mm; }
.company-en { font-size: {{ $isSmallPaper ? '9pt' : '10pt' }}; font-weight: bold; text-transform: uppercase; }
.company-info { font-size: {{ $isSmallPaper ? '7pt' : '8pt' }}; margin-top: 1mm; }

/* INFO */
.info-row { display: flex; justify-content: space-between; font-size: {{ $isSmallPaper ? '7.5pt' : '8pt' }}; margin-bottom: 0.5mm; }
.info-label { color: #555; }

/* ITEMS */
.items-table { width: 100%; border-collapse: collapse; margin: 1mm 0; }
.items-table th { border-bottom: 1px solid #000; padding: 1mm 0; font-size: {{ $isSmallPaper ? '7.5pt' : '8pt' }}; text-align: left; }
.items-table td { padding: 2mm 0; font-size: {{ $isSmallPaper ? '7.5pt' : '8pt' }}; vertical-align: top; border-bottom: 1px dotted #ccc; }
.items-table tr:last-child td { border-bottom: none; }
.item-name { font-weight: bold; display: block; margin-bottom: 0.5mm; }
.item-meta { color: #555; font-size: {{ $isSmallPaper ? '7pt' : '7.5pt' }}; }

/* SUMMARY */
.summary-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
.summary-table td { padding: 0.5mm 0; font-size: {{ $isSmallPaper ? '8pt' : '9pt' }}; }
.summary-label { text-align: left; }
.summary-value { text-align: right; font-weight: bold; }
.total-row td { border-top: 1px solid #000; padding-top: 1.5mm; font-size: {{ $isSmallPaper ? '10pt' : '11pt' }}; }

/* FOOTER */
.footer { margin-top: 5mm; font-size: {{ $isSmallPaper ? '7.5pt' : '8pt' }}; }

@media print {
    body { padding: {{ $isSmallPaper ? '1mm' : '2mm' }}; }
}
</style>
</head>
<body>
<div class="receipt">
    <!-- HEADER -->
    <div class="header text-center">
        @if (($settings['show_logo'] ?? false) && $business->logo_url)
            <div class="logo"><img src="{{ $business->logo_url }}" alt="Logo"/></div>
        @endif
        @if ($businessNameKh)
            <div class="company-kh">{{ $businessNameKh }}</div>
        @endif
        <div class="company-en">{{ $businessNameEn }}</div>
        <div class="company-info">
            @if ($business->address) {{ is_string($business->address) ? $business->address : (($business->address['village'] ?? '') . ', ' . ($business->address['commune'] ?? '') . ', ' . ($business->address['district'] ?? '') . ', ' . ($business->address['province_city'] ?? '')) }}<br/> @endif
            @if ($business->phone) {{ __('Tel') }}: {{ $business->phone }} @endif
            @if ($business->tax_id) | {{ __('VAT') }}: {{ $business->tax_id }} @endif
        </div>
    </div>

    <div class="divider"></div>

    <!-- SALE INFO -->
    <div class="info-row">
        <span class="info-label">{{ __('Receipt No') }}:</span>
        <span class="bold">{{ $sale->sale_number }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">{{ __('Date') }}:</span>
        <span>{{ optional($sale->sale_date)->format('d/m/Y H:i') }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">{{ __('Customer') }}:</span>
        <span>{{ $sale->customer->name ?? __('Walk-in Customer') }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">{{ __('Cashier') }}:</span>
        <span>{{ trim(($sale->creator->first_name ?? '') . ' ' . ($sale->creator->last_name ?? '')) ?: '-' }}</span>
    </div>

    <div class="divider"></div>

    <!-- ITEMS -->
    <table class="items-table">
        <thead>
            <tr>
                <th>{{ __('ITEM') }}</th>
                <th class="text-right" width="40">{{ __('QTY') }}</th>
                <th class="text-right" width="60">{{ __('TOTAL') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sale->items as $item)
            @php
                $name = $item->product->name ?? '-';
                $variation = $item->variation ? ' (' . $item->variation->name . ')' : '';
                $unit = $item->subUnit->short_name
                    ?? $item->subUnit->name
                    ?? $item->product->unit->short_name
                    ?? $item->product->unit->name
                    ?? '';
            @endphp
            <tr>
                <td>
                    <span class="item-name">{{ $name }}{{ $variation }}</span>
                    <span class="item-meta">
                        {{ $formatMoney($item->unit_price) }}
                        @if ((float) $item->discount_amount > 0)
                            <span style="margin-left: 1mm;">(Disc: -{{ $formatMoney($item->discount_amount) }})</span>
                        @endif
                        @if ((float) ($item->tax_rate['rate'] ?? 0) > 0)
                            <span style="margin-left: 1mm;">(Tax: {{ (float) $item->tax_rate['rate'] }}%)</span>
                        @endif
                    </span>
                </td>
                <td class="text-right">{{ $formatNumber($item->quantity) }}<br/><small>{{ $unit }}</small></td>
                <td class="text-right">{{ $formatMoney($item->total_amount) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="divider"></div>

    <!-- SUMMARY -->
    <table class="summary-table">
        @if ((float) $sale->discount_amount > 0)
        <tr>
            <td class="summary-label">{{ __('Subtotal') }}</td>
            <td class="summary-value">{{ $formatMoney($sale->subtotal) }}</td>
        </tr>
        <tr>
            <td class="summary-label">{{ __('Discount') }}</td>
            <td class="summary-value">-{{ $formatMoney($sale->discount_amount) }}</td>
        </tr>
        @endif
        @if ((float) $sale->tax_amount > 0)
        <tr>
            <td class="summary-label">{{ __('Tax') }}</td>
            <td class="summary-value">{{ $formatMoney($sale->tax_amount) }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td class="summary-label bold">{{ __('TOTAL') }}</td>
            <td class="summary-value bold">{{ $formatMoney($sale->total_amount) }}</td>
        </tr>
        <tr>
            <td class="summary-label">{{ __('Paid') }}</td>
            <td class="summary-value">{{ $formatMoney($sale->paid_amount) }}</td>
        </tr>
        @if ($balance > 0)
        <tr>
            <td class="summary-label">{{ __('Balance') }}</td>
            <td class="summary-value">{{ $formatMoney($balance) }}</td>
        </tr>
        @endif
    </table>

    <div class="divider"></div>

    <!-- FOOTER -->
    <div class="footer text-center">
        @if ($settings['footer_note'] ?? false)
            <div>{{ $settings['footer_note'] }}</div>
        @else
            <div class="bold">{{ __('Thank you for your business!') }}</div>
            <div>{{ __('Please come again.') }}</div>
        @endif
        <div style="margin-top: 2mm; font-size: 7pt;">Printed at {{ now()->format('d/m/Y H:i:s') }}</div>
    </div>
</div>
</body>
</html>
