// import { AppNavData } from '../nav-item.model';

// export const navItems: AppNavData[] = [
//   {
//     name: 'Dashboard',
//     url: '/dashboard',
//     iconComponent: { name: 'cil-speedometer' }
//   },
//   {
//     name: 'Users',
//     url: '/users',
//     iconComponent: { name: 'cil-user' },
//     resource: 'Users',   // custom permission key
//     perm: 1              // View
//   },
//   {
//     name: 'Roles',
//     url: '/roles',
//     iconComponent: { name: 'cil-people' },
//     resource: 'Roles',
//     perm: 1
//   },
//   {
//     name: 'Delivery',
//     url: '/delivery',
//     iconComponent: { name: 'cil-truck' },
//     resource: 'DailyDelivery',
//     perm: 1
//   }
// ];
import { AppNavData } from '../nav-item.model';

export const navItems: AppNavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    title: false  // ✅ this forces it to render as a link, not as a title
  },
  {
    name: 'Users',
    url: '/users',
    iconComponent: { name: 'cil-user' },
    resource: 'Users',
    perm: 1,
    title: false
  },
  {
    name: 'Roles',
    url: '/roles',
    iconComponent: { name: 'cil-people' },
    resource: 'Roles',
    perm: 1,
    title: false
  },
  {
    name: 'Delivery',
    url: '/delivery',
    iconComponent: { name: 'cil-truck' },
    resource: 'DailyDelivery',
    perm: 1,
    title: false
  }
];
