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
import { IncomeExpenseService } from '../../../services/income-expense.service';
import { DailyExpenseReport } from '../../../models/reports.model';

@Component({
  selector: 'app-expense',
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
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent implements OnInit {
  startDate = signal<string>(this.getMonthStartDate());
  endDate = signal<string>(this.getTodayDate());
  selectedCategory = signal<number | undefined>(undefined);
  reportData = signal<DailyExpenseReport[]>([]);
  isLoading = signal<boolean>(false);
  categories = signal<any[]>([]);
  Math = Math;  // Make Math available in template

  constructor(
    private reportsService: ReportsService,
    private excelService: ExcelExportService,
    private incomeExpenseService: IncomeExpenseService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadReport();
  }

  loadCategories(): void {
    // Load both Income and Expense categories
    this.incomeExpenseService.getCategories('').subscribe({
      next: (data: any[]) => {
        this.categories.set(data);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadReport(): void {
    this.isLoading.set(true);
    
    this.reportsService.getDailyExpenseReport(
      this.startDate(),
      this.endDate(),
      this.selectedCategory()
    ).subscribe({
      next: (data: DailyExpenseReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading expense report:', error);
        this.isLoading.set(false);
        alert('Failed to load report. Please try again.');
      }
    });
  }

  onDateChange(): void {
    this.loadReport();
  }

  onCategoryChange(): void {
    this.loadReport();
  }

  exportToExcel(): void {
    if (this.reportData().length === 0) {
      alert('No data to export');
      return;
    }

    const excelData = this.reportData().map(item => ({
      'Entry ID': item.entryId,
      'Date': new Date(item.entryDate).toLocaleDateString(),
      'Type': item.type,
      'Category': item.categoryName,
      'Amount': item.amount,
      'Payment Mode': item.paymentMode,
      'Remarks': item.remarks || '-',
      'Created By': item.createdBy,
      'Linked Reference': item.linkedReference || '-'
    }));

    this.excelService.exportToExcel(
      excelData,
      `Income_Expense_Report_${this.startDate()}_to_${this.endDate()}`,
      'Income Expense'
    );
  }

  getTotalIncome(): number {
    return this.reportData()
      .filter(item => item.type === 'Income')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  getTotalExpenses(): number {
    return this.reportData()
      .filter(item => item.type === 'Expense')
      .reduce((sum, item) => sum + item.amount, 0);
  }

  getExpensesByCategory(): Map<string, number> {
    const categoryMap = new Map<string, number>();
    this.reportData().forEach(item => {
      const current = categoryMap.get(item.categoryName) || 0;
      categoryMap.set(item.categoryName, current + item.amount);
    });
    return categoryMap;
  }

  getCategoryArray(): {category: string, amount: number}[] {
    const map = this.getExpensesByCategory();
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
  }

  private getMonthStartDate(): string {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
