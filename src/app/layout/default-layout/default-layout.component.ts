import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  SidebarComponent,
  SidebarNavComponent,
  HeaderComponent,
  FooterComponent,
  ButtonDirective,
  SidebarNavHelper,   // ✅ required for c-sidebar-nav
  INavData
} from '@coreui/angular';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    SidebarNavComponent,
    HeaderComponent,
    FooterComponent,
    ButtonDirective
  ],
  providers: [SidebarNavHelper],   // ✅ fix NG0201
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss']
})
export class DefaultLayoutComponent {
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
      name: 'Delivery',
      url: '/delivery',
      iconComponent: { name: 'cil-truck' }
    }
  ];

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
