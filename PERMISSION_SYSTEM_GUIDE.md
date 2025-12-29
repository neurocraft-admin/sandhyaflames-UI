# Permission System - Complete Guide

## Overview
Your application has a role-based permission system that controls:
1. **Menu Visibility**: Which menu items users can see
2. **Page Access**: Which pages users can navigate to
3. **Button/Action Permissions**: Which actions users can perform (View, Create, Update, Delete)

---

## Current Architecture

### Database Tables
1. **Roles**: Stores role definitions (Admin, Manager, Viewer, etc.)
2. **Users**: Each user has a RoleId
3. **Resources**: All app features (DailyDelivery, Users, Products, etc.)
4. **MenuItems**: Hierarchical menu structure (parent-child)
5. **RolePermissions**: Links roles to resources with PermissionMask (bitmask)
6. **MenuAccess**: Links roles to menu items (controls visibility)

### Permission Bitmask Values
```
View    = 1   (0001)
Create  = 2   (0010)
Update  = 4   (0100)
Delete  = 8   (1000)
Export  = 16  (10000)
Approve = 32  (100000)
```

Example: PermissionMask = 7 means View (1) + Create (2) + Update (4)

---

## Workflows

### 1. Creating a New Role and User (CURRENT STATE)

#### ✅ **Automatic Steps:**
1. Create Role via UI → Saved to Roles table automatically
2. Create User via UI → Assign role → Saved to Users table automatically
3. User login → Gets menu items from sp_GetMenuByRole based on MenuAccess table

#### ❌ **Currently Broken:**
- **Role Permissions UI Save**: Doesn't work because:
  - UI calls `PUT /api/roles/{roleId}/permissions`
  - Backend calls `sp_UpdateRolePermissions`
  - **Problem**: `sp_UpdateRolePermissions` saves to old **Permissions** table
  - **Should**: Save to new **RolePermissions** table with PermissionMask

#### 🔧 **Current Workaround (Manual):**
```sql
-- Grant DailyDelivery view permission (PermissionMask = 1)
INSERT INTO RolePermissions (RoleId, ResourceId, ResourceKey, PermissionMask)
SELECT 6, r.ResourceId, r.ResourceName, 1
FROM Resources r
WHERE r.ResourceName = 'DailyDelivery';

-- Grant menu access
INSERT INTO MenuAccess (RoleId, MenuId)
VALUES 
  (6, 1),  -- Dashboard
  (6, 5),  -- Delivery (parent)
  (6, 6);  -- Daily Delivery (child)
```

---

### 2. Adding a New Menu/Submenu (FUTURE)

#### Step 1: Add Menu Item to Database
```sql
-- Example: Add "Expense Reports" under "Income/Expense"
INSERT INTO MenuItems (Name, DisplayName, Url, Icon, ParentMenuId, ResourceId, SortOrder)
VALUES (
  'ExpenseReports',                    -- Name (unique identifier)
  'Expense Reports',                   -- DisplayName (shown in UI)
  '/expense-reports',                  -- URL route
  'cil-chart-line',                    -- CoreUI icon
  12,                                  -- ParentMenuId (12 = Income/Expense)
  NULL,                                -- ResourceId (link after creating resource)
  3                                    -- SortOrder
);
```

#### Step 2: Add Resource (if new feature)
```sql
INSERT INTO Resources (ResourceName, DisplayName, Description)
VALUES (
  'ExpenseReports',                    -- ResourceName (matches menu Name)
  'Income/Expense > Expense Reports',  -- DisplayName (with hierarchy)
  'View and manage expense reports'    -- Description
);

-- Update MenuItems to link ResourceId
UPDATE MenuItems 
SET ResourceId = (SELECT ResourceId FROM Resources WHERE ResourceName = 'ExpenseReports')
WHERE Name = 'ExpenseReports';
```

#### Step 3: Grant Access to Roles
```sql
-- Grant to Admin role (RoleId = 1)
-- PermissionMask = 15 (View + Create + Update + Delete = 1+2+4+8)
INSERT INTO RolePermissions (RoleId, ResourceId, ResourceKey, PermissionMask)
SELECT 1, r.ResourceId, r.ResourceName, 15
FROM Resources r
WHERE r.ResourceName = 'ExpenseReports';

-- Grant menu access (both parent and child)
INSERT INTO MenuAccess (RoleId, MenuId)
VALUES 
  (1, 12),  -- Income/Expense (parent, if not already granted)
  (1, <NewMenuId>);  -- ExpenseReports (use actual ID from Step 1)
```

#### Step 4: Add Frontend Route
In `app.routes.ts`:
```typescript
{
  path: 'expense-reports',
  loadComponent: () => import('./views/expense-reports/expense-reports.component')
    .then(m => m.ExpenseReportsComponent),
  canActivate: [AuthGuard]
}
```

#### Step 5: Update Navigation (if needed)
The menu is dynamically loaded from database via `sp_GetMenuByRole`, so no code changes needed!

---

### 3. Button Permissions (How They Work)

#### Current Implementation Status:
- ✅ **Menu visibility**: Controlled by MenuAccess table
- ✅ **Page access**: Controlled by AuthGuard
- ⚠️ **Button visibility**: PARTIALLY IMPLEMENTED

#### How Button Permissions Should Work:

**Example: Daily Delivery Page**

```typescript
// In daily-delivery.component.ts
export class DailyDeliveryComponent implements OnInit {
  permissions = {
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false
  };

  ngOnInit() {
    // Get permissions from AuthService
    this.authService.getUserPermissions('DailyDelivery').subscribe(perms => {
      this.permissions.canView = (perms.permissionMask & 1) === 1;
      this.permissions.canCreate = (perms.permissionMask & 2) === 2;
      this.permissions.canUpdate = (perms.permissionMask & 4) === 4;
      this.permissions.canDelete = (perms.permissionMask & 8) === 8;
    });
  }
}
```

**In Template (daily-delivery.component.html):**
```html
<!-- Create button: Only show if canCreate -->
<button *ngIf="permissions.canCreate" class="btn btn-primary" (click)="openCreateForm()">
  Create Delivery
</button>

<!-- Update button: Only show if canUpdate -->
<button *ngIf="permissions.canUpdate" class="btn btn-warning" (click)="openUpdateForm(delivery)">
  Update
</button>

<!-- Close Delivery button: Only show if canUpdate (closing is an update action) -->
<button *ngIf="permissions.canUpdate" class="btn btn-success" (click)="closeDelivery(delivery)">
  Close Delivery
</button>

<!-- Delete button: Only show if canDelete -->
<button *ngIf="permissions.canDelete" class="btn btn-danger" (click)="deleteDelivery(delivery)">
  Delete
</button>

<!-- Recompute button: Only show if canUpdate (recalculating metrics is an update) -->
<button *ngIf="permissions.canUpdate" class="btn btn-info" (click)="recomputeMetrics(delivery)">
  Recompute
</button>
```

#### Permission Logic for Different Actions:
- **View**: Can see the page and list items
- **Create**: Can add new deliveries
- **Update**: Can edit existing deliveries, close deliveries, recompute metrics
- **Delete**: Can delete deliveries
- **Export**: Can export data to Excel/PDF

---

## What Needs to Be Fixed

### Priority 1: Fix Role Permissions UI Save
The `sp_UpdateRolePermissions` stored procedure needs to be updated to use RolePermissions table with PermissionMask.

**Current (Wrong):**
```sql
-- Saves to Permissions table with individual columns
MERGE INTO Permissions AS target
...
```

**Should Be (Correct):**
```sql
-- Save to RolePermissions table with PermissionMask
DECLARE @PermissionMask INT = 0;
IF @CanView = 1 SET @PermissionMask = @PermissionMask | 1;
IF @CanCreate = 1 SET @PermissionMask = @PermissionMask | 2;
IF @CanUpdate = 1 SET @PermissionMask = @PermissionMask | 4;
IF @CanDelete = 1 SET @PermissionMask = @PermissionMask | 8;

MERGE INTO RolePermissions AS target
USING (SELECT @RoleId AS RoleId, @ResourceId AS ResourceId) AS source
ON target.RoleId = source.RoleId AND target.ResourceId = source.ResourceId
WHEN MATCHED THEN
    UPDATE SET 
        PermissionMask = @PermissionMask,
        ResourceKey = (SELECT ResourceName FROM Resources WHERE ResourceId = @ResourceId),
        UpdatedAt = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (RoleId, ResourceId, ResourceKey, PermissionMask)
    VALUES (@RoleId, @ResourceId, 
            (SELECT ResourceName FROM Resources WHERE ResourceId = @ResourceId), 
            @PermissionMask);
```

### Priority 2: Auto-Create MenuAccess Entries
When permissions are granted via UI, automatically create MenuAccess entries:

```sql
-- After updating RolePermissions, auto-create MenuAccess
-- Get MenuId from Resources → MenuItems link
INSERT INTO MenuAccess (RoleId, MenuId)
SELECT DISTINCT @RoleId, mi.MenuId
FROM Resources r
JOIN MenuItems mi ON r.ResourceId = mi.ResourceId
WHERE r.ResourceId = @ResourceId
  AND NOT EXISTS (
      SELECT 1 FROM MenuAccess 
      WHERE RoleId = @RoleId AND MenuId = mi.MenuId
  );

-- Also grant parent menu access
INSERT INTO MenuAccess (RoleId, MenuId)
SELECT DISTINCT @RoleId, parent.MenuId
FROM Resources r
JOIN MenuItems mi ON r.ResourceId = mi.ResourceId
JOIN MenuItems parent ON mi.ParentMenuId = parent.MenuId
WHERE r.ResourceId = @ResourceId
  AND NOT EXISTS (
      SELECT 1 FROM MenuAccess 
      WHERE RoleId = @RoleId AND MenuId = parent.MenuId
  );
```

### Priority 3: Implement Button Permission Checks
Add permission checks to all components with action buttons (Create, Update, Delete, etc.)

---

## Summary

### ✅ One-Time Fixes (Already Done):
- ResourceKey mismatch correction
- DisplayName hierarchy enhancement

### 🔧 Currently Manual (Should Be Automatic):
- Granting permissions via Role Permissions UI (broken - needs fix)
- Creating MenuAccess entries (should auto-create when permissions granted)

### 📝 For Future Menu/Resource Additions:
1. Add MenuItems entry (SQL)
2. Add Resources entry (SQL)
3. Link ResourceId in MenuItems (SQL)
4. Grant permissions via Role Permissions UI (once fixed)
5. MenuAccess auto-created (once Priority 2 fix implemented)
6. Add frontend route (TypeScript)
7. Add permission checks in component (TypeScript)

### 🎯 Permission Scope:
- **Menus**: Controlled by MenuAccess → sp_GetMenuByRole
- **Pages**: Controlled by AuthGuard + RolePermissions
- **Buttons**: Should be controlled by PermissionMask checks in components (needs implementation)

---

## Next Steps
1. Fix `sp_UpdateRolePermissions` to use RolePermissions + PermissionMask
2. Add auto-creation of MenuAccess entries
3. Implement permission checks in all component templates
4. Test with RoleTester user to verify full workflow
