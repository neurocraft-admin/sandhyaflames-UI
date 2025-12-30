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
    title: false
  },
  {
    name: 'Daily Delivery',
    url: '/DailyDelivery',
    iconComponent: { name: 'cil-truck' },
    title: false
  },
  {
    name: 'Commercial Deliveries',
    url: '/CommercialDeliveries',
    iconComponent: { name: 'cil-briefcase' },
    title: false
  },
  {
    name: 'Purchase Entry',
    url: '/PurchaseEntry',
    iconComponent: { name: 'cil-cart' },
    title: false
  },
  {
    name: 'Stock Register',
    url: '/StockRegister',
    iconComponent: { name: 'cil-storage' },
    title: false
  },
  {
    name: 'Income/Expense',
    url: '/IncomeExpenseForm',
    iconComponent: { name: 'cil-money' },
    title: false
  },
  {
    title: true,
    name: 'Masters'
  },
  {
    name: 'Drivers',
    url: '/drivers',
    iconComponent: { name: 'cil-user' },
    title: false
  },
  {
    name: 'Vehicles',
    url: '/vehicles',
    iconComponent: { name: 'cil-car-alt' },
    title: false
  },
  {
    name: 'Vehicle Assignment',
    url: '/vehicle-assignment',
    iconComponent: { name: 'cil-calendar' },
    title: false
  },
  {
    name: 'Products',
    url: '/products',
    iconComponent: { name: 'cil-library' },
    title: false
  },
  {
    name: 'Product Pricing',
    url: '/ProductPricing',
    iconComponent: { name: 'cil-dollar' },
    title: false
  },
  {
    title: true,
    name: 'Customer'
  },
  {
    name: 'Customers',
    url: '/customers',
    iconComponent: { name: 'cil-people' },
    title: false
  },
  {
    name: 'Customer Credit',
    url: '/customer-credit',
    iconComponent: { name: 'cil-credit-card' },
    title: false
  },
  {
    title: true,
    name: 'Admin'
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
    iconComponent: { name: 'cil-shield-alt' },
    resource: 'Roles',
    perm: 1,
    title: false
  },
  {
    name: 'Role Permissions',
    url: '/role-permissions',
    iconComponent: { name: 'cil-lock-locked' },
    resource: 'Roles',
    perm: 1,
    title: false
  }
];
