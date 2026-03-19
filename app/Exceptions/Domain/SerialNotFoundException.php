<?php

namespace App\Exceptions\Domain;

class SerialNotFoundException extends DomainException
{
    public function __construct(string $message = 'Serial number not found in this warehouse.')
    {
        parent::__construct($message);
    }
}
