import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // ✅ already imported

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideAnimationsAsync()   // ✅ enable CoreUI toast animations
  ]
}).catch(err => console.error(err));
