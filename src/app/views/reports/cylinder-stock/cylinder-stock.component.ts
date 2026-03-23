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
import { DailyCylinderStockReport } from '../../../models/reports.model';

@Component({
  selector: 'app-cylinder-stock',
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
  templateUrl: './cylinder-stock.component.html',
  styleUrl: './cylinder-stock.component.scss'
})
export class CylinderStockComponent implements OnInit {
  reportDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyCylinderStockReport[]>([]);
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
    
    this.reportsService.getDailyCylinderStockReport(this.reportDate()).subscribe({
      next: (data: DailyCylinderStockReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading cylinder stock report:', error);
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
      'Filled': item.currentFilled,
      'Empty': item.currentEmpty,
      'Damaged': item.currentDamaged,
      'Total Stock': item.totalStock,
      'Filled Inward': item.dailyFilledInward,
      'Filled Outward': item.dailyFilledOutward,
      'Empty Inward': item.dailyEmptyInward,
      'Empty Outward': item.dailyEmptyOutward
    }));

    this.excelService.exportToExcel(
      excelData,
      `Cylinder_Stock_Report_${this.reportDate()}`,
      'Cylinder Stock'
    );
  }

  getTotalFilled(): number {
    return this.reportData().reduce((sum, item) => sum + item.currentFilled, 0);
  }

  getTotalEmpty(): number {
    return this.reportData().reduce((sum, item) => sum + item.currentEmpty, 0);
  }

  getTotalDamaged(): number {
    return this.reportData().reduce((sum, item) => sum + item.currentDamaged, 0);
  }

  getTotalClosingStock(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalStock, 0);
  }

  getTotalDelivered(): number {
    return this.reportData().reduce((sum, item) => sum + item.dailyFilledOutward, 0);
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
