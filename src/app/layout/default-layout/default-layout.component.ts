import { Component,inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  SidebarComponent,
  SidebarNavComponent,
  HeaderComponent,
  FooterComponent,
  ButtonDirective,
  SidebarNavHelper,   // ✅ required for c-sidebar-nav
  INavData,
  
  ToasterComponent,
  ToastComponent,
  ToastHeaderComponent,
  ToastBodyComponent
} from '@coreui/angular';
import { ToastService } from '../../services/toast.service';
import { NgFor, NgIf  } from '@angular/common';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    SidebarNavComponent,
    HeaderComponent,
    FooterComponent,
    ButtonDirective,
    ToasterComponent,
    ToastComponent,
    ToastHeaderComponent,
    ToastBodyComponent,
    NgFor,
    NgIf
  ],
  providers: [SidebarNavHelper],   // ✅ fix NG0201
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss']
})
export class DefaultLayoutComponent {
  public toastService = inject(ToastService);
  // ✅ Hard-coded menu for beta release
  public sidebarItems: INavData[] = [
    {
      name: 'Dashboard',
      url: '/dashboard',
      iconComponent: { name: 'cil-speedometer' }
    },
    {
      name: 'Users',
      url: '/users',
      iconComponent: { name: 'cil-user' }
    },
    {
      name: 'Roles',
      url: '/roles',
      iconComponent: { name: 'cil-people' }
    },
    {
      name: 'Products',
      url: '/products',
      iconComponent: { name: 'cil-truck' }
    },
    {
      name: 'Customers',
      url: '/customers',
      iconComponent: { name: 'cil-people' }
    },
    {
      name: 'Drivers',
      url: '/drivers',
      iconComponent: { name: 'cil-truck' }
    },
    {
      name: 'Vehicles',
      url: '/vehicles',
      iconComponent: { name: 'cil-truck' }
    },
    {
      name: 'vehicle-assignment',
      url: '/vehicle-assignment',
      iconComponent: { name: 'cil-truck' }
    },
    {
      name: 'PurchaseEntry',
      url: '/PurchaseEntry',
      iconComponent: { name: 'cil-truck' }
    },
    {
      name: 'ProductPricing',
      url: '/ProductPricing',
      iconComponent: { name: 'cil-truck' }
    },
    
    {
      name: 'Daily-Delivery',
      url: '/DailyDelivery',
      iconComponent: { name: 'cil-truck' }
    },
    
    {
      name: 'Income-Expense',
      url: '/IncomeExpenseForm',
      iconComponent: { name: 'cil-truck' }
    }

  ];

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
