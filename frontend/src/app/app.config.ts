import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {MonacoEditorModule} from "ngx-monaco-editor-v2";
import {HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors} from "@angular/common/http";
import {BaseUrlInterceptor} from "./shared/interceptors/baseurl.interceptor";
import {environment} from "../environments/environment";
import {addTokenInterceptor} from "./shared/interceptors/add-token.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient(withFetch(), withInterceptors([addTokenInterceptor])),
    importProvidersFrom([
      MonacoEditorModule.forRoot()]),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BaseUrlInterceptor,
      multi: true
    },
    {
      provide: "BASE_API_URL", useValue: environment.apiUrl
    },
  ],
};
