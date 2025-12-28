import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: (res: any) => {
        // save token
        this.auth.setToken(res.token);

        // fetch permissions
        this.auth.fetchPermissions(res.userId).subscribe({
          next: (perms) => {
            console.log('Fetched permissions from API:', perms);
            this.auth.savePermissions(perms);
            console.log('Saved permissions to localStorage');

            // ✅ navigate and refresh sidebar
            this.router.navigate(['/dashboard']).then(() => {
              window.location.reload();
            });
          },
          error: (err) => {
            console.error('Failed to fetch permissions:', err);
            // Navigate anyway, but without permissions
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: () => {
        this.error = 'Invalid credentials';
      }
    });
  }
}
