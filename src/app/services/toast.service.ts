import { Injectable } from '@angular/core';
import { Toast } from '../models/toast.model';   // <-- use your own interface

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toasts: Toast[] = [];

  private add(toast: Toast) {
    this.toasts.push(toast);
  }

  success(message: string, title = 'Success') {
    this.add({
      title,
      body: message,
      color: 'success',
      autohide: true,
      delay: 3000
    });
  }

  error(message: string, title = 'Error') {
    this.add({
      title,
      body: message,
      color: 'danger',
      autohide: true,
      delay: 5000
    });
  }

  info(message: string, title = 'Info') {
    this.add({
      title,
      body: message,
      color: 'info',
      autohide: true,
      delay: 3000
    });
  }

  warning(message: string, title = 'Warning') {
    this.add({
      title,
      body: message,
      color: 'warning',
      autohide: true,
      delay: 4000
    });
  }

  remove(toast: Toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
