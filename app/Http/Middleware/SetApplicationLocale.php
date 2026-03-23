<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetApplicationLocale
{
    protected array $supportedLocales = ['en', 'km'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        App::setLocale($locale);

        return $next($request);
    }

    protected function resolveLocale(Request $request): string
    {
        $header = Arr::first($request->getLanguages()) ?? $request->header('Accept-Language');

        if (! is_string($header) || $header === '') {
            return config('app.locale', 'en');
        }

        $normalized = strtolower(substr($header, 0, 2));

        return in_array($normalized, $this->supportedLocales, true)
            ? $normalized
            : config('app.locale', 'en');
    }
}
