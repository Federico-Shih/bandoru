import {Component, inject} from '@angular/core';
import {RouterLink} from "@angular/router";
import {AsyncPipe, NgIf, NgOptimizedImage} from "@angular/common";
import {environment} from "../../../../environments/environment";
import {AuthService, NO_USER} from "../../data-access/auth-service/auth.service";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgOptimizedImage,
    AsyncPipe,
    NgIf
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  authService = inject(AuthService);

  user$ = this.authService.getAuthUser();

  CLIENT_ID = environment.cognitoClientId;
  public SIGNIN_URL = `${environment.cognitoDomain}/login?client_id=${this.CLIENT_ID}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(window.location.origin)}/login-success`;

  public SIGNUP_URL = `${environment.cognitoDomain}/signup?client_id=${this.CLIENT_ID}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(window.location.origin)}/login-success`;
  protected readonly NO_USER = NO_USER;
}
