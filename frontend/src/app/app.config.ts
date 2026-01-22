import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ApiModule, Configuration } from './api';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';

const apiConfigFactory = () => new Configuration({ basePath: 'http://localhost:5000' });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory)),
    provideRouter(routes),
  ]
};
