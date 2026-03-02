import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ApiModule, Configuration } from './api';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';
import { offlineQueueInterceptor } from './core/offline-queue.interceptor';
import { OfflineQueueService } from './core/offline-queue.service';
import { provideServiceWorker } from '@angular/service-worker';

const apiConfigFactory = () => new Configuration({ basePath: 'http://13.51.121.30', withCredentials: true });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor, offlineQueueInterceptor])),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory)),
    provideRouter(routes),
    OfflineQueueService,
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
