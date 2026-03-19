<?php

namespace App\Exceptions\Domain;

class SerialAlreadySoldException extends DomainException
{
    public function __construct(string $message = 'This serial number is not available for sale.')
    {
        parent::__construct($message);
    }
}
