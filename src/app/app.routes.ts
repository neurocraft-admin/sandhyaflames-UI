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
  { path: 'dashboard', loadChildren: () => import('./views/dashboard/routes').then(m => m.routes) },
  { path: 'users', loadChildren: () => import('./views/users/routes').then(m => m.routes) },
  { path: 'roles', loadChildren: () => import('./views/roles/routes').then(m => m.routes) },
  { path: 'delivery', loadChildren: () => import('./views/delivery/routes').then(m => m.routes) },
  { path: 'products',loadChildren: () => import('./views/products/routes').then(m => m.routes)},
  { path: 'drivers',loadChildren: () => import('./views/drivers/routes').then(m => m.routes)},
  { path: 'vehicles',loadChildren: () => import('./views/vehicles/routes').then(m => m.routes)},
  { path: 'vehicle-assignment',loadChildren: () => import('./views/vehicle-assignments/routes').then(m => m.routes)},
  { path: 'PurchaseEntry',loadChildren: () => import('./views/purchase-entry/routes').then(m => m.routes)},

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
