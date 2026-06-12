<?php

namespace App\Services\Sales;

use App\Models\Sale;
use App\Models\Business;
use App\Services\Foundation\SettingsService;
use App\Support\Sales\InvoiceTemplateRegistry;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoicePrintService
{
    public function __construct(
        protected SettingsService $settings,
    ) {}

    public function getTemplates(): array
    {
        return InvoiceTemplateRegistry::all();
    }

    public function resolveTemplate(?string $template, ?Sale $sale = null): string
    {
        if ($template && InvoiceTemplateRegistry::exists($template)) {
            return $template;
        }

        if ($sale && $sale->type === 'pos_sale') {
            return (string) $this->settings->get('pos', 'invoice_layout');
        }

        return (string) $this->settings->get('invoice', 'invoice_layout');
    }

    public function renderHtml(Sale $sale, ?string $template = null): string
    {
        $sale->loadMissing([
            'business',
            'branch',
            'customer',
            'creator',
            'parentSale',
            'items.product.unit',
            'items.product.subUnit',
            'items.variation.subUnit',
            'items.subUnit',
        ]);

        $template = $this->resolveTemplate($template, $sale);
        $business = $sale->business;
        $settings = $this->getInvoiceSettings($sale);

        $view = InvoiceTemplateRegistry::view($template);

        return view($view, compact('sale', 'business', 'settings'))->render();
    }

    public function renderPdf(Sale $sale, ?string $template = null): \Barryvdh\DomPDF\PDF
    {
        $html = $this->renderHtml($sale, $template);

        return Pdf::loadHTML($html)
            ->setPaper('a4')
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);
    }

    protected function getInvoiceSettings(Sale $sale): array
    {
        $businessId = $sale->business_id;
        $defaults = $this->settings->getGroup('invoice');

        $branchOverrides = $sale->branch?->invoice_settings ?? [];

        return array_merge($defaults, $branchOverrides);
    }
}
