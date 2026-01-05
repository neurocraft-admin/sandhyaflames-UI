import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';

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
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;
    const email = `${username}@${environment.emailDomain}`;
    console.log('🔐 Attempting login with email:', email);

    this.auth.login(email, password).subscribe({
      next: (res: any) => {
        console.log('✅ Login successful, response:', res);
        
        // save token
        this.auth.setToken(res.token);
        console.log('✅ Token saved');
        
        // save user info with correct field names
        this.auth.saveUserInfo({
          userId: res.userId,
          email: email, // Use the email from login form
          roleName: res.roleName
        });
        console.log('✅ User info saved');

        // fetch permissions
        this.auth.fetchPermissions(res.userId).subscribe({
          next: (perms) => {
            console.log('Fetched permissions from API:', perms);
            this.auth.savePermissions(perms);
            console.log('Saved permissions to localStorage');

            // Small delay to ensure all data is saved before reload
            setTimeout(() => {
              this.router.navigate(['/dashboard']).then(() => {
                window.location.reload();
              });
            }, 100);
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
