export interface Toast {
  title?: string;
  body?: string;
  color?: string;   // e.g. 'success' | 'danger' | 'info' | 'warning'
  delay?: number;   // milliseconds
  autohide?: boolean;
}
