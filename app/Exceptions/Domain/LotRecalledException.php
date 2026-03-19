<?php

namespace App\Exceptions\Domain;

class LotRecalledException extends DomainException
{
    public function __construct(string $message = 'Recalled lots cannot be sold.')
    {
        parent::__construct($message);
    }
}
