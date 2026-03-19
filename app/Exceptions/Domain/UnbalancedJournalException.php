<?php

namespace App\Exceptions\Domain;

class UnbalancedJournalException extends DomainException
{
    public function __construct(string $message = 'Journal entries must be balanced.')
    {
        parent::__construct($message);
    }
}
