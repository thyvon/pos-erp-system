<?php

namespace App\Support\Sales;

class InvoiceTemplateRegistry
{
    protected static array $templates = [
        'classic' => [
            'name' => 'Classic',
            'description' => 'Traditional invoice layout with blue header and bordered box',
            'view' => 'invoices.classic',
        ],
        'modern' => [
            'name' => 'Modern',
            'description' => 'Clean modern layout with dark top bar and card design',
            'view' => 'invoices.modern',
        ],
        'receipt' => [
            'name' => 'POS Receipt',
            'description' => 'Compact 80mm layout optimized for thermal receipt printers',
            'view' => 'invoices.receipt',
        ],
    ];

    public static function all(): array
    {
        return static::$templates;
    }

    public static function names(): array
    {
        $result = [];
        foreach (static::$templates as $key => $template) {
            $result[$key] = $template['name'];
        }
        return $result;
    }

    public static function exists(string $template): bool
    {
        return isset(static::$templates[$template]);
    }

    public static function view(string $template): string
    {
        return static::$templates[$template]['view'] ?? 'invoices.classic';
    }

    public static function default(): string
    {
        return 'classic';
    }
}
