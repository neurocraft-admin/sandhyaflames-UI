import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PermissionEntry {
  resourceKey: string;
  permissionMask: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBase = environment.apiUrl;
  private permissions: PermissionEntry[] = [];

  constructor(private http: HttpClient) {}

  // ✅ login API
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/login`, { email, password });
  }

  // ✅ permissions API
  fetchPermissions(userId: number): Observable<PermissionEntry[]> {
    return this.http.get<PermissionEntry[]>(`${this.apiBase}/permissions/user/${userId}`);
  }

  // ✅ token helpers
  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ✅ permissions cache
  savePermissions(perms: PermissionEntry[]) {
    this.permissions = perms;
    localStorage.setItem('permissions', JSON.stringify(perms));
  }

  loadPermissions() {
    const raw = localStorage.getItem('permissions');
    this.permissions = raw ? JSON.parse(raw) : [];
  }

  getPermissionFor(resourceKey: string): number {
    if (!this.permissions.length) this.loadPermissions();
    return this.permissions.find(p => p.resourceKey === resourceKey)?.permissionMask ?? 0;
  }

  // ✅ Get user permissions for a specific resource (returns Observable)
  getUserPermissions(resourceKey: string): Observable<{ permissionMask: number }> {
    // Always reload from localStorage to get fresh data
    this.loadPermissions();
    const mask = this.permissions.find(p => p.resourceKey === resourceKey)?.permissionMask ?? 0;
    
    console.log('getUserPermissions:', resourceKey, 'mask:', mask, 'allPerms:', this.permissions);
    
    return new Observable(observer => {
      observer.next({ permissionMask: mask });
      observer.complete();
    });
  }
}
