import { Routes } from '@angular/router';
import { DeliveryMappingComponent } from './delivery-mapping.component';

export const routes: Routes = [
  { path: ':id', component: DeliveryMappingComponent }
];
