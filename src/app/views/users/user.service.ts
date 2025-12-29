import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  roleId: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/list`);
  }

  createUser(user: any): Observable<any> {
    // Backend expects password field (plain text), it will hash it
    const dto = {
      fullName: user.fullName,
      email: user.email,
      password: user.password,  // Send plain password, backend will hash it
      roleId: user.roleId
    };
    // Backend expects: POST /api/users (no /create suffix)
    return this.http.post(this.apiUrl, dto);
  }

  updateUser(user: any): Observable<any> {
    // Map to backend DTO structure (ID goes in URL, not body)
    const dto: any = {
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive
    };
    
    // Include password only if provided (for password reset)
    if (user.password && user.password.trim() !== '') {
      dto.password = user.password;
    }
    
    // Backend expects: PUT /api/users/{id} with ID in URL path
    return this.http.put(`${this.apiUrl}/${user.userId}`, dto);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${userId}`);
  }
}
