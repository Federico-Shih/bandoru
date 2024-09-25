import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NavbarComponent} from "./shared/ui/navbar/navbar.component";
import {ToastService} from "./shared/state/toast/toast.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'frontend';
  toast = inject(ToastService);

  shownToast = this.toast.showToast();
}
