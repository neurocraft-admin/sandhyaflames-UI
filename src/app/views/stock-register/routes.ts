import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./stock-register.component').then(m => m.StockRegisterComponent),
    data: {
      title: 'Stock Register'
    }
  }
];
