import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ApiModule, Configuration } from './api';
import { LucideAngularModule, Pencil, Trash2 } from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

const apiConfigFactory = () => new Configuration({ basePath: 'http://localhost:5000' });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory), LucideAngularModule.pick({ Pencil, Trash2 })),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
