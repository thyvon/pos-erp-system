<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Models\Sale;
use App\Services\Sales\InvoicePrintService;
use App\Support\Sales\InvoiceTemplateRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvoicePrintController extends BaseApiController
{
    public function __construct(
        protected InvoicePrintService $printService,
    ) {}

    public function templates(): JsonResponse
    {
        return $this->success(
            collect(InvoiceTemplateRegistry::all())->map(fn ($t, $key) => [
                'id' => $key,
                'name' => $t['name'],
                'description' => $t['description'],
            ])->values(),
            'Invoice templates loaded.'
        );
    }

    public function preview(Sale $sale, Request $request): Response
    {
        $this->authorize('view', $sale);

        $template = $request->query('template');
        $html = $this->printService->renderHtml($sale, $template);

        return response($html, 200, ['Content-Type' => 'text/html']);
    }

    public function download(Sale $sale, Request $request): Response
    {
        $this->authorize('view', $sale);

        $template = $request->query('template');
        $pdf = $this->printService->renderPdf($sale, $template);

        $filename = str_replace('/', '-', $sale->sale_number) . '.pdf';

        return $pdf->download($filename);
    }

    public function view(Sale $sale, Request $request): Response
    {
        $this->authorize('view', $sale);

        $template = $request->query('template');
        $pdf = $this->printService->renderPdf($sale, $template);

        return $pdf->stream();
    }
}
