<?php

namespace App\Exceptions\Domain;

use Exception;

class DomainException extends Exception
{
    protected int $status = 400;

    public function __construct(string $message = 'Business rule violation.', int $status = 400)
    {
        parent::__construct($message, $status);

        $this->status = $status;
    }

    public function getStatus(): int
    {
        return $this->status;
    }
}
