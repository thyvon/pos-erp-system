<?php

namespace App\Services\Sales;

use App\Models\Sale;
use App\Models\Business;
use App\Services\Foundation\SettingsService;
use App\Support\Sales\InvoiceTemplateRegistry;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\File;

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
        $html = $this->useLocalFontUrls($html);

        $pdf = Pdf::setPaper('a4')
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);

        $this->registerPdfFonts($pdf);

        return $pdf
            ->loadHTML($html)
            ->setPaper('a4')
            ->setOption('isRemoteEnabled', true);
    }

    protected function useLocalFontUrls(string $html): string
    {
        $publicFontPath = str_replace('\\', '/', public_path('fonts/kantumruy-pro'));
        $localFontUrl = str_starts_with($publicFontPath, '/')
            ? "file://{$publicFontPath}/"
            : "file:///{$publicFontPath}/";

        return str_replace(
            asset('fonts/kantumruy-pro').'/',
            $localFontUrl,
            $html
        );
    }

    protected function registerPdfFonts(\Barryvdh\DomPDF\PDF $pdf): void
    {
        $dompdf = $pdf->getDomPDF();
        File::ensureDirectoryExists($dompdf->getOptions()->getFontDir());
        $fontMetrics = $dompdf->getFontMetrics();

        foreach ([300, 400, 600, 700] as $weight) {
            $fontMetrics->registerFont(
                [
                    'family' => 'Kantumruy Pro',
                    'style' => 'normal',
                    'weight' => $weight,
                ],
                public_path("fonts/kantumruy-pro/kantumruy-pro-{$weight}-normal.ttf")
            );
        }
    }

    protected function getInvoiceSettings(Sale $sale): array
    {
        $businessId = $sale->business_id;
        $defaults = $this->settings->getGroup('invoice');

        $branchOverrides = $sale->branch?->invoice_settings ?? [];

        return array_merge($defaults, $branchOverrides);
    }
}
