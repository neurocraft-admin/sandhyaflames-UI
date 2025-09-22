import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { permissionGuard } from './auth/permission.guard';
import { Perm } from './auth/permissions';
import { DefaultLayoutComponent } from './layout/default-layout/default-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./views/pages/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: '',
    component: DefaultLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/dashboard/routes').then(m => m.routes)
      },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { resource: 'Users', need: Perm.View },
        loadChildren: () =>
          import('./views/users/routes').then(m => m.routes)
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { resource: 'Roles', need: Perm.View },
        loadChildren: () =>
          import('./views/roles/routes').then(m => m.routes)
      },
      {
        path: 'delivery',
        canActivate: [permissionGuard],
        data: { resource: 'DailyDelivery', need: Perm.View },
        loadChildren: () =>
          import('./views/delivery/routes').then(m => m.routes)
      }
    ]
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./auth/unauthorized/unauthorized.component').then(
        m => m.UnauthorizedComponent
      )
  },

  { path: '**', redirectTo: 'dashboard' }
];
