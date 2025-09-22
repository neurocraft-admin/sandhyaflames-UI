import { Routes } from '@angular/router';
import { RolesComponent } from './roles.component';   // ✅ correct now

export const routes: Routes = [
  {
    path: '',
    component: RolesComponent
  }
];
