import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ApiModule, Configuration } from './api';
import { routes } from './app.routes';

const apiConfigFactory = () => new Configuration({ basePath: 'http://localhost:5000' });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory)),
    provideRouter(routes),
  ]
};
