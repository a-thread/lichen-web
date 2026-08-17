import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: true, // service worker only actually installs on a production build
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}).catch((err) => console.error(err));
