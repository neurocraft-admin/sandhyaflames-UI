import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ToastService } from '../../services/toast.service';
import { DailyDeliverySummary } from '../../models/daily-delivery-summary.model';

@Component({
  selector: 'app-daily-delivery-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-delivery-summary.component.html'
})
export class DailyDeliverySummaryComponent {
  private svc = inject(DailyDeliveryService);
  private toast = inject(ToastService);

  summaries: DailyDeliverySummary[] = [];
  fromDate = '';
  toDate = '';

  ngOnInit() {
    this.fromDate = this.today();
    this.toDate = this.today();
    this.loadSummary();
  }

  loadSummary() {
    this.svc.getSummary({ fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res) => (this.summaries = res || []),
      error: () => this.toast.error('Failed to load delivery summary'),
    });
  }

  private today() {
    return new Date().toISOString().substring(0, 10);
  }

  completionRateColor(rate: number): string {
  if (rate >= 90) return 'text-success';
  if (rate >= 70) return 'text-warning';
  return 'text-danger';
}

}
