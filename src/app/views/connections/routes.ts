import { Routes } from '@angular/router';
import { ConnectionsComponent } from './connections.component';
import { ConnectionsListComponent } from './connections-list.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'list',
    pathMatch: 'full'
  },
  { 
    path: 'list', 
    component: ConnectionsListComponent,
    data: { title: 'Connection History' }
  },
  { 
    path: 'form', 
    component: ConnectionsComponent,
    data: { title: 'Manage Connection' }
  }
];
