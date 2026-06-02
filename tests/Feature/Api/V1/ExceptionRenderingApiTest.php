<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ExceptionRenderingApiTest extends TestCase
{
    public function test_unexpected_exception_message_is_hidden_by_default(): void
    {
        config(['app.expose_exception_messages' => false]);

        Route::get('/api/v1/test-hidden-exception-message', function () {
            throw new RuntimeException('Production exception details');
        });

        $this->getJson('/api/v1/test-hidden-exception-message')
            ->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'An unexpected error occurred.');
    }

    public function test_unexpected_exception_message_can_be_exposed_for_api_responses(): void
    {
        config(['app.expose_exception_messages' => true]);

        Route::get('/api/v1/test-exposed-exception-message', function () {
            throw new RuntimeException('Production exception details');
        });

        $this->getJson('/api/v1/test-exposed-exception-message')
            ->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Production exception details');
    }

    public function test_unexpected_exception_message_is_hidden_in_production_even_if_env_flag_is_enabled(): void
    {
        config([
            'app.env' => 'production',
            'app.expose_exception_messages' => false,
        ]);

        Route::get('/api/v1/test-production-exception-message', function () {
            throw new RuntimeException('Sensitive production exception details');
        });

        $this->getJson('/api/v1/test-production-exception-message')
            ->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'An unexpected error occurred.');
    }
}
