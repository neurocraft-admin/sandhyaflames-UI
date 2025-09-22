import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
  roleId: number;
  roleName: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'https://localhost:7183/api/roles';

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/list`);
  }

  createRole(role: Partial<Role>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, role);
  }

  updateRole(role: Partial<Role>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, role);
  }

  deleteRole(roleId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${roleId}`);
  }
}
