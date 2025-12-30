import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./commercial-delivery-list.component').then(m => m.CommercialDeliveryListComponent),
    data: {
      title: 'Commercial Deliveries'
    }
  }
];
