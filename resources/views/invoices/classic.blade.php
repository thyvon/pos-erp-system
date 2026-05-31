<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>
  @page { margin: 20px; }
  body {
    font-family: 'DejaVu Sans', sans-serif;
    font-size: 10pt;
    color: #333;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }
  .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #ddd; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
  .header-left { }
  .header-left .business-name { font-size: 18pt; font-weight: 700; color: #2563eb; margin: 0 0 4px 0; }
  .header-left .business-details { font-size: 8.5pt; color: #666; }
  .header-right { text-align: right; }
  .header-right .invoice-title { font-size: 20pt; font-weight: 700; color: #2563eb; margin: 0; }
  .header-right .invoice-number { font-size: 10pt; color: #555; margin: 4px 0 0 0; }

  .info-grid { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .info-block { }
  .info-block .info-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 2px; }
  .info-block .info-value { font-size: 10pt; color: #333; margin: 0; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.items thead th {
    background: #2563eb; color: #fff; font-size: 8pt; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    padding: 8px 10px; text-align: left;
  }
  table.items thead th.right { text-align: right; }
  table.items tbody td {
    padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 9pt;
  }
  table.items tbody td.right { text-align: right; }
  table.items tbody tr:nth-child(even) { background: #f8fafc; }

  .totals { width: 300px; margin-left: auto; }
  .totals table { width: 100%; border-collapse: collapse; }
  .totals td { padding: 4px 10px; font-size: 9pt; }
  .totals td.label { text-align: right; color: #666; }
  .totals td.value { text-align: right; font-weight: 600; }
  .totals .grand-total td { font-size: 11pt; font-weight: 700; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 6px; }

  .payment-info { margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; font-size: 9pt; }
  .payment-info .label { font-weight: 700; color: #16a34a; }

  .terms { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; }
  .terms .label { font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #888; }
  .terms .text { font-size: 8.5pt; color: #555; }
  .footer { margin-top: 24px; text-align: center; font-size: 8pt; color: #999; }
</style>
</head>
<body>
<div class="invoice-box">
  {{-- Header --}}
  <div class="header">
    <div class="header-left">
      @if ($settings['show_logo'] ?? false && $business->logo_url)
        <img src="{{ $business->logo_url }}" style="max-height:60px; margin-bottom:8px;" alt="Logo"/>
      @endif
      <h1 class="business-name">{{ $business->name }}</h1>
      <div class="business-details">
        @if ($business->address)
          {{ is_string($business->address) ? $business->address : ($business->address['village'] ?? '') . ', ' . ($business->address['commune'] ?? '') . ', ' . ($business->address['district'] ?? '') . ', ' . ($business->address['province_city'] ?? '') }}<br/>
        @endif
        @if ($business->phone) {{ __('Phone') }}: {{ $business->phone }}<br/> @endif
        @if ($business->email) {{ $business->email }}<br/> @endif
        @if ($business->tax_id) {{ __('Tax ID') }}: {{ $business->tax_id }}@endif
      </div>
    </div>
    <div class="header-right">
      <p class="invoice-title">{{ __('INVOICE') }}</p>
      <p class="invoice-number">{{ $sale->sale_number }}</p>
    </div>
  </div>

  {{-- Customer & Info Grid --}}
  <div class="info-grid">
    <div class="info-block">
      <div class="info-label">{{ __('Bill To') }}</div>
      <p class="info-value">
        <strong>{{ $sale->customer->name ?? '-' }}</strong><br/>
        @if ($sale->customer->phone ?? false) {{ $sale->customer->phone }}<br/> @endif
        @if ($sale->customer->email ?? false) {{ $sale->customer->email }}<br/> @endif
        @if ($sale->customer->address ?? false) {{ is_string($sale->customer->address) ? $sale->customer->address : implode(', ', array_filter((array)$sale->customer->address)) }}<br/> @endif
        @if ($sale->customer->tax_id ?? false) {{ __('Tax ID') }}: {{ $sale->customer->tax_id }}@endif
      </p>
    </div>
    <div class="info-block" style="text-align:right">
      <div class="info-label">{{ __('Invoice Details') }}</div>
      <p class="info-value">
        <strong>{{ __('Invoice No') }}:</strong> {{ $sale->sale_number }}<br/>
        <strong>{{ __('Date') }}:</strong> {{ $sale->sale_date }}<br/>
        @if ($sale->due_date) <strong>{{ __('Due Date') }}:</strong> {{ $sale->due_date }}<br/> @endif
        <strong>{{ __('Branch') }}:</strong> {{ $sale->branch->name ?? '-' }}<br/>
        @if ($sale->created_by) <strong>{{ __('Sales Person') }}:</strong> {{ $sale->creator->name ?? '-' }}@endif
      </p>
    </div>
  </div>

  {{-- Items Table --}}
  <table class="items">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>{{ __('Product') }}</th>
        <th class="right" style="width:80px">{{ __('Qty') }}</th>
        <th class="right" style="width:90px">{{ __('Unit Price') }}</th>
        <th class="right" style="width:70px">{{ __('Discount') }}</th>
        @if ($settings['show_tax'] ?? true)
        <th class="right" style="width:70px">{{ __('Tax') }}</th>
        @endif
        <th class="right" style="width:100px">{{ __('Total') }}</th>
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
  <div class="totals">
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
      <tr class="grand-total">
        <td class="label">{{ __('Total') }}</td>
        <td class="value">{{ number_format((float)$sale->total_amount, 2) }}</td>
      </tr>
    </table>
  </div>

  {{-- Payment Info --}}
  <div class="payment-info">
    <span class="label">{{ __('Payment Status') }}:</span> {{ __('Paid') }} {{ number_format((float)$sale->paid_amount, 2) }}
    @if ((float)$sale->total_amount - (float)$sale->paid_amount > 0)
      | <span class="label">{{ __('Due') }}:</span> {{ number_format((float)$sale->total_amount - (float)$sale->paid_amount, 2) }}
    @endif
  </div>

  {{-- Notes --}}
  @if ($sale->notes)
  <div class="terms">
    <div class="label">{{ __('Notes') }}</div>
    <div class="text">{{ $sale->notes }}</div>
  </div>
  @endif

  {{-- Terms --}}
  @if (!empty($settings['terms_conditions']))
  <div class="terms">
    <div class="label">{{ __('Terms & Conditions') }}</div>
    <div class="text">{{ $settings['terms_conditions'] }}</div>
  </div>
  @endif

  {{-- Footer --}}
  @if (!empty($settings['footer_note']))
  <div class="footer">{{ $settings['footer_note'] }}</div>
  @endif
</div>
</body>
</html>
