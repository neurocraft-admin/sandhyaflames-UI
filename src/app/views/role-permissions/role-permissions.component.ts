import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Resource {
  resourceId: number;
  resourceName: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface Role {
  roleId: number;
  roleName: string;
}

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss']
})
export class RolePermissionsComponent implements OnInit {
  roles: Role[] = [];
  resources: Resource[] = [];
  
  get selectedRoleName(): string {
    const role = this.roles.find(r => r.roleId === this.selectedRoleId);
    return role?.roleName || '';
  }
  selectedRoleId: number | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.http.get<Role[]>(`${environment.apiUrl}/roles/list`).subscribe({
      next: (data) => this.roles = data,
      error: () => this.error = 'Failed to load roles'
    });
  }

  onRoleChange(): void {
    if (!this.selectedRoleId) return;
    
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/roles/${this.selectedRoleId}/permissions`).subscribe({
      next: (data) => {
        this.resources = data.resources;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load permissions';
        this.loading = false;
      }
    });
  }

  toggleAll(field: 'canView' | 'canCreate' | 'canUpdate' | 'canDelete'): void {
    const allChecked = this.resources.every(r => r[field]);
    this.resources.forEach(r => r[field] = !allChecked);
  }

  savePermissions(): void {
    if (!this.selectedRoleId) return;

    this.loading = true;
    this.http.put(`${environment.apiUrl}/roles/${this.selectedRoleId}/permissions`, {
      permissions: this.resources
    }).subscribe({
      next: () => {
        this.success = 'Permissions updated successfully!';
        this.loading = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        this.error = 'Failed to save permissions';
        this.loading = false;
      }
    });
  }
}
