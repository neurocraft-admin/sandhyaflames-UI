import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from '@coreui/angular';
import { CardModule } from '@coreui/angular';
import { TableModule } from '@coreui/angular';
import { RowComponent, ColComponent } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { DailyDeliverySummary } from '../../models/daily-delivery-summary.model';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-commercial-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  filteredDeliveries: DailyDeliverySummary[] = [];
  paginatedDeliveries: DailyDeliverySummary[] = [];
  loading = signal<boolean>(false);

  // Filter & Pagination
  fromDate: string = this.today();
  toDate: string = this.today();
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Permissions
  permissions = {
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false
  };

  constructor(
    private deliveryService: DailyDeliveryService,
    private router: Router,
    private toast: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
    this.loadCommercialDeliveries();
  }

  loadPermissions(): void {
    this.authService.getUserPermissions('CommercialDeliveries').subscribe(result => {
      const mask = result.permissionMask;
      this.permissions.canView = (mask & 1) === 1;
      this.permissions.canCreate = (mask & 2) === 2;
      this.permissions.canUpdate = (mask & 4) === 4;
      this.permissions.canDelete = (mask & 8) === 8;
    });
  }

  loadCommercialDeliveries(): void {
    this.loading.set(true);
    this.deliveryService.getSummary().subscribe({
      next: (data: DailyDeliverySummary[]) => {
        console.log('Commercial deliveries data:', data);
        this.deliveries.set(data || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load commercial deliveries:', err);
        this.toast.error('Failed to load commercial deliveries');
        this.loading.set(false);
      }
    });
  }

  /* Apply filters and pagination */
  applyFilters() {
    let filtered = [...this.deliveries()];

    // Filter by date range
    if (this.fromDate || this.toDate) {
      filtered = filtered.filter(d => {
        const deliveryDateValue = d.DeliveryDate || d.deliveryDate;
        if (!deliveryDateValue) return false;
        const deliveryDate = new Date(deliveryDateValue).toISOString().substring(0, 10);
        const matchesFrom = !this.fromDate || deliveryDate >= this.fromDate;
        const matchesTo = !this.toDate || deliveryDate <= this.toDate;
        return matchesFrom && matchesTo;
      });
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => {
      const dateAValue = a.DeliveryDate || a.deliveryDate;
      const dateBValue = b.DeliveryDate || b.deliveryDate;
      if (!dateAValue || !dateBValue) return 0;
      const dateA = new Date(dateAValue).getTime();
      const dateB = new Date(dateBValue).getTime();
      return dateB - dateA;
    });

    this.filteredDeliveries = filtered;
    this.totalPages = Math.ceil(this.filteredDeliveries.length / this.pageSize);
    this.currentPage = 1;
    this.updatePagination();
  }

  /* Update pagination */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedDeliveries = this.filteredDeliveries.slice(start, end);
  }

  /* Pagination controls */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /* Clear filters */
  clearFilters() {
    this.fromDate = this.today();
    this.toDate = this.today();
    this.applyFilters();
  }

  private today() {
    return new Date().toISOString().substring(0, 10);
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
