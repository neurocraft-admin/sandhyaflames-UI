import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MenuService } from './menu.service';
import { PermissionService } from './permission.service';

/**
 * Service to initialize app data during startup
 * This loads menu and permissions after login
 */
@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  constructor(
    private menuService: MenuService,
    private permissionService: PermissionService
  ) {}

  /**
   * Initialize app by loading menu and permissions
   * This should be called after successful login
   */
  initializeApp(): Observable<any> {
    console.log('🚀 Initializing app: Loading menu and permissions...');
    
    return forkJoin({
      menu: this.menuService.loadUserMenu(),
      permissions: this.permissionService.loadUserPermissions()
    }).pipe(
      tap(result => {
        console.log('✅ App initialized successfully');
        console.log('   - Menu items loaded:', result.menu.length);
        console.log('   - Permissions loaded:', result.permissions.permissions.length);
      }),
      catchError(error => {
        console.error('❌ App initialization failed:', error);
        // Return empty result to allow app to continue with defaults
        return of({ menu: [], permissions: { userId: 0, username: '', roleId: 0, roleName: '', permissions: [] } });
      })
    );
  }

  /**
   * Clear all app data (on logout)
   */
  clearAppData(): void {
    console.log('🧹 Clearing app data...');
    this.menuService.clearMenu();
    this.permissionService.clearPermissions();
  }
}
