<?php

namespace App\Exceptions\Domain;

class InvalidStateTransitionException extends DomainException
{
    public function __construct(string $message = 'Invalid state transition.')
    {
        parent::__construct($message);
    }
}
