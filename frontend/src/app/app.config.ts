import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

import { ApiModule, Configuration } from './api';

const apiConfigFactory = () => new Configuration({ basePath: 'http://localhost:5000' });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(ApiModule.forRoot(apiConfigFactory)),
  ]
};
