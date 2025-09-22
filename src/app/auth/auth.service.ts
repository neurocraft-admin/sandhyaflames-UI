import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PermissionEntry {
  resourceKey: string;
  permissionMask: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBase = 'https://localhost:7183/api';
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
}
