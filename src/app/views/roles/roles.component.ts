import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService, Role } from './roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles.component.html',
  //styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  error = '';

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (data) => (this.roles = data),
      error: () => (this.error = 'Failed to load roles')
    });
  }

  deleteRole(id: number) {
    if (confirm('Are you sure?')) {
      this.roleService.deleteRole(id).subscribe(() => this.loadRoles());
    }
  }
}
