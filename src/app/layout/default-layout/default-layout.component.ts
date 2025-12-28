import { Component,inject, OnInit } from '@angular/core';
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
import { MenuService } from '../../services/menu.service';
import { AppInitService } from '../../services/app-init.service';
import { NgFor, NgIf, AsyncPipe  } from '@angular/common';
import { Observable } from 'rxjs';

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
    NgIf,
    AsyncPipe
  ],
  providers: [SidebarNavHelper],   // ✅ fix NG0201
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss']
})
export class DefaultLayoutComponent implements OnInit {
  public toastService = inject(ToastService);
  private menuService = inject(MenuService);
  private appInitService = inject(AppInitService);
  
  // Observable for menu items (will be loaded from API)
  public sidebarItems$: Observable<INavData[]>;
  
  // Temporary fallback menu (will be replaced by API data)
  private fallbackMenu: INavData[] = [
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
        },
        {
          name: 'Role Permissions',
          url: '/role-permissions',
          iconComponent: { name: 'cil-lock-locked' }
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

  constructor() {
    // Set fallback menu immediately
    this.menuService.setMenu(this.fallbackMenu);
    this.sidebarItems$ = this.menuService.getMenu();
  }

  ngOnInit(): void {
    // Load menu and permissions from API
    this.appInitService.initializeApp().subscribe({
      next: () => console.log('✅ App data loaded'),
      error: () => console.log('⚠️ Using fallback menu')
    });
  }

  logout() {
    this.appInitService.clearAppData();
    localStorage.clear();
    window.location.href = '/login';
  }
}
