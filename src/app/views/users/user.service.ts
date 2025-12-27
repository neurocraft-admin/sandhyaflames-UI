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
    // Map password to passwordHash for backend DTO
    const dto = {
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.password,  // Backend expects passwordHash, not password
      roleId: user.roleId
    };
    return this.http.post(`${this.apiUrl}/create`, dto);
  }

  updateUser(user: any): Observable<any> {
    // Map to backend DTO structure
    const dto = {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive
    };
    return this.http.put(`${this.apiUrl}/update`, dto);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${userId}`);
  }
}
