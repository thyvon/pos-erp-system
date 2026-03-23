<?php

namespace App\Exceptions\Domain;

class MaxDiscountExceededException extends DomainException
{
    public function __construct(string $message = 'The discount exceeds the user maximum.')
    {
        parent::__construct($message, 422);
    }
}
