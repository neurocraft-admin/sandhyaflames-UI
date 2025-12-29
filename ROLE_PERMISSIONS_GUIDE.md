# Role Permissions Management - Implementation Guide

## Overview
This guide explains how to implement granular permission management for roles in your application. The system allows you to:
- View all resources and their permissions for each role
- Edit permissions (View, Create, Update, Delete) for any role
- Use a permission matrix UI with "Toggle All" functionality
- Bulk update permissions and save to database

---

## 🎯 What You Have Now

### Frontend Components
✅ **RolePermissionsComponent** created at:
- `src/app/views/role-permissions/role-permissions.component.ts`
- `src/app/views/role-permissions/role-permissions.component.html`
- `src/app/views/role-permissions/role-permissions.component.scss`

✅ **Route registered** in `app.routes.ts`:
```typescript
{ path: 'role-permissions', loadComponent: () => import('./views/role-permissions/role-permissions.component').then(m => m.RolePermissionsComponent) }
```

✅ **Menu item added** in `_nav.ts`:
```typescript
{
  name: 'Role Permissions',
  url: '/role-permissions',
  iconComponent: { name: 'cil-lock-locked' },
  resource: 'Roles',
  perm: 1,
  title: false
}
```

### Backend Files Created
✅ **RolePermissionRoutes.cs** - API endpoints for managing permissions
✅ **sp_GetRolePermissions.sql** - Stored procedure to fetch all permissions for a role
✅ **sp_UpdateRolePermissions** - Already exists in `sp_Menu_Permissions.sql`

---

## 📋 Step-by-Step Implementation

### Step 1: Execute Database Scripts

Run these SQL scripts in order:

#### 1.1 Execute sp_GetRolePermissions.sql
```sql
-- File: dbScrip/sp_GetRolePermissions.sql
-- This creates the stored procedure to fetch role permissions
```

Run the script from the `dbScrip` folder to create `sp_GetRolePermissions`.

#### 1.2 Verify sp_UpdateRolePermissions exists
The stored procedure `sp_UpdateRolePermissions` should already exist from `sp_Menu_Permissions.sql`. Verify by running:
```sql
SELECT OBJECT_ID('sp_UpdateRolePermissions')
-- Should return a number, not NULL
```

#### 1.3 Test the stored procedures
```sql
-- Test getting permissions for RoleId = 1 (Admin)
EXEC sp_GetRolePermissions @RoleId = 1;

-- Should return all resources with their permission flags
```

---

### Step 2: Add Backend API Endpoints

#### 2.1 Copy RolePermissionRoutes.cs to your backend project

The file `dbScrip/RolePermissionRoutes.cs` contains the API endpoints. Copy this file to your backend project (where your other Routes files are located, e.g., `AuthRoutes.cs`, `UserRoutes.cs`).

#### 2.2 Register the routes in Program.cs or Startup.cs

Find where you register other routes (e.g., `app.MapAuthRoutes()`, `app.MapUserManagementRoutes()`), and add:

```csharp
app.MapRolePermissionRoutes();
```

Example in Program.cs:
```csharp
// ... existing code ...

app.MapAuthRoutes();
app.MapUserManagementRoutes();
app.MapRoleManagementRoutes();
app.MapRolePermissionRoutes();  // ADD THIS LINE

// ... rest of code ...
```

---

### Step 3: Fix Role Creation Error

#### 3.1 Re-execute sp_UserRole_Compatibility.sql

The file has been updated to make the `@Description` parameter optional in `Role_Create`:

```sql
-- File: dbScrip/sp_UserRole_Compatibility.sql
-- Run this entire script to recreate all compatibility procedures
```

This will fix the error: **"Procedure or function 'sp_CreateRole' expects parameter '@Description'"**

---

### Step 4: Test the Permission Management System

#### 4.1 Start your backend server
Ensure your API is running and accessible at `http://localhost:5000` (or your configured port).

#### 4.2 Start your Angular app
```bash
npm start
# or
ng serve
```

#### 4.3 Navigate to Role Permissions page
1. Login to your application
2. Go to **Admin** → **Role Permissions** in the menu
3. Select a role from the dropdown

#### 4.4 Test the permission matrix
1. **Load permissions**: Select "Admin" or any other role
2. **View permission checkboxes**: All resources should show with their current permissions
3. **Toggle individual permissions**: Check/uncheck boxes for specific resources
4. **Toggle All**: Click "Toggle All" buttons to bulk enable/disable columns
5. **Save changes**: Click "Save Permissions" button
6. **Verify**: Reload the page and select the same role - changes should persist

---

## 🔧 API Endpoints Reference

### GET /api/roles/{roleId}/permissions
**Description**: Get all permissions for a specific role

**Response**:
```json
{
  "resources": [
    {
      "resourceId": 1,
      "resourceName": "Dashboard",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    ...
  ]
}
```

### PUT /api/roles/{roleId}/permissions
**Description**: Update permissions for a specific role

**Request Body**:
```json
{
  "permissions": [
    {
      "resourceId": 1,
      "resourceName": "Dashboard",
      "canView": true,
      "canCreate": false,
      "canUpdate": false,
      "canDelete": false
    },
    ...
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Permissions updated successfully"
}
```

---

## 🎨 UI Features

### Permission Matrix
The UI displays a table with:
- **Rows**: All 16 resources (Dashboard, Users, Products, etc.)
- **Columns**: 4 permission types (View, Create, Update, Delete)
- **Total**: 64 checkboxes for granular control

### Toggle All Buttons
Each column has a "Toggle All" button to:
- Enable all View permissions with one click
- Disable all Create permissions with one click
- Bulk enable/disable Update or Delete permissions

### Role Selection
Dropdown shows all available roles. When you select a role:
1. Loads permissions from backend
2. Populates checkboxes with current values
3. Enables Save button

---

## 🔐 How Permission System Works

### Database Structure

#### Resources Table
Stores all resources in your application:
```sql
ResourceId | ResourceName
1          | Dashboard
2          | Users
3          | Roles
4          | Products
...
```

#### Permissions Table
Stores CRUD permissions per role:
```sql
RoleId | ResourceId | CanView | CanCreate | CanUpdate | CanDelete
1      | 1          | 1       | 1         | 1         | 1
2      | 1          | 1       | 0         | 0         | 0
...
```

### Frontend Permission Checking
Use the `PermissionService` to check permissions:

```typescript
// In your components
constructor(private permissionService: PermissionService) {}

ngOnInit() {
  // Check if user can create daily deliveries
  if (this.permissionService.canCreate('DailyDelivery')) {
    this.showAddButton = true;
  }
  
  // Check if user can update users
  if (this.permissionService.canUpdate('Users')) {
    this.showEditButton = true;
  }
}
```

In templates:
```html
<!-- Show button only if user has permission -->
<button *ngIf="permissionService.canCreate('Users')" (click)="addUser()">
  Add User
</button>

<button *ngIf="permissionService.canUpdate('Users')" (click)="editUser(user)">
  Edit
</button>

<button *ngIf="permissionService.canDelete('Users')" (click)="deleteUser(user)">
  Delete
</button>
```

---

## 🚀 Example Workflow

### Creating a New Role with Custom Permissions

1. **Create the role**:
   - Go to **Admin** → **Roles**
   - Click "Add Role"
   - Enter role name: "Operator"
   - Click Save

2. **Assign permissions**:
   - Go to **Admin** → **Role Permissions**
   - Select "Operator" from dropdown
   - Grant permissions:
     * ✅ View - All resources
     * ✅ Create - Only DailyDelivery
     * ✅ Update - Only DailyDelivery
     * ❌ Delete - None
   - Click "Save Permissions"

3. **Create user with this role**:
   - Go to **Admin** → **Users**
   - Click "Add User"
   - Fill details and select "Operator" role
   - Click Save

4. **Test the permissions**:
   - Logout
   - Login as the new operator user
   - Verify:
     * Can see menu items (View permission)
     * Can add/edit deliveries (Create/Update permissions)
     * Cannot delete anything (no Delete permission)
     * Cannot manage users/roles (no Create/Update permission)

---

## ✅ Verification Checklist

Before marking this as complete, verify:

- [ ] Database scripts executed successfully
- [ ] `sp_GetRolePermissions` stored procedure exists
- [ ] `sp_UpdateRolePermissions` stored procedure exists
- [ ] `Role_Create` accepts optional `@Description` parameter
- [ ] Backend API endpoints registered in Program.cs
- [ ] Backend compiles without errors
- [ ] Angular app compiles without errors
- [ ] Menu shows "Role Permissions" under Admin section
- [ ] Navigation to `/role-permissions` works
- [ ] Role dropdown loads all roles
- [ ] Selecting a role loads its permissions
- [ ] Checkboxes show current permission state
- [ ] Toggle All buttons work correctly
- [ ] Save button updates database
- [ ] Changes persist after page reload
- [ ] Permission checking works in other components

---

## 🐛 Troubleshooting

### Issue: "Cannot find stored procedure 'sp_GetRolePermissions'"
**Solution**: Execute `dbScrip/sp_GetRolePermissions.sql`

### Issue: "Procedure expects parameter '@Description'"
**Solution**: Re-execute `dbScrip/sp_UserRole_Compatibility.sql`

### Issue: Backend returns 404 for /api/roles/{id}/permissions
**Solution**: Ensure `RolePermissionRoutes.cs` is in backend project and `app.MapRolePermissionRoutes()` is called in Program.cs

### Issue: Frontend shows "Failed to load permissions"
**Solution**: 
1. Check browser console for exact error
2. Verify backend API is running
3. Check CORS settings
4. Verify JWT token is valid

### Issue: Permissions don't save
**Solution**:
1. Check browser network tab for PUT request
2. Verify request body has correct format
3. Check backend logs for SQL errors
4. Verify `sp_UpdateRolePermissions` exists

---

## 📚 Related Files

- **Frontend**:
  - `src/app/views/role-permissions/role-permissions.component.ts`
  - `src/app/views/role-permissions/role-permissions.component.html`
  - `src/app/views/role-permissions/role-permissions.component.scss`
  - `src/app/app.routes.ts`
  - `src/app/layout/default-layout/_nav.ts`
  - `src/app/services/permission.service.ts`

- **Backend** (in your backend project):
  - `RolePermissionRoutes.cs` (copy from dbScrip folder)
  - `Program.cs` or `Startup.cs` (register routes)

- **Database**:
  - `dbScrip/sp_GetRolePermissions.sql`
  - `dbScrip/sp_Menu_Permissions.sql` (contains sp_UpdateRolePermissions)
  - `dbScrip/sp_UserRole_Compatibility.sql` (updated Role_Create)

---

## 🎓 Next Steps

After implementing this feature, you can:

1. **Add more permission types**: Extend the Permissions table to include `CanExport`, `CanApprove`, etc.
2. **Audit logging**: Track who changed permissions and when
3. **Permission templates**: Create predefined permission sets for common roles
4. **Hierarchical permissions**: Implement parent-child resource relationships
5. **Field-level permissions**: Control access to specific form fields
6. **Data-level permissions**: Filter data based on user's role/department

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review browser console errors
3. Check backend logs
4. Verify database schema matches expectations
5. Test stored procedures directly in SQL Server Management Studio

Good luck! 🚀
