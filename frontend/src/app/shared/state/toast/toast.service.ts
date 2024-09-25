import {effect, Injectable, signal} from '@angular/core';

type ToastType = 'info' | 'error' | 'success' | 'warning';
type Toast = {
  message: string;
  type: ToastType;
  style: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor() {
    effect(() => {
      const shownToast = this.shownToast();
      if (shownToast !== null) {
        setTimeout(() => {
          this.shownToast.set(null);
        }, 2000);
      }
    });
  }
  shownToast = signal<Toast | null>(null);

  info(message: string) {
    this.shownToast.set({ message, type: 'info', style: 'alert-info' });
  }

  error(message: string) {
    this.shownToast.set({ message, type: 'error', style: 'alert-error' });
  }

  success(message: string) {
    this.shownToast.set({ message, type: 'success', style: 'alert-success' });
  }

  warning(message: string) {
    this.shownToast.set({ message, type: 'warning', style: 'alert-warning' });
  }

  showToast() {
    return this.shownToast.asReadonly();
  }
}
