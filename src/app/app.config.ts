import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { spinnerInterceptor } from './Security/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr, ToastrModule } from 'ngx-toastr';
import { provideNativeDateAdapter } from '@angular/material/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
       provideRouter(routes),

    // Hash location strategy
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideHttpClient(
      withInterceptors([
        spinnerInterceptor
      ])
    ),
     provideAnimations(),
        provideNativeDateAdapter(),
      importProvidersFrom(ToastrModule.forRoot()),
       provideToastr({
      positionClass: 'toast-top-right' // 👈 this controls the position
    })
  ]
};


