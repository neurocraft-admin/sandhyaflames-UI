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
import { DailyCashCollectionReport } from '../../../models/reports.model';

@Component({
  selector: 'app-cash-collection',
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
  templateUrl: './cash-collection.component.html',
  styleUrl: './cash-collection.component.scss'
})
export class CashCollectionComponent implements OnInit {
  startDate = signal<string>(this.getTodayDate());
  endDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyCashCollectionReport[]>([]);
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
    
    this.reportsService.getDailyCashCollectionReport(
      this.startDate(),
      this.endDate()
    ).subscribe({
      next: (data: DailyCashCollectionReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading cash collection report:', error);
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
      'Source': item.source,
      'Reference': item.reference,
      'Category': item.category,
      'Amount': item.amount,
      'Payment Mode': item.paymentMode,
      'Collection Time': item.collectionTime,
      'Collected By': item.collectedBy
    }));

    this.excelService.exportToExcel(
      excelData,
      `Cash_Collection_Report_${this.startDate()}_to_${this.endDate()}`,
      'Cash Collection'
    );
  }

  // Summary calculations
  getTotalAmount(): number {
    return this.reportData().reduce((sum, item) => sum + item.amount, 0);
  }

  getCashPaymentTotal(): number {
    return this.reportData()
      .filter(item => item.paymentMode === 'Cash')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  getOnlinePaymentTotal(): number {
    return this.reportData()
      .filter(item => item.paymentMode !== 'Cash')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
