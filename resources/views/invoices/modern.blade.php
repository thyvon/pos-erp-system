<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
@php
  $documentTitle = $sale->type === 'pos_sale' ? __('RECEIPT') : __('INVOICE');
  $documentLabel = $sale->type === 'pos_sale' ? __('Receipt') : __('Invoice');
@endphp
<title>{{ $documentTitle }} {{ $sale->sale_number }}</title>
<style>
  @include('invoices.partials.font-face')
  @page { margin: 0; }
  body {
    font-family: 'Kantumruy Pro', sans-serif;
    font-size: 9.5pt;
    color: #333;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background: #f4f6f8;
  }
  .invoice-wrap { max-width: 800px; margin: 20px auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

  .top-bar { background: #1e293b; color: #fff; padding: 24px 40px; display: flex; justify-content: space-between; align-items: center; }
  .top-bar .business-name { font-size: 16pt; font-weight: 700; margin: 0; }
  .top-bar .invoice-label { font-size: 14pt; font-weight: 300; opacity: 0.8; margin: 0; }

  .body-content { padding: 30px 40px; }

  .header-row { display: flex; justify-content: space-between; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
  .header-row .block { }
  .header-row .block .label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
  .header-row .block .value { font-size: 9.5pt; color: #1e293b; margin: 0; }
  .header-row .block .value strong { font-weight: 700; }

  .badge { display: inline-block; background: #e2e8f0; padding: 2px 10px; border-radius: 12px; font-size: 8pt; font-weight: 600; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  table.items thead th {
    border-bottom: 2px solid #1e293b; font-size: 7.5pt; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;
    padding: 8px 12px; text-align: left;
  }
  table.items thead th.right { text-align: right; }
  table.items tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; }
  table.items tbody td.right { text-align: right; }

  .summary { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .summary table { width: 280px; border-collapse: collapse; }
  .summary td { padding: 5px 12px; font-size: 9pt; }
  .summary td.label { text-align: left; color: #64748b; }
  .summary td.value { text-align: right; font-weight: 600; }
  .summary .total-row td { border-top: 2px solid #1e293b; font-size: 11pt; font-weight: 700; color: #1e293b; padding-top: 8px; }

  .payment-bar {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
    padding: 14px 18px; margin-bottom: 20px; font-size: 9pt;
    display: flex; gap: 24px; flex-wrap: wrap;
  }
  .payment-bar .item { }
  .payment-bar .item .lbl { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .payment-bar .item .val { font-weight: 700; color: #1e293b; }

  .notes-section { margin-top: 20px; padding: 16px 18px; background: #f8fafc; border-radius: 6px; }
  .notes-section .label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
  .notes-section .text { font-size: 8.5pt; color: #475569; }

  .footer-bar { background: #f8fafc; padding: 16px 40px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; }

  @media print {
    body { background: #fff; }
    .invoice-wrap { box-shadow: none; margin: 0 auto; }
  }
</style>
</head>
<body>
<div class="invoice-wrap">
  {{-- Top Bar --}}
  <div class="top-bar">
    <div>
      <h1 class="business-name">{{ $business->name }}</h1>
      @if ($business->tax_id)
        <div style="font-size:8pt; opacity:0.7; margin-top:2px;">{{ __('Tax ID') }}: {{ $business->tax_id }}</div>
      @endif
    </div>
    <div class="invoice-label">{{ $documentTitle }}</div>
  </div>

  <div class="body-content">
    {{-- Logo & Address --}}
    @if ($settings['show_logo'] ?? false && $business->logo_url)
    <div style="margin-bottom:20px;">
      <img src="{{ $business->logo_url }}" style="max-height:50px;" alt="Logo"/>
    </div>
    @endif

    <div style="font-size:8.5pt; color:#64748b; margin-bottom:24px;">
      @if ($business->address) {{ is_string($business->address) ? $business->address : ($business->address['village'] ?? '') . ', ' . ($business->address['commune'] ?? '') . ', ' . ($business->address['district'] ?? '') . ', ' . ($business->address['province_city'] ?? '') }}<br/> @endif
      @if ($business->phone) {{ $business->phone }}<br/> @endif
      @if ($business->email) {{ $business->email }} @endif
    </div>

    {{-- Header Row --}}
    <div class="header-row">
      <div class="block">
        <div class="label">{{ __('Bill To') }}</div>
        <p class="value">
          <strong>{{ $sale->customer->name ?? '-' }}</strong><br/>
          @if ($sale->customer->phone ?? false) {{ $sale->customer->phone }}<br/> @endif
          @if ($sale->customer->email ?? false) {{ $sale->customer->email }}<br/> @endif
          @if ($sale->customer->tax_id ?? false) {{ __('Tax ID') }}: {{ $sale->customer->tax_id }}@endif
        </p>
      </div>
      <div class="block" style="text-align:right">
        <div class="label">{{ $documentLabel }}</div>
        <p class="value">
          <strong>{{ $sale->sale_number }}</strong><br/>
          <span class="badge">{{ $sale->sale_date }}</span>
          @if ($sale->due_date) &nbsp; <span class="badge">{{ __('Due') }}: {{ $sale->due_date }}</span> @endif
        </p>
      </div>
    </div>

    {{-- Items Table --}}
    <table class="items">
      <thead>
        <tr>
          <th>#</th>
          <th>{{ __('Product') }}</th>
          <th class="right">{{ __('Qty') }}</th>
          <th class="right">{{ __('Price') }}</th>
          <th class="right">{{ __('Discount') }}</th>
          @if ($settings['show_tax'] ?? true)
          <th class="right">{{ __('Tax') }}</th>
          @endif
          <th class="right">{{ __('Total') }}</th>
        </tr>
      </thead>
      <tbody>
        @foreach ($sale->items as $index => $item)
        <tr>
          <td>{{ $index + 1 }}</td>
          <td>{{ $item->product->name ?? '-' }}{{ $item->variation ? ' / '.$item->variation->name : '' }}</td>
          <td class="right">{{ (float)$item->quantity }}</td>
          <td class="right">{{ number_format((float)$item->unit_price, 2) }}</td>
          <td class="right">{{ (float)$item->discount_amount > 0 ? number_format((float)$item->discount_amount, 2) : '-' }}</td>
          @if ($settings['show_tax'] ?? true)
          <td class="right">{{ (float)$item->tax_amount > 0 ? number_format((float)$item->tax_amount, 2) : '-' }}</td>
          @endif
          <td class="right">{{ number_format((float)$item->total_amount, 2) }}</td>
        </tr>
        @endforeach
      </tbody>
    </table>

    {{-- Totals --}}
    <div class="summary">
      <table>
        <tr>
          <td class="label">{{ __('Subtotal') }}</td>
          <td class="value">{{ number_format((float)$sale->subtotal, 2) }}</td>
        </tr>
        @if ((float)$sale->discount_amount > 0)
        <tr>
          <td class="label">{{ __('Discount') }}</td>
          <td class="value">-{{ number_format((float)$sale->discount_amount, 2) }}</td>
        </tr>
        @endif
        @if ((float)$sale->shipping_charges > 0)
        <tr>
          <td class="label">{{ __('Shipping') }}</td>
          <td class="value">{{ number_format((float)$sale->shipping_charges, 2) }}</td>
        </tr>
        @endif
        @if ($settings['show_tax'] ?? true)
        <tr>
          <td class="label">{{ __('Tax') }}</td>
          <td class="value">{{ number_format((float)$sale->tax_amount, 2) }}</td>
        </tr>
        @endif
        <tr class="total-row">
          <td class="label">{{ __('Total') }}</td>
          <td class="value">{{ number_format((float)$sale->total_amount, 2) }}</td>
        </tr>
      </table>
    </div>

    {{-- Payment Bar --}}
    <div class="payment-bar">
      <div class="item">
        <div class="lbl">{{ __('Paid') }}</div>
        <div class="val">{{ number_format((float)$sale->paid_amount, 2) }}</div>
      </div>
      <div class="item">
        <div class="lbl">{{ __('Due') }}</div>
        <div class="val">{{ number_format(max(0, (float)$sale->total_amount - (float)$sale->paid_amount), 2) }}</div>
      </div>
      <div class="item">
        <div class="lbl">{{ __('Branch') }}</div>
        <div class="val">{{ $sale->branch->name ?? '-' }}</div>
      </div>
      @if ($sale->creator)
      <div class="item">
        <div class="lbl">{{ __('Sales Person') }}</div>
        <div class="val">{{ trim(($sale->creator->first_name ?? '') . ' ' . ($sale->creator->last_name ?? '')) ?: '-' }}</div>
      </div>
      @endif
    </div>

    {{-- Notes --}}
    @if ($sale->notes)
    <div class="notes-section">
      <div class="label">{{ __('Notes') }}</div>
      <div class="text">{{ $sale->notes }}</div>
    </div>
    @endif

    {{-- Terms --}}
    @if (!empty($settings['terms_conditions']))
    <div class="notes-section" style="margin-top:12px;">
      <div class="label">{{ __('Terms & Conditions') }}</div>
      <div class="text">{{ $settings['terms_conditions'] }}</div>
    </div>
    @endif
  </div>

  {{-- Footer --}}
  @if (!empty($settings['footer_note']))
  <div class="footer-bar">{{ $settings['footer_note'] }}</div>
  @endif
</div>
</body>
</html>
