<?php

namespace App\Exceptions\Domain;

class LotExpiredException extends DomainException
{
    public function __construct(string $message = 'Expired lots cannot be sold.')
    {
        parent::__construct($message);
    }
}
