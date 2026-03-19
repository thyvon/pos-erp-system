<?php

namespace App\Exceptions\Domain;

class InsufficientLotQtyException extends DomainException
{
    public function __construct(string $message = 'This lot has insufficient available quantity.')
    {
        parent::__construct($message);
    }
}
