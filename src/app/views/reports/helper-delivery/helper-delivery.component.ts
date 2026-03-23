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
import { DailyHelperDeliveryReport } from '../../../models/reports.model';

@Component({
  selector: 'app-helper-delivery',
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
  templateUrl: './helper-delivery.component.html',
  styleUrl: './helper-delivery.component.scss'
})
export class HelperDeliveryComponent implements OnInit {
  startDate = signal<string>(this.getTodayDate());
  endDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyHelperDeliveryReport[]>([]);
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
    
    this.reportsService.getDailyHelperDeliveryReport(
      this.startDate(),
      this.endDate()
    ).subscribe({
      next: (data: DailyHelperDeliveryReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading helper delivery report:', error);
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
      'Helper': item.helperName,
      'Total Deliveries': item.totalDeliveriesAssisted,
      'Cylinders': item.totalCylinders,
      'Other Items': item.totalOtherItems,
      'Total Items': item.totalItems,
      'Products': item.productsBreakdown,
      'Details': item.deliveriesDetail
    }));

    this.excelService.exportToExcel(
      excelData,
      `Helper_Delivery_Report_${this.startDate()}_to_${this.endDate()}`,
      'Helper Deliveries'
    );
  }

  getTotalDeliveries(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalDeliveriesAssisted, 0);
  }

  getTotalItems(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalItems, 0);
  }

  getTotalCash(): number {
    return 0; // Not available in model
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
