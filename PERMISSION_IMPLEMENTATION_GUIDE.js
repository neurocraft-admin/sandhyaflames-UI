/**
 * ============================================================================
 * PERMISSION SYSTEM - APPLICATION GUIDE FOR ALL PAGES
 * ============================================================================
 * 
 * ✅ COMPLETED:
 * - Daily Delivery (DailyDelivery)
 * - Commercial Deliveries (CommercialDeliveries)
 * 
 * 📋 PENDING - Apply to these components:
 * ============================================================================
 */

// ────────────────────────────────────────────────────────────────────────────
// PATTERN TO APPLY (Same for all components)
// ────────────────────────────────────────────────────────────────────────────

/* STEP 1: Import AuthService in the .ts file */
import { AuthService } from '../../auth/auth.service';

/* STEP 2: Add permissions object */
permissions = {
  canView: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false
};

/* STEP 3: Inject AuthService in constructor */
constructor(
  // ... existing services
  private authService: AuthService
) {}

/* STEP 4: Add loadPermissions method */
loadPermissions(): void {
  this.authService.getUserPermissions('RESOURCE_KEY_HERE').subscribe(result => {
    const mask = result.permissionMask;
    this.permissions.canView = (mask & 1) === 1;
    this.permissions.canCreate = (mask & 2) === 2;
    this.permissions.canUpdate = (mask & 4) === 4;
    this.permissions.canDelete = (mask & 8) === 8;
  });
}

/* STEP 5: Call loadPermissions in ngOnInit */
ngOnInit(): void {
  this.loadPermissions();
  // ... existing code
}

/* STEP 6: Add *ngIf directives in HTML template */
// For Create/Add buttons:
<button *ngIf="permissions.canCreate" ...>Add</button>

// For Edit/Update buttons:
<button *ngIf="permissions.canUpdate" ...>Edit</button>

// For Delete buttons:
<button *ngIf="permissions.canDelete" ...>Delete</button>


// ────────────────────────────────────────────────────────────────────────────
// RESOURCE KEY MAPPING (What to use for each component)
// ────────────────────────────────────────────────────────────────────────────

/*
Component File                           ResourceKey            Buttons to Protect
────────────────────────────────────────────────────────────────────────────────
purchase-entry-list.component           'PurchaseEntry'        + Add Purchase (canCreate)
                                                               Edit (canUpdate)
                                                               Save (canCreate/canUpdate)
                                                               + Add Item (canCreate)

users.component                         'Users'                + Add User (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)
                                                               Toggle Active (canUpdate)

roles.component                         'Roles'                + Add Role (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)

product-list.component                  'Products'             + Add Product (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)

vehicle-list.component                  'Vehicles'             + Add Vehicle (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)

driver-list.component                   'Drivers'              + Add Driver (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)

customer-list.component                 'Customers'            + Add Customer (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)

stock-register.component                'StockRegister'        View only (canView)
                                                               Export (if button exists)

product-pricing.component               'ProductPricing'       + Add Pricing (canCreate)
                                                               Edit (canUpdate)
                                                               Save (canCreate/canUpdate)

vehicle-assignment-list.component       'VehicleAssignment'    + Add Assignment (canCreate)
                                                               Edit (canUpdate)
                                                               Delete (canDelete)

customer-credit.component               'CustomerCredit'       + Add Credit (canCreate)
                                                               Edit (canUpdate)
                                                               Payment (canUpdate)
*/


// ────────────────────────────────────────────────────────────────────────────
// QUICK REFERENCE - Button Permission Mapping
// ────────────────────────────────────────────────────────────────────────────

/*
Button Text/Action              Permission          *ngIf Directive
─────────────────────────────────────────────────────────────────────────────
+ Add [Entity]                  canCreate           *ngIf="permissions.canCreate"
+ Add Item                      canCreate           *ngIf="permissions.canCreate"
Save / Submit                   canCreate/Update    *ngIf="permissions.canCreate || permissions.canUpdate"
Edit / Pencil Icon              canUpdate           *ngIf="permissions.canUpdate"
Update                          canUpdate           *ngIf="permissions.canUpdate"
Delete / Trash Icon             canDelete           *ngIf="permissions.canDelete"
Toggle Active/Inactive          canUpdate           *ngIf="permissions.canUpdate"
Map Customers                   canUpdate           *ngIf="permissions.canUpdate"
Assign                          canCreate           *ngIf="permissions.canCreate"
Payment                         canUpdate           *ngIf="permissions.canUpdate"
*/


// ────────────────────────────────────────────────────────────────────────────
// TESTING CHECKLIST (After applying to each component)
// ────────────────────────────────────────────────────────────────────────────

/*
1. Login as roletester@sandhyaflames.in (Biller role)
2. Navigate to the page
3. Verify buttons appear/hide based on permissions:
   - PurchaseEntry: PermissionMask = 15 (all buttons visible)
   - CommercialDeliveries: PermissionMask = 15 (all buttons visible)
   - DailyDelivery: PermissionMask = 15 (all buttons visible)
   - Dashboard: PermissionMask = 15 (all visible)
   - All others: PermissionMask = 0 (NO buttons should show)

4. Test with Admin role (should have all permissions for all pages)
5. Test with custom role with specific permissions
*/


// ────────────────────────────────────────────────────────────────────────────
// PRIORITY ORDER (Apply permissions in this order)
// ────────────────────────────────────────────────────────────────────────────

/*
HIGH PRIORITY (Most used features):
1. ✅ Daily Delivery (DONE)
2. ✅ Commercial Deliveries (DONE)  
3. 🔄 Purchase Entry
4. 🔄 Products
5. 🔄 Customers

MEDIUM PRIORITY:
6. 🔄 Users
7. 🔄 Roles
8. 🔄 Vehicles
9. 🔄 Drivers

LOW PRIORITY:
10. 🔄 Stock Register
11. 🔄 Product Pricing
12. 🔄 Vehicle Assignment
13. 🔄 Customer Credit
*/


// ────────────────────────────────────────────────────────────────────────────
// EXAMPLE: Purchase Entry Implementation
// ────────────────────────────────────────────────────────────────────────────

/* purchase-entry-list.component.ts */
import { AuthService } from '../../auth/auth.service';

export class PurchaseEntryListComponent {
  // Add permissions object
  permissions = {
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false
  };

  constructor(
    // ... existing
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPermissions();
    this.loadAll();
  }

  loadPermissions(): void {
    this.authService.getUserPermissions('PurchaseEntry').subscribe(result => {
      const mask = result.permissionMask;
      this.permissions.canView = (mask & 1) === 1;
      this.permissions.canCreate = (mask & 2) === 2;
      this.permissions.canUpdate = (mask & 4) === 4;
      this.permissions.canDelete = (mask & 8) === 8;
    });
  }
}

/* purchase-entry-list.component.html */
// Protect "+ Add Purchase" button
<button *ngIf="permissions.canCreate" cButton color="primary" (click)="startCreate()">
  + Add Purchase
</button>

// Protect "Edit" button in table
<button *ngIf="permissions.canUpdate" cButton size="sm" (click)="startEdit(r)">
  Edit
</button>

// Protect "Save" button in form
<button *ngIf="permissions.canCreate || permissions.canUpdate" 
        cButton color="primary" type="submit">
  Save
</button>

// Protect "+ Add Item" button
<button *ngIf="permissions.canCreate" 
        cButton color="secondary" type="button" (click)="addItemRow()">
  + Add Item
</button>


// ────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────────────────────

/*
✅ WHAT'S WORKING:
- Database has correct permissions structure
- API returns permissions correctly
- localStorage populates on login
- Daily Delivery buttons show/hide correctly
- Commercial Deliveries buttons show/hide correctly

📋 NEXT STEPS:
1. Apply same pattern to Purchase Entry component
2. Test with Biller role (should see all buttons)
3. Apply to remaining components one by one
4. Test each component after implementation

🎯 GOAL:
- All pages respect permission system
- Admin sees all buttons
- Biller sees only PurchaseEntry, DailyDelivery, CommercialDeliveries buttons
- Other roles see only what they're granted

⏱️ ESTIMATED TIME:
- ~5 minutes per component (3 files: .ts, .html)
- 12 components remaining = ~60 minutes total
*/
