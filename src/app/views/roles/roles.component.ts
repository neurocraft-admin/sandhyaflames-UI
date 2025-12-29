import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService, Role } from './roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  error = '';
  roleForm: FormGroup;
  isEditing = false;
  showForm = false;

  constructor(
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      roleId: [null],
      roleName: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles = data,
      error: () => this.error = 'Failed to load roles'
    });
  }

  addRole(): void {
    this.isEditing = false;
    this.showForm = true;
    this.roleForm.reset({ roleId: null, isActive: true });
  }

  editRole(role: Role): void {
    this.isEditing = true;
    this.showForm = true;
    this.roleForm.patchValue(role);
  }

  saveRole(): void {
    if (this.roleForm.invalid) return;

    const formData = this.roleForm.value;

    if (this.isEditing) {
      this.roleService.updateRole(formData).subscribe({
        next: () => {
          this.loadRoles();
          this.cancelForm();
        },
        error: () => this.error = 'Failed to update role'
      });
    } else {
      this.roleService.createRole(formData).subscribe({
        next: () => {
          this.loadRoles();
          this.cancelForm();
        },
        error: () => this.error = 'Failed to create role'
      });
    }
  }

  deleteRole(id: number): void {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roleService.deleteRole(id).subscribe({
        next: () => this.loadRoles(),
        error: () => this.error = 'Failed to delete role'
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.roleForm.reset();
  }
}
