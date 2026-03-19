<?php

namespace App\Exceptions\Domain;

class InsufficientStockException extends DomainException
{
    public function __construct(string $message = 'Insufficient available stock.')
    {
        parent::__construct($message);
    }
}
