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
import { DailyDriverDeliveryReport } from '../../../models/reports.model';

@Component({
  selector: 'app-driver-delivery',
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
  templateUrl: './driver-delivery.component.html',
  styleUrl: './driver-delivery.component.scss'
})
export class DriverDeliveryComponent implements OnInit {
  startDate = signal<string>(this.getTodayDate());
  endDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyDriverDeliveryReport[]>([]);
  isLoading = signal<boolean>(false);

  constructor(
    private reportsService: ReportsService,
    private excelService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    
    this.reportsService.getDailyDriverDeliveryReport(
      this.startDate(),
      this.endDate()
    ).subscribe({
      next: (data: DailyDriverDeliveryReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading driver delivery report:', error);
        this.isLoading.set(false);
        alert('Failed to load report. Please try again.');
      }
    });
  }

  onDateChange(): void {
    this.loadReport();
  }

  exportToExcel(): void {
    if (this.reportData().length === 0) {
      alert('No data to export');
      return;
    }

    const excelData = this.reportData().map(item => ({
      'Driver': item.driverName,
      'Total Deliveries': item.totalDeliveries,
      'Total Cylinders': item.totalCylinders,
      'Other Items': item.totalOtherItems,
      'Total Items': item.totalItems,
      'Products Breakdown': item.productsBreakdown,
      'Cash Collected': item.totalCashCollected
    }));

    this.excelService.exportToExcel(
      excelData,
      `Driver_Delivery_Report_${this.startDate()}_to_${this.endDate()}`,
      'Driver Deliveries'
    );
  }

  getTotalDeliveries(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalDeliveries, 0);
  }

  getTotalItems(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalItems, 0);
  }

  getTotalCash(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalCashCollected, 0);
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
