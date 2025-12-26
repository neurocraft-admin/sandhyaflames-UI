import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from '@coreui/angular';
import { CardModule } from '@coreui/angular';
import { TableModule } from '@coreui/angular';
import { RowComponent, ColComponent } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { DailyDeliverySummary } from '../../models/daily-delivery-summary.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-commercial-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    RowComponent,
    ColComponent,
    IconDirective
  ],
  templateUrl: './commercial-delivery-list.component.html',
  styleUrls: ['./commercial-delivery-list.component.scss']
})
export class CommercialDeliveryListComponent implements OnInit {
  deliveries = signal<DailyDeliverySummary[]>([]);
  loading = signal<boolean>(false);

  constructor(
    private deliveryService: DailyDeliveryService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCommercialDeliveries();
  }

  loadCommercialDeliveries(): void {
    this.loading.set(true);
    this.deliveryService.getSummary().subscribe({
      next: (data: DailyDeliverySummary[]) => {
        console.log('Commercial deliveries data:', data);
        // Show all deliveries (API doesn't have HasCreditCustomers field yet)
        // TODO: Once backend adds HasCreditCustomers field, uncomment the filter below:
        // const commercialDeliveries = data.filter((d: DailyDeliverySummary) => d.HasCreditCustomers || d.hasCreditCustomers);
        this.deliveries.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load commercial deliveries:', err);
        this.toast.error('Failed to load commercial deliveries');
        this.loading.set(false);
      }
    });
  }

  mapCustomers(deliveryId: number): void {
    // Navigate to DeliveryMapping page with deliveryId as route parameter
    this.router.navigate(['/DeliveryMapping', deliveryId]);
  }

  editDelivery(deliveryId: number): void {
    // Navigate to DailyDeliveryUpdate page to edit the delivery
    this.router.navigate(['/DailyDeliveryUpdate', deliveryId]);
  }
}
