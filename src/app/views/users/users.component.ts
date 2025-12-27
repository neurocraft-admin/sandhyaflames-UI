import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  error = '';
  userForm: FormGroup;
  isEditing = false;
  showForm = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      userId: [null],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      roleId: [1, Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: () => this.error = 'Failed to load users'
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
    this.userForm.patchValue(user);
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  saveUser(): void {
    if (this.userForm.invalid) return;

    const formData = this.userForm.value;

    if (this.isEditing) {
      this.userService.updateUser(formData).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelForm();
        },
        error: () => this.error = 'Failed to update user'
      });
    } else {
      this.userService.createUser(formData).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelForm();
        },
        error: () => this.error = 'Failed to create user'
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
}
