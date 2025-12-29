import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { INavData } from '@coreui/angular';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuCache$ = new BehaviorSubject<INavData[]>([]);
  private isMenuLoaded = false;

  // Default fallback menu if API fails
  private defaultMenu: INavData[] = [
    {
      name: 'Dashboard',
      url: '/dashboard',
      iconComponent: { name: 'cil-speedometer' }
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Load menu from API based on current user's role
   * This should be called once during app initialization (after login)
   */
  loadUserMenu(): Observable<INavData[]> {
    const url = `${environment.apiUrl}/menu/current-user`;
    
    return this.http.get<INavData[]>(url).pipe(
      tap(menu => {
        this.menuCache$.next(menu);
        this.isMenuLoaded = true;
        console.log('✅ Menu loaded from API:', menu);
      }),
      catchError(error => {
        console.error('❌ Failed to load menu, using default:', error);
        this.menuCache$.next(this.defaultMenu);
        this.isMenuLoaded = true;
        return of(this.defaultMenu);
      })
    );
  }

  /**
   * Get menu items as observable
   * Subscribe to this in components to get real-time menu updates
   */
  getMenu(): Observable<INavData[]> {
    // If menu not loaded yet, trigger load
    if (!this.isMenuLoaded) {
      this.loadUserMenu().subscribe();
    }
    return this.menuCache$.asObservable();
  }

  /**
   * Get current menu snapshot (synchronous)
   */
  getCurrentMenu(): INavData[] {
    return this.menuCache$.value;
  }

  /**
   * Clear menu cache (e.g., on logout)
   */
  clearMenu(): void {
    this.menuCache$.next([]);
    this.isMenuLoaded = false;
  }

  /**
   * Manually set menu (useful for testing or offline mode)
   */
  setMenu(menu: INavData[]): void {
    this.menuCache$.next(menu);
    this.isMenuLoaded = true;
  }
}
