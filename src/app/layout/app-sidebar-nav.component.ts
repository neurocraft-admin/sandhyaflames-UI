import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { INavData, SidebarNavComponent, SidebarNavHelper } from '@coreui/angular';
import { AppNavData } from './nav-item.model';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [SidebarNavComponent],
  providers: [SidebarNavHelper],
  template: `<c-sidebar-nav [navItems]="coreuiItems"></c-sidebar-nav>`
})
export class AppSidebarNavComponent implements OnChanges {
  @Input() items: AppNavData[] = [];
  coreuiItems: INavData[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items']) {
      console.log('📌 AppSidebarNav received items:', this.items);

      // 🔑 map to CoreUI expected format
      this.coreuiItems = this.items.map(({ name, url, iconComponent, children }) => ({
  name,
  url,
  iconComponent,
  children: children ?? [],
  title: false         // 🔑 default to empty array
}));


      console.log('📌 CoreUI navItems:', this.coreuiItems);
    }
  }
}
