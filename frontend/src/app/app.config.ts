import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ApiModule, Configuration } from './api';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';
import { offlineQueueInterceptor } from './core/offline-queue.interceptor';
import { OfflineQueueService } from './core/offline-queue.service';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

const apiConfigFactory = () =>
  new Configuration({ basePath: environment.apiBaseUrl, withCredentials: false });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, offlineQueueInterceptor])),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory)),
    provideRouter(routes),
    OfflineQueueService,
    provideServiceWorker('ngsw-worker.js', {
        enabled: environment.production,
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
