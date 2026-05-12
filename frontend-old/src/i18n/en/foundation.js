export default {
  "foundation": {
    "branchesPage": {
      "title": "Branches",
      "subtitle": "Manage selling locations, branch defaults, and manager assignments.",
      "breadcrumb": "Branches",
      "tableTitle": "Branches",
      "newBranch": "New branch",
      "noCode": "Auto code",
      "unassigned": "Unassigned",
      "defaultBadge": "Default",
      "createTitle": "Create branch",
      "editTitle": "Edit branch",
      "saveButton": "Save branch",
      "fields": {
        "name": "Branch name",
        "code": "Code",
        "type": "Type",
        "manager": "Manager",
        "email": "Email",
        "phone": "Phone",
        "addressLine1": "Address line 1",
        "city": "City"
      },
      "placeholders": {
        "selectType": "Select type",
        "noManager": "No manager",
        "searchManagers": "Search managers",
        "noManagersFound": "No managers found."
      },
      "toggles": {
        "defaultBranch": "Set as default branch",
        "activeBranch": "Branch is active"
      },
      "types": {
        "retail": "Retail",
        "warehouse": "Warehouse",
        "office": "Office",
        "online": "Online"
      },
      "columns": {
        "branch": "Branch",
        "type": "Type",
        "manager": "Manager",
        "status": "Status",
        "actions": "Actions"
      },
      "toast": {
        "created": "Branch created successfully.",
        "updated": "Branch updated successfully.",
        "deleted": "Branch deleted successfully.",
        "saveFailed": "Unable to save the branch.",
        "deleteFailed": "Unable to delete the branch."
      }
    },
    "warehousesPage": {
      "title": "Warehouses",
      "subtitle": "Manage stock locations, warehouse defaults, and branch assignment.",
      "breadcrumb": "Warehouses",
      "tableTitle": "Warehouses",
      "newWarehouse": "New warehouse",
      "noCode": "Auto code",
      "noBranch": "No branch",
      "defaultBadge": "Default",
      "createTitle": "Create warehouse",
      "editTitle": "Edit warehouse",
      "saveButton": "Save warehouse",
      "fields": {
        "name": "Warehouse name",
        "code": "Code",
        "branch": "Branch",
        "type": "Type"
      },
      "placeholders": {
        "noBranch": "No branch",
        "searchBranches": "Search branches",
        "noBranchesFound": "No branches found.",
        "selectType": "Select type"
      },
      "toggles": {
        "defaultWarehouse": "Default warehouse",
        "activeWarehouse": "Warehouse is active",
        "allowNegativeStock": "Allow negative stock"
      },
      "types": {
        "main": "Main",
        "transit": "Transit",
        "returns": "Returns",
        "damaged": "Damaged"
      },
      "columns": {
        "warehouse": "Warehouse",
        "type": "Type",
        "branch": "Branch",
        "status": "Status",
        "actions": "Actions"
      },
      "toast": {
        "created": "Warehouse created successfully.",
        "updated": "Warehouse updated successfully.",
        "deleted": "Warehouse deleted successfully.",
        "saveFailed": "Unable to save the warehouse.",
        "deleteFailed": "Unable to delete the warehouse."
      }
    },
    "rolesPage": {
      "title": "Roles",
      "subtitle": "Manage role definitions and the permissions each role grants.",
      "breadcrumb": "Roles",
      "tableTitle": "Roles",
      "newRole": "New role",
      "protectedBadge": "Protected",
      "createTitle": "Create role",
      "editTitle": "Edit role",
      "saveChanges": "Save changes",
      "fields": {
        "name": "Role name"
      },
      "hints": {
        "protectedRole": "Protected system roles can keep their name, but their permissions can still be adjusted here.",
        "permissionMatrix": "Permission matrix"
      },
      "columns": {
        "role": "Role",
        "permissions": "Permissions",
        "assignedUsers": "Assigned Users",
        "actions": "Actions"
      },
      "toast": {
        "created": "Role created successfully.",
        "updated": "Role updated successfully.",
        "deleted": "Role deleted successfully.",
        "saveFailed": "Unable to save the role.",
        "deleteFailed": "Unable to delete the role."
      }
    },
    "settingsPage": {
      "title": "Settings",
      "subtitle": "Manage the current business profile and tenant defaults from one place.",
      "breadcrumb": "Settings",
      "groupsLabel": "Groups",
      "access": {
        "editable": "Editable",
        "readOnly": "Read only"
      },
      "buttons": {
        "saveBusinessProfile": "Save business profile",
        "saveGeneralDefaults": "Save general defaults",
        "saveGroup": "Save {group}"
      },
      "groups": {
        "business": {
          "label": "Business",
          "heading": "Business profile and general defaults",
          "description": "Keep company information and general tenant defaults together without duplicate fields."
        },
        "invoice": {
          "label": "Invoice",
          "heading": "Invoice behavior",
          "description": "Document prefixes, numbering, branding, and footer content."
        },
        "pos": {
          "label": "POS",
          "heading": "POS defaults",
          "description": "Checkout defaults, printer mode, discount rules, and session behavior."
        },
        "stock": {
          "label": "Stock",
          "heading": "Inventory defaults",
          "description": "Lot, serial, and rack-related behavior used by stock workflows."
        },
        "sales": {
          "label": "Sales",
          "heading": "Sales workflow defaults",
          "description": "Edit lifetime and sales-specific controls for operational documents."
        }
      },
      "business": {
        "fields": {
          "businessName": "Business name",
          "legalName": "Legal name",
          "email": "Email",
          "phone": "Phone",
          "taxId": "Tax ID",
          "currency": "Currency",
          "country": "Country",
          "locale": "Locale",
          "timezone": "Timezone",
          "logoUrl": "Logo URL",
          "addressLine1": "Address line 1",
          "addressLine2": "Address line 2",
          "city": "City",
          "state": "State",
          "postalCode": "Postal code",
          "financialYearStartMonth": "Financial year start month"
        },
        "placeholders": {
          "selectLocale": "Select locale",
          "selectTimezone": "Select timezone"
        },
        "emptyState": "Business profile data is not available yet."
      },
      "general": {
        "eyebrow": "General defaults",
        "heading": "Regional and numeric defaults",
        "description": "General settings are now kept on the same page as the business profile. Shared fields are shown only once above.",
        "fields": {
          "dateFormat": "Date format",
          "decimalPlaces": "Decimal places"
        },
        "help": {
          "dateFormat": "PHP-style date format string used for documents and lists.",
          "decimalPlaces": "How many decimal places numeric values should show."
        }
      },
      "stats": {
        "userCapacity": "User capacity",
        "remainingSeats": "Remaining seats: {count}",
        "branchCapacity": "Branch capacity",
        "remainingBranches": "Remaining branches: {count}",
        "workspaceContext": "Workspace context",
        "tier": "Tier",
        "warehouses": "Warehouses",
        "businessId": "Business ID"
      },
      "dynamicFields": {
        "invoicePrefix": {
          "label": "Invoice prefix",
          "help": "Prefix used for sales invoice numbering."
        },
        "quotationPrefix": {
          "label": "Quotation prefix",
          "help": "Prefix used for quotation numbering."
        },
        "startNumber": {
          "label": "Start number",
          "help": "Starting sequence number."
        },
        "showTax": {
          "label": "Show tax",
          "help": "Display tax rows on documents."
        },
        "showLogo": {
          "label": "Show logo",
          "help": "Display business logo on documents."
        },
        "footerNote": {
          "label": "Footer note",
          "help": "Footer text shown on invoice printouts."
        },
        "allowDiscount": {
          "label": "Allow discount",
          "help": "Allow discount controls in POS."
        },
        "maxDiscountPct": {
          "label": "Max discount %",
          "help": "Maximum allowed POS discount percentage."
        },
        "receiptPrinter": {
          "label": "Receipt printer",
          "help": "Receipt output mode."
        },
        "requireCashRegisterSession": {
          "label": "Require cash register session",
          "help": "Force an active register session before sales."
        },
        "showCustomerDisplay": {
          "label": "Show customer display",
          "help": "Enable secondary customer display UI."
        },
        "enableLotTracking": {
          "label": "Enable lot tracking",
          "help": "Enable batch/lot tracking in inventory."
        },
        "enableSerialTracking": {
          "label": "Enable serial tracking",
          "help": "Enable serial-number tracking in inventory."
        },
        "lotExpiryAlertDays": {
          "label": "Lot expiry alert days",
          "help": "Alert before expiry by this many days."
        },
        "defaultLotSelection": {
          "label": "Default lot selection",
          "help": "Default lot allocation strategy."
        },
        "enableRackLocation": {
          "label": "Enable rack location",
          "help": "Enable rack location support in stock UI."
        },
        "enableCommission": {
          "label": "Enable commission",
          "help": "Turn sales commission behavior on or off."
        },
        "minimumSellPriceEnabled": {
          "label": "Enforce minimum sell price",
          "help": "Block sale lines that go below the configured minimum selling price."
        },
        "deliveryTrackingEnabled": {
          "label": "Enable delivery tracking",
          "help": "Allow delivery status tracking on sales documents."
        },
        "saleEditLifetimeDays": {
          "label": "Sale edit lifetime (days)",
          "help": "How many days a sale stays editable before it becomes locked. Use 0 for no limit."
        }
      },
      "options": {
        "receiptPrinter": {
          "browser": "Browser",
          "network": "Network printer"
        },
        "lotSelection": {
          "fefo": "FEFO",
          "fifo": "FIFO"
        }
      },
      "toast": {
        "loadFailedTitle": "Unable to load",
        "loadFailedMessage": "Unable to load the {section} section.",
        "businessUpdatedTitle": "Business updated",
        "businessUpdatedMessage": "Business profile was saved successfully.",
        "businessUpdateFailedTitle": "Update failed",
        "businessUpdateFailedMessage": "Unable to save the business profile right now.",
        "generalSavedTitle": "General defaults saved",
        "generalSavedMessage": "General settings were updated successfully.",
        "generalSaveFailedTitle": "Save failed",
        "generalSaveFailedMessage": "Unable to save the general settings right now.",
        "settingsSavedTitle": "Settings saved",
        "settingsSavedMessage": "{section} settings were updated successfully.",
        "settingsSaveFailedTitle": "Save failed",
        "settingsSaveFailedMessage": "Unable to save settings."
      }
    }
  }
}
