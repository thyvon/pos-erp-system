<?php

namespace App\Http\Requests\Sales;

class StoreQuotationRequest extends StoreSaleRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'type' => 'quotation',
        ]);
    }
}
