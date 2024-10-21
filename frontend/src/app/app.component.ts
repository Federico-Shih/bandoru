import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NavbarComponent} from "./shared/ui/navbar/navbar.component";
import {ToastService} from "./shared/state/toast/toast.service";
import {AuthService} from "./shared/data-access/auth-service/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  authService = inject(AuthService);
  toast = inject(ToastService);

  shownToast = this.toast.showToast();

  ngOnInit(): void {
    this.authService.pullUser();
  }
}
