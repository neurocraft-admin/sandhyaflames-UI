import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Permission structure for a resource
 */
export interface ResourcePermission {
  resource: string;         // e.g., 'Products', 'Users', 'DailyDelivery'
  canView: boolean;         // Can see the page/list
  canCreate: boolean;       // Can add new records
  canUpdate: boolean;       // Can edit existing records
  canDelete: boolean;       // Can delete/soft-delete records
  canExport?: boolean;      // Can export data
  canApprove?: boolean;     // Can approve transactions (future use)
}

/**
 * User permissions response from API
 */
export interface UserPermissions {
  userId: number;
  username: string;
  roleId: number;
  roleName: string;
  permissions: ResourcePermission[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsCache$ = new BehaviorSubject<Map<string, ResourcePermission>>(new Map());
  private isPermissionsLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Load permissions from API for current user
   * This should be called once during app initialization (after login)
   */
  loadUserPermissions(): Observable<UserPermissions> {
    const url = `${environment.apiUrl}/permissions/current-user`;
    
    return this.http.get<UserPermissions>(url).pipe(
      tap(userPerms => {
        const permMap = new Map<string, ResourcePermission>();
        userPerms.permissions.forEach(perm => {
          permMap.set(perm.resource, perm);
        });
        this.permissionsCache$.next(permMap);
        this.isPermissionsLoaded = true;
        console.log('✅ Permissions loaded:', userPerms);
      }),
      catchError(error => {
        console.error('❌ Failed to load permissions:', error);
        this.isPermissionsLoaded = true;
        return of({
          userId: 0,
          username: 'unknown',
          roleId: 0,
          roleName: 'Guest',
          permissions: []
        });
      })
    );
  }

  /**
   * Check if user can VIEW a resource
   */
  canView(resource: string): boolean {
    const perm = this.permissionsCache$.value.get(resource);
    return perm?.canView || false;
  }

  /**
   * Check if user can CREATE in a resource
   */
  canCreate(resource: string): boolean {
    const perm = this.permissionsCache$.value.get(resource);
    return perm?.canCreate || false;
  }

  /**
   * Check if user can UPDATE a resource
   */
  canUpdate(resource: string): boolean {
    const perm = this.permissionsCache$.value.get(resource);
    return perm?.canUpdate || false;
  }

  /**
   * Check if user can DELETE from a resource
   */
  canDelete(resource: string): boolean {
    const perm = this.permissionsCache$.value.get(resource);
    return perm?.canDelete || false;
  }

  /**
   * Check if user can EXPORT from a resource
   */
  canExport(resource: string): boolean {
    const perm = this.permissionsCache$.value.get(resource);
    return perm?.canExport || false;
  }

  /**
   * Get all permissions for a resource
   */
  getResourcePermission(resource: string): ResourcePermission | undefined {
    return this.permissionsCache$.value.get(resource);
  }

  /**
   * Check if user has ANY permission for a resource (at least view)
   */
  hasAccess(resource: string): boolean {
    return this.canView(resource);
  }

  /**
   * Check multiple permissions at once
   * Returns true only if ALL permissions are granted
   */
  hasAll(resource: string, actions: ('view' | 'create' | 'update' | 'delete')[]): boolean {
    return actions.every(action => {
      switch (action) {
        case 'view': return this.canView(resource);
        case 'create': return this.canCreate(resource);
        case 'update': return this.canUpdate(resource);
        case 'delete': return this.canDelete(resource);
        default: return false;
      }
    });
  }

  /**
   * Check if user has ANY of the specified permissions
   * Returns true if AT LEAST ONE permission is granted
   */
  hasAny(resource: string, actions: ('view' | 'create' | 'update' | 'delete')[]): boolean {
    return actions.some(action => {
      switch (action) {
        case 'view': return this.canView(resource);
        case 'create': return this.canCreate(resource);
        case 'update': return this.canUpdate(resource);
        case 'delete': return this.canDelete(resource);
        default: return false;
      }
    });
  }

  /**
   * Clear permissions cache (e.g., on logout)
   */
  clearPermissions(): void {
    this.permissionsCache$.next(new Map());
    this.isPermissionsLoaded = false;
  }

  /**
   * Get permissions as observable (for reactive updates)
   */
  getPermissions(): Observable<Map<string, ResourcePermission>> {
    if (!this.isPermissionsLoaded) {
      this.loadUserPermissions().subscribe();
    }
    return this.permissionsCache$.asObservable();
  }
}
