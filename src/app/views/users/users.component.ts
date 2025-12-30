import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User } from './user.service';
import { RoleService, Role } from '../roles/roles.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];
  error = '';
  userForm: FormGroup;
  isEditing = false;
  showForm = false;
  emailDomain = environment.emailDomain;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      userId: [null],
      fullName: ['', Validators.required],
      username: ['', Validators.required],  // Changed from email
      password: [''],
      roleId: [1, Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: () => this.error = 'Failed to load users'
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => this.roles = data,
      error: () => this.error = 'Failed to load roles'
    });
  }

  addUser(): void {
    this.isEditing = false;
    this.showForm = true;
    this.userForm.reset({ userId: null, roleId: 1, isActive: true });
    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  editUser(user: User): void {
    this.isEditing = true;
    this.showForm = true;
    
    // Extract username from email
    const username = user.email.split('@')[0];
    
    this.userForm.patchValue({
      userId: user.userId,
      fullName: user.fullName,
      username: username,  // Use extracted username
      roleId: user.roleId,
      isActive: user.isActive
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      console.log('Form is invalid:', this.userForm.errors);
      return;
    }

    const formValue = this.userForm.value;
    
    // Concatenate username with domain to create email
    const email = `${formValue.username}@${this.emailDomain}`;
    
    const userData = {
      ...formValue,
      email: email  // Replace username with full email
    };
    delete userData.username;  // Remove username field

    console.log('Sending user data:', userData);

    if (this.isEditing) {
      this.userService.updateUser(userData).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelForm();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.error = 'Failed to update user';
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelForm();
        },
        error: (err) => {
          console.error('Create error:', err);
          this.error = 'Failed to create user';
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: () => this.error = 'Failed to delete user'
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.userForm.reset();
  }

  getRoleName(roleId: number): string {
    const role = this.roles.find(r => r.roleId === roleId);
    return role?.roleName || 'Unknown';
  }
}
