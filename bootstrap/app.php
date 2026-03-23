<?php

use App\Exceptions\Domain\DomainException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(fn (Request $request) => null);
        $middleware->alias([
            'super_admin' => \App\Http\Middleware\EnsureSuperAdmin::class,
        ]);
        $middleware->appendToGroup('api', \App\Http\Middleware\SetApplicationLocale::class);
        $middleware->appendToGroup('api', \App\Http\Middleware\TenantResolver::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontFlash([
            'current_password',
            'password',
            'password_confirmation',
        ]);

        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $throwable): bool {
            return true;
        });

        $exceptions->render(function (ValidationException $exception, Request $request) {
            return response()->json([
                'success' => false,
                'message' => __('Validation failed.'),
                'errors' => $exception->errors(),
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            return response()->json([
                'success' => false,
                'message' => __('Unauthenticated.'),
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) {
            return response()->json([
                'success' => false,
                'message' => __('You do not have permission.'),
            ], 403);
        });

        $exceptions->render(function (DomainException $exception, Request $request) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], $exception->getStatus());
        });

        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $exception, Request $request) {
            return response()->json([
                'success' => false,
                'message' => __('Record not found.'),
            ], 404);
        });

        $exceptions->render(function (Throwable $exception, Request $request) {
            $status = $exception instanceof HttpExceptionInterface
                ? $exception->getStatusCode()
                : 500;

            $message = match ($status) {
                401 => __('Unauthenticated.'),
                403 => __('You do not have permission.'),
                404 => __('Record not found.'),
                default => $status >= 500 ? __('An unexpected error occurred.') : ($exception->getMessage() ?: __('Request failed.')),
            };

            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status);
        });
    })->create();
