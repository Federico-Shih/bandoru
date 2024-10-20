import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {NgOptimizedImage} from "@angular/common";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  CLIENT_ID = environment.cognitoClientId;

  public SIGNUP_URL = `${environment.cognitoDomain}/signup?client_id=${this.CLIENT_ID}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(window.location.origin)}/login-success`;
}
