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
  // ✅ Menu organized by sections
  public sidebarItems: INavData[] = [
    {
      name: 'Dashboard',
      url: '/dashboard',
      iconComponent: { name: 'cil-speedometer' }
    },
    {
      name: 'Admin',
      iconComponent: { name: 'cil-shield-alt' },
      children: [
        {
          name: 'Users',
          url: '/users',
          iconComponent: { name: 'cil-user' }
        },
        {
          name: 'Roles',
          url: '/roles',
          iconComponent: { name: 'cil-people' }
        }
      ]
    },
    {
      name: 'Delivery',
      iconComponent: { name: 'cil-truck' },
      children: [
        {
          name: 'Daily Delivery',
          url: '/DailyDelivery',
          iconComponent: { name: 'cil-calendar' }
        },
        {
          name: 'Delivery Mapping',
          url: '/DeliveryMapping',
          iconComponent: { name: 'cil-map' }
        },
        {
          name: 'Commercial Deliveries',
          url: '/CommercialDeliveries',
          iconComponent: { name: 'cil-briefcase' }
        }
      ]
    },
    {
      name: 'Purchase & Stocks',
      iconComponent: { name: 'cil-basket' },
      children: [
        {
          name: 'Purchase Entry',
          url: '/PurchaseEntry',
          iconComponent: { name: 'cil-cart' }
        },
        {
          name: 'Stock Register',
          url: '/StockRegister',
          iconComponent: { name: 'cil-storage' }
        }
      ]
    },
    {
      name: 'Income/Expense',
      url: '/IncomeExpenseForm',
      iconComponent: { name: 'cil-money' }
    },
    {
      name: 'Masters',
      iconComponent: { name: 'cil-settings' },
      children: [
        {
          name: 'Drivers',
          url: '/drivers',
          iconComponent: { name: 'cil-user-follow' }
        },
        {
          name: 'Vehicles',
          url: '/vehicles',
          iconComponent: { name: 'cil-car-alt' }
        },
        {
          name: 'Vehicle Assignment',
          url: '/vehicle-assignment',
          iconComponent: { name: 'cil-transfer' }
        },
        {
          name: 'Products',
          url: '/products',
          iconComponent: { name: 'cil-library' }
        },
        {
          name: 'Product Pricing',
          url: '/ProductPricing',
          iconComponent: { name: 'cil-dollar' }
        }
      ]
    },
    {
      name: 'Customer',
      iconComponent: { name: 'cil-people' },
      children: [
        {
          name: 'Customers',
          url: '/customers',
          iconComponent: { name: 'cil-user' }
        },
        {
          name: 'Customer Credit',
          url: '/customer-credit',
          iconComponent: { name: 'cil-credit-card' }
        }
      ]
    }
  ];

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
