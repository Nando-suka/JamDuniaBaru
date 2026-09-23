import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Making a bootstrap application that catch them
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
