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
import { DailyOtherItemsStockReport } from '../../../models/reports.model';

@Component({
  selector: 'app-other-items-stock',
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
  templateUrl: './other-items-stock.component.html',
  styleUrl: './other-items-stock.component.scss'
})
export class OtherItemsStockComponent implements OnInit {
  reportDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyOtherItemsStockReport[]>([]);
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
    
    this.reportsService.getDailyOtherItemsStockReport(this.reportDate()).subscribe({
      next: (data: DailyOtherItemsStockReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading other items stock report:', error);
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
      'Product Name': item.productName,
      'Category': item.categoryName,
      'SubCategory': item.subCategoryName,
      'Current Stock': item.currentStock,
      'Daily Inward': item.dailyInward,
      'Daily Outward': item.dailyOutward,
      'Net Change': item.netChange
    }));

    this.excelService.exportToExcel(
      excelData,
      `Other_Items_Stock_Report_${this.reportDate()}`,
      'Other Items Stock'
    );
  }

  getTotalClosingStock(): number {
    return this.reportData().reduce((sum, item) => sum + item.currentStock, 0);
  }

  getTotalSold(): number {
    return this.reportData().reduce((sum, item) => sum + item.dailyOutward, 0);
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
