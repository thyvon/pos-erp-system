<?php

return [
    'modules' => [
        'core' => [
            'name' => 'Core Platform',
            'description' => 'Authentication, tenancy, users, roles, branches, settings, files, and audit foundations.',
            'default_enabled' => true,
        ],
        'contacts' => [
            'name' => 'Contacts',
            'description' => 'Customers, suppliers, and customer groups.',
            'default_enabled' => true,
        ],
        'catalog' => [
            'name' => 'Catalog',
            'description' => 'Products, categories, brands, units, pricing, tax setup, and rack locations.',
            'default_enabled' => true,
        ],
        'inventory' => [
            'name' => 'Inventory',
            'description' => 'Warehouses, stock levels, lots, serials, transfers, adjustments, and counts.',
            'default_enabled' => true,
        ],
        'accounting' => [
            'name' => 'Accounting',
            'description' => 'Chart of accounts, journals, payment accounts, exchange rates, and fiscal years.',
            'default_enabled' => true,
        ],
        'sales' => [
            'name' => 'Sales',
            'description' => 'Sales, POS, quotations, payments, returns, invoices, and cash registers.',
            'default_enabled' => true,
        ],
        'purchases' => [
            'name' => 'Purchases',
            'description' => 'Purchase documents, receiving, payments, and purchase returns.',
            'default_enabled' => true,
        ],
        'expenses' => [
            'name' => 'Expenses',
            'description' => 'Expense capture and payment-account posting.',
            'default_enabled' => true,
        ],
        'hrm' => [
            'name' => 'Human Resources',
            'description' => 'Employees, departments, attendance, leave, payroll, and HR documents.',
            'default_enabled' => false,
        ],
        'reports' => [
            'name' => 'Reports',
            'description' => 'Operational, financial, inventory, sales, and HR reporting.',
            'default_enabled' => false,
        ],
    ],
];
