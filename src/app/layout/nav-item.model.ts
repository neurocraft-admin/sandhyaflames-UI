import { INavData } from '@coreui/angular';

export interface AppNavData extends INavData {
  resource?: string; // resource key (Users, Roles, DailyDelivery)
  perm?: number;     // permission mask (e.g., View=1)
  iconComponent?: { name: string };
  children?: INavData[];
}
