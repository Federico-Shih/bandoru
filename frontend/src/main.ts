import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import {Amplify} from "aws-amplify";
import {environment} from "./environments/environment";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognitoUserPoolId,
      userPoolClientId: environment.cognitoClientId,
      loginWith: {
        email: true,
      },
    },
  }
})

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
