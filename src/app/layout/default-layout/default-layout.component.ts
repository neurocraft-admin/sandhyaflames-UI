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
import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../auth/auth.service';
import { NgFor, NgIf, AsyncPipe  } from '@angular/common';
import { Observable, interval } from 'rxjs';

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
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  
  // Observable for menu items (will be loaded from API)
  public sidebarItems$: Observable<INavData[]>;

  // User session info
  userEmail: string = '';
  userRole: string = '';
  sessionDuration: string = '0m';
  uiVersion: string = '5.5.11';
  apiVersion: string = '1.0.0'; // Will be fetched from API
  
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
    // Load user info from localStorage
    this.loadUserInfo();

    // Update session duration every minute
    interval(60000).subscribe(() => {
      this.updateSessionDuration();
    });
    this.updateSessionDuration();

    // Load menu and permissions from API
    this.appInitService.initializeApp().subscribe({
      next: () => {
        console.log('✅ App data loaded');
        // Reload user info after app initialization
        this.loadUserInfo();
      },
      error: () => console.log('⚠️ Using fallback menu')
    });
  }

  loadUserInfo(): void {
    // First try PermissionService (loaded during app init)
    this.permissionService.getUserInfo().subscribe(info => {
      if (info) {
        this.userEmail = info.username;
        this.userRole = info.roleName;
      }
    });
    
    // Fallback to localStorage if PermissionService not loaded yet
    const userInfo = this.authService.getUserInfo();
    if (userInfo && !this.userEmail) {
      this.userEmail = userInfo.email;
      this.userRole = userInfo.roleName;
    }
  }

  updateSessionDuration(): void {
    const loginTime = this.authService.getLoginTime();
    if (loginTime) {
      const now = new Date().getTime();
      const login = new Date(loginTime).getTime();
      const diff = Math.floor((now - login) / 1000 / 60); // minutes
      
      if (diff < 60) {
        this.sessionDuration = `${diff}m`;
      } else {
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        this.sessionDuration = `${hours}h ${minutes}m`;
      }
    }
  }

  logout() {
    this.appInitService.clearAppData();
    localStorage.clear();
    window.location.href = '/login';
  }
}
