import { Component, inject, input } from '@angular/core';
import { ToastService } from '../../state/toast/toast.service';

@Component({
  selector: 'app-copy-link',
  standalone: true,
  imports: [],
  templateUrl: './copy-link.component.html',
  styleUrl: './copy-link.component.scss'
})
export class CopyLinkComponent {
  url = input<string>('/');
  toast = inject(ToastService);

  copyToClipboard() {
    const url = this.url();
    navigator.clipboard.writeText(url).then(r => {
      this.toast.info(`Share link copied to clipboard!`);
    });
  }
}
