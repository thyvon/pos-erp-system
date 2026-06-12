<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
@php
  $documentTitle      = $sale->type === 'pos_sale' ? __('RECEIPT') : __('INVOICE');
  $documentNumberLabel = $sale->type === 'pos_sale' ? __('Receipt No') : __('Invoice No');
  $currency    = $settings['currency_symbol'] ?? '$';
  $balance     = max(0, (float) $sale->total_amount - (float) $sale->paid_amount);
  $totalQty    = $sale->items->sum(fn ($i) => (float) $i->quantity);
  $blankRows   = max(0, 12 - $sale->items->count());
  $showTax     = $settings['show_tax'] ?? true;

  $formatMoney  = fn ($v) => $currency . number_format((float) $v, 2);
  $formatNumber = fn ($v) => rtrim(rtrim(number_format((float) $v, 4), '0'), '.');

  $formatAddress = function ($address) {
      if (!$address) return null;
      if (is_string($address)) return $address;
      return implode(', ', array_filter((array) $address));
  };

  $businessNameKh = $business->name_kh ?? $business->secondary_name ?? null;
  $businessNameEn = $business->name;
@endphp
<title>{{ $documentTitle }} {{ $sale->sale_number }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; }
body {
    margin: 0; padding: 0;
    font-family: 'Public Sans', 'Kantumruy Pro', sans-serif;
    font-size: 11px; color: #000; background: #fff;
}
.invoice { width: 194mm; min-height: 281mm; margin: 0 auto; background: #fff; }
table { width: 100%; border-collapse: collapse; }

/* HEADER */
.header { margin-bottom: 5px; }
.header td { vertical-align: top; }
.logo { width: 90px; }
.logo img { max-width: 80px; max-height: 70px; }
.company { text-align: center; }
.company-kh { font-size: 26px; font-weight: bold; color: #3c4699; line-height: 1.2; }
.company-en { font-size: 17px; font-weight: bold; color: #3c4699; text-transform: uppercase; line-height: 1.3; }
.company-info { font-size: 10.5px; line-height: 1.5; }

/* CUSTOMER + INVOICE BOX */
.info-box { border: 1px solid #000; margin-top: 4px; }
.info-box td { border: 1px solid #000; vertical-align: top; }
.info-inner { width: 100%; }
.info-inner td { border: none; padding: 2px 5px; line-height: 1.4; }
.invoice-title { text-align: center; font-weight: bold; font-size: 16px; padding: 5px; border-bottom: 1px solid #000; }

/* ITEM TABLE */
.items { border: 1px solid #000; table-layout: fixed; margin-top: 6px; }
.items th { border: 1px solid #000; padding: 4px 3px; font-size: 9.5px; text-align: center; font-weight: bold; background: #f5f5f5; }
.items td { border: 1px solid #000; padding: 3px; font-size: 9.5px; line-height: 1.25; }
.items tbody tr { height: 24px; }
.blank-row { height: 24px; }
.text-center { text-align: center; }
.text-right  { text-align: right; }
.desc        { text-align: left; }
.muted       { color: #555; }

/* SUMMARY */
.summary { margin-top: 5px; }
.summary td { vertical-align: top; }
.summary-left  { width: 65%; }
.summary-right { width: 35%; }
.summary-left td { padding: 2px 4px; line-height: 1.4; }
.total-table td { padding: 3px 4px; }
.total-table .lbl { text-align: left; font-weight: bold; }
.total-table .amt { text-align: right; font-weight: bold; }
.total-table .grand-row td { border-top: 1px solid #000; }

/* SIGNATURE */
.signature { margin-top: 40px; }
.signature td { width: 33.33%; text-align: center; vertical-align: bottom; font-size: 10px; }
.sign-line { margin-top: 55px; border-top: 1px solid #000; width: 90%; margin-left: auto; margin-right: auto; }
.sign-date { margin-top: 5px; }

/* TERMS & FOOTER */
.terms { margin-top: 14px; font-size: 9.5px; line-height: 1.4; }
.terms-title { font-weight: bold; margin-bottom: 3px; }
.footer { margin-top: 18px; font-size: 9.5px; color: #333; }
.footer-note { margin-top: 4px; }

@media print { .invoice { width: auto; min-height: auto; } }
</style>
</head>
<body>
<div class="invoice">

    <!-- HEADER -->
    <table class="header">
        <tr>
            <td class="logo">
                @if (($settings['show_logo'] ?? false) && $business->logo_url)
                    <img src="{{ $business->logo_url }}" alt="Logo"/>
                @endif
            </td>
            <td class="company">
                @if ($businessNameKh)
                    <div class="company-kh">{{ $businessNameKh }}</div>
                @endif
                <div class="company-en">{{ $businessNameEn }}</div>
                @if ($formatAddress($business->address))
                    <div class="company-info">{{ $formatAddress($business->address) }}</div>
                @endif
                <div class="company-info">
                    @if ($business->phone) {{ __('Tel') }}: {{ $business->phone }} @endif
                    @if ($business->email) | {{ __('Email') }}: {{ $business->email }} @endif
                    @if ($business->website ?? false) | {{ $business->website }} @endif
                </div>
                @if ($business->tax_id)
                    <div class="company-info">{{ __('Tax ID') }}: {{ $business->tax_id }}</div>
                @endif
            </td>
            <td style="width: 90px;"></td>
        </tr>
    </table>

    <!-- CUSTOMER + INVOICE BOX -->
    <table class="info-box">
        <tr>
            <td width="68%">
                <table class="info-inner">
                    <tr>
                        <td width="110"><b>{{ __('Cust. Name') }}</b></td>
                        <td>{{ $sale->customer->name ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ __('Contact') }}</b></td>
                        <td>{{ $sale->customer->contact_person ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ __('Address') }}</b></td>
                        <td>{{ $formatAddress($sale->customer->address ?? null) ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ __('Phone') }}</b></td>
                        <td>{{ $sale->customer->phone ?? $sale->customer->mobile ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ __('V.A.T / VAT') }}</b></td>
                        <td>{{ $sale->customer->tax_id ?? '-' }}</td>
                    </tr>
                </table>
            </td>
            <td width="32%">
                <div class="invoice-title">{{ $documentTitle }}</div>
                <table class="info-inner">
                    <tr>
                        <td width="120"><b>{{ $documentNumberLabel }}</b></td>
                        <td>{{ $sale->sale_number }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ __('Date') }}</b></td>
                        <td>{{ optional($sale->sale_date)->format('d/m/Y') }}</td>
                    </tr>
                    @if ($sale->due_date)
                    <tr>
                        <td><b>{{ __('Due Date') }}</b></td>
                        <td>{{ optional($sale->due_date)->format('d/m/Y') }}</td>
                    </tr>
                    @endif
                    @if ($sale->parentSale)
                    <tr>
                        <td><b>{{ __('Customer PO') }}</b></td>
                        <td>{{ $sale->parentSale->sale_number }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td><b>{{ __('Salesman') }}</b></td>
                        <td>{{ trim(($sale->creator->first_name ?? '') . ' ' . ($sale->creator->last_name ?? '')) ?: '-' }}</td>
                    </tr>
                    <tr>
                        <td><b>{{ __('Branch') }}</b></td>
                        <td>{{ $sale->branch->name ?? '-' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- ITEM TABLE -->
    <table class="items">
        <thead>
            <tr>
                <th width="35">N°</th>
                <th width="65">{{ __('ITEM CODE') }}</th>
                <th>{{ __('DESCRIPTION') }}</th>
                <th width="50">{{ __('UNIT') }}</th>
                <th width="50">{{ __('QTY') }}</th>
                <th width="70">{{ __('PRICE') }}</th>
                <th width="55">{{ __('DISC') }}</th>
                @if ($showTax)
                    <th width="55">{{ __('TAX') }}</th>
                @endif
                <th width="80">{{ __('TOTAL') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($sale->items as $index => $item)
            @php
                $sku = $item->variation->sku ?? $item->product->sku ?? '-';
                $unit = $item->subUnit->short_name
                    ?? $item->subUnit->name
                    ?? $item->product->unit->short_name
                    ?? $item->product->unit->name
                    ?? '-';
                $desc = trim(
                    ($item->product->name ?? '-') .
                    ($item->variation ? ' / ' . $item->variation->name : '')
                );
            @endphp
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $sku }}</td>
                <td class="desc">
                    {{ $desc }}
                    @if ($item->notes)
                        <br/><span class="muted">{{ $item->notes }}</span>
                    @endif
                </td>
                <td class="text-center">{{ $unit }}</td>
                <td class="text-right">{{ $formatNumber($item->quantity) }}</td>
                <td class="text-right">{{ $formatMoney($item->unit_price) }}</td>
                <td class="text-right">
                    {{ (float) $item->discount_amount > 0 ? $formatMoney($item->discount_amount) : '0' }}
                </td>
                @if ($showTax)
                    <td class="text-right">
                        {{ (float) $item->tax_amount > 0 ? $formatMoney($item->tax_amount) : '0' }}
                    </td>
                @endif
                <td class="text-right">{{ $formatMoney($item->total_amount) }}</td>
            </tr>
            @endforeach

            @for ($i = 0; $i < $blankRows; $i++)
            <tr class="blank-row">
                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td>
                @if ($showTax)<td></td>@endif
                <td></td>
            </tr>
            @endfor
        </tbody>
    </table>

    <!-- SUMMARY -->
    <table class="summary">
        <tr>
            <td class="summary-left">
                <table>
                    <tr>
                        <td width="120"><b>{{ __('Total Qty') }} :</b></td>
                        <td>{{ $formatNumber($totalQty) }}</td>
                    </tr>
                    @if ($sale->notes)
                    <tr>
                        <td valign="top"><b>{{ __('Note') }} :</b></td>
                        <td>{{ $sale->notes }}</td>
                    </tr>
                    @endif
                </table>
            </td>
            <td class="summary-right">
                <table class="total-table">
                    @if ((float) $sale->subtotal > 0 && ((float) $sale->discount_amount > 0 || (float) $sale->shipping_charges > 0 || $showTax))
                    <tr>
                        <td class="lbl">{{ __('SUBTOTAL') }}</td>
                        <td class="amt">{{ $formatMoney($sale->subtotal) }}</td>
                    </tr>
                    @endif
                    @if ((float) $sale->discount_amount > 0)
                    <tr>
                        <td class="lbl">{{ __('DISCOUNT') }}</td>
                        <td class="amt">-{{ $formatMoney($sale->discount_amount) }}</td>
                    </tr>
                    @endif
                    @if ((float) $sale->shipping_charges > 0)
                    <tr>
                        <td class="lbl">{{ __('SHIPPING') }}</td>
                        <td class="amt">{{ $formatMoney($sale->shipping_charges) }}</td>
                    </tr>
                    @endif
                    @if ($showTax)
                    <tr>
                        <td class="lbl">{{ __('TAX') }}</td>
                        <td class="amt">{{ $formatMoney($sale->tax_amount) }}</td>
                    </tr>
                    @endif
                    <tr class="grand-row">
                        <td class="lbl">{{ __('GRAND TOTAL') }}</td>
                        <td class="amt">{{ $formatMoney($sale->total_amount) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">{{ __('PAID AMOUNT') }}</td>
                        <td class="amt">{{ $formatMoney($sale->paid_amount) }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">{{ __('BALANCE') }}</td>
                        <td class="amt">{{ $formatMoney($balance) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- SIGNATURE -->
    <table class="signature">
        <tr>
            <td>
                {{ __('Customer Signature') }}
                <div class="sign-line"></div>
                <div class="sign-date">{{ __('Date') }}: ____ / ____ / ______</div>
            </td>
            <td>
                {{ __('Authorized By') }}
                <div class="sign-line"></div>
                <div class="sign-date">{{ __('Date') }}: ____ / ____ / ______</div>
            </td>
            <td>
                {{ __('Delivered By') }}
                <div class="sign-line"></div>
                <div class="sign-date">{{ __('Date') }}: ____ / ____ / ______</div>
            </td>
        </tr>
    </table>

    <!-- TERMS & FOOTER -->
    @if (!empty($settings['terms_conditions']))
    <div class="terms">
        <div class="terms-title">{{ __('Terms & Conditions') }}</div>
        <div>{{ $settings['terms_conditions'] }}</div>
    </div>
    @endif

    <div class="footer">
        <div class="footer-note">
            {{ $settings['footer_note'] ?? __('Goods sold cannot be refunded and received in good condition.') }}
        </div>
    </div>

</div>
</body>
</html>
