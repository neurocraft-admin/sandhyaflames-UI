import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

import { IconSetService } from '@coreui/icons-angular';
import { cilUser, cilPeople, cilTruck, cilSpeedometer } from '@coreui/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: IconSetService,
      useFactory: () => {
        const icons = new IconSetService();
        icons.icons = { cilUser, cilPeople, cilTruck, cilSpeedometer };
        return icons;
      }
    }
  ]
};
