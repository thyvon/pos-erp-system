<?php

namespace App\Exceptions\Domain;

class MinimumSellingPriceException extends DomainException
{
    public function __construct(string $message = 'The selling price is below the allowed minimum.')
    {
        parent::__construct($message, 422);
    }
}
