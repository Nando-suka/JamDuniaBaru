import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    
  ]
};
