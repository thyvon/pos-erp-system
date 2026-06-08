# ERP Module Packaging Guide

## Product Strategy

The system is designed to support modular activation.

## Core Modules

### Foundation

Required by all packages.

Includes:

- Authentication
- Roles and Permissions
- Users
- Business Settings
- Branches
- Warehouses
- Tax Configuration
- Customer Groups
- Suppliers

### Catalog

Includes:

- Products
- Categories
- Brands
- Units
- Product Attributes

### Sales

Includes:

- POS
- Sales Orders
- Customers
- Sales History

### Inventory

Includes:

- Stock Movement
- Stock Adjustments
- Warehouses
- Transfers
- Inventory Reports

### Purchases

Includes:

- Purchase Orders
- Suppliers
- Receiving

### Expenses

Includes:

- Expense Categories
- Expense Tracking

### Accounting

Includes:

- Accounting Integration
- Financial Reports

### Reports

Includes:

- Operational Reports
- Business Analytics

## Commercial Packages

### POS Starter

Modules:

- Foundation
- Catalog
- Sales

### Inventory Pro

Modules:

- Foundation
- Catalog
- Inventory
- Reports

### Business ERP

Modules:

- Foundation
- Catalog
- Sales
- Inventory
- Purchases
- Expenses
- Reports

### Enterprise ERP

Modules:

- All modules

## Future Modules

### HR Module

Recommended standalone package.

Possible scope:

- Employees
- Attendance
- Leave Management
- Payroll
- Performance

### CRM Module

Possible scope:

- Leads
- Opportunities
- Activities
- Customer Communications

## Permission Strategy

Every module should own its permissions.

Example:

```text
products.index
products.create
products.edit
products.delete
```

This allows:

- Role-based access control
- Module activation/deactivation
- SaaS package segmentation
