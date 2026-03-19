<?php

namespace App\Exceptions\Domain;

class DuplicateSerialException extends DomainException
{
    public function __construct(string $message = 'This serial number already exists in this business.')
    {
        parent::__construct($message);
    }
}
