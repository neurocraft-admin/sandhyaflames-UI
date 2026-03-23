import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  CardHeaderComponent,
  CardBodyComponent,
  ColComponent,
  RowComponent,
  TableDirective,
  FormModule,
  ButtonDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ReportsService } from '../../../services/reports.service';
import { ExcelExportService } from '../../../services/excel-export.service';
import { DailyDeliveryReport } from '../../../models/reports.model';

@Component({
  selector: 'app-daily-delivery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ColComponent,
    RowComponent,
    TableDirective,
    FormModule,
    ButtonDirective,
    IconDirective
  ],
  templateUrl: './daily-delivery.component.html',
  styleUrl: './daily-delivery.component.scss'
})
export class DailyDeliveryComponent implements OnInit {
  startDate = signal<string>(this.getTodayDate());
  endDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyDeliveryReport[]>([]);
  isLoading = signal<boolean>(false);
  
  // Filter signals
  statusFilter = signal<string>('');
  driverFilter = signal<number | undefined>(undefined);
  vehicleFilter = signal<number | undefined>(undefined);

  constructor(
    private reportsService: ReportsService,
    private excelService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    
    this.reportsService.getDailyDeliveryReport(
      this.startDate(),
      this.endDate(),
      this.statusFilter() || undefined,
      this.driverFilter(),
      this.vehicleFilter()
    ).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading daily delivery report:', error);
        this.isLoading.set(false);
        alert('Failed to load report. Please try again.');
      }
    });
  }

  onDateChange(): void {
    this.loadReport();
  }

  onFilterChange(): void {
    this.loadReport();
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.driverFilter.set(undefined);
    this.vehicleFilter.set(undefined);
    this.loadReport();
  }

  exportToExcel(): void {
    if (this.reportData().length === 0) {
      alert('No data to export');
      return;
    }

    const excelData = this.reportData().map(item => ({
      'Delivery ID': item.deliveryId,
      'Date': new Date(item.deliveryDate).toLocaleDateString(),
      'Status': item.status,
      'Start Time': item.startTime || '-',
      'Return Time': item.returnTime || '-',
      'Driver': item.driverName,
      'Helper': item.helperName || '-',
      'Vehicle': item.vehicleNumber,
      'Route': item.routeName,
      'Product Types': item.totalProductTypes,
      'Total Quantity': item.totalQuantity,
      'Products': item.productsDetail,
      'Cash Collected': item.cashCollected,
      'Remarks': item.remarks || '-'
    }));

    this.excelService.exportToExcel(
      excelData,
      `Daily_Delivery_Report_${this.startDate()}_to_${this.endDate()}`,
      'Daily Deliveries'
    );
  }

  // Summary calculations
  getTotalDeliveries(): number {
    return this.reportData().length;
  }

  getTotalQuantity(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalQuantity, 0);
  }

  getTotalCash(): number {
    return this.reportData().reduce((sum, item) => sum + item.cashCollected, 0);
  }

  getOpenDeliveries(): number {
    return this.reportData().filter(item => item.status === 'Open').length;
  }

  getClosedDeliveries(): number {
    return this.reportData().filter(item => item.status === 'Closed').length;
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
