import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'https://localhost:7183/api/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/list`);
  }

  createUser(user: Partial<User>): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, user);
  }

  updateUser(user: Partial<User>): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, user);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${userId}`);
  }
}
