import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';   // ⬅️ add this
import { UserService, User } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],   // ⬅️ add this
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  error = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users = data,
      error: () => this.error = 'Failed to load users'
    });
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }
}
