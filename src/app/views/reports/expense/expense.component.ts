import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
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
import { DailyExpenseReport, IncomeExpensePaymentSummary, IncomeExpenseDailyTrend, IncomeExpenseCategorySummary } from '../../../models/reports.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

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
  @ViewChild('paymentModeChart') paymentModeChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyTrendChart') dailyTrendChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef?: ElementRef<HTMLCanvasElement>;

  startDate = signal<string>(this.getMonthStartDate());
  endDate = signal<string>(this.getTodayDate());
  selectedCategory = signal<number | undefined>(undefined);
  reportData = signal<DailyExpenseReport[]>([]);
  paymentSummary = signal<IncomeExpensePaymentSummary[]>([]);
  dailyTrend = signal<IncomeExpenseDailyTrend[]>([]);
  categorySummary = signal<IncomeExpenseCategorySummary[]>([]);
  isLoading = signal<boolean>(false);
  categories = signal<any[]>([]);
  Math = Math;  // Make Math available in template

  private paymentModeChart?: Chart;
  private dailyTrendChart?: Chart;
  private categoryChart?: Chart;

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
    // Load both Income and Expense categories (pass null for type to get all)
    this.incomeExpenseService.getCategories('', '').subscribe({
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
    
    // Load all data sources in parallel
    forkJoin({
      expenses: this.reportsService.getDailyExpenseReport(
        this.startDate(),
        this.endDate(),
        this.selectedCategory()
      ),
      paymentSummary: this.reportsService.getIncomeExpensePaymentSummary(
        this.startDate(),
        this.endDate(),
        this.selectedCategory()
      ),
      dailyTrend: this.reportsService.getIncomeExpenseDailyTrend(
        this.startDate(),
        this.endDate(),
        this.selectedCategory()
      ),
      categorySummary: this.reportsService.getIncomeExpenseCategorySummary(
        this.startDate(),
        this.endDate()
      )
    }).subscribe({
      next: (data) => {
        this.reportData.set(data.expenses);
        this.paymentSummary.set(data.paymentSummary);
        this.dailyTrend.set(data.dailyTrend);
        this.categorySummary.set(data.categorySummary);
        this.isLoading.set(false);
        
        // Wait for Angular to render the canvas elements before creating charts
        setTimeout(() => {
          this.updateCharts();
        }, 100);
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

  private updateCharts(): void {
    // Check if canvas elements are available before creating charts
    if (!this.paymentModeChartRef || !this.dailyTrendChartRef || !this.categoryChartRef) {
      console.warn('Chart canvas elements not yet available');
      return;
    }

    this.createPaymentModeChart();
    this.createDailyTrendChart();
    this.createCategoryChart();
  }

  private createPaymentModeChart(): void {
    if (!this.paymentModeChartRef || this.paymentSummary().length === 0) return;

    // Destroy existing chart if it exists
    if (this.paymentModeChart) {
      this.paymentModeChart.destroy();
    }

    const ctx = this.paymentModeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.paymentSummary();
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.paymentMode),
        datasets: [{
          label: 'Income',
          data: data.map(d => d.incomeAmount),
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 206, 86, 0.7)'
          ],
          borderWidth: 2
        }, {
          label: 'Expense',
          data: data.map(d => d.expenseAmount),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(201, 203, 207, 0.7)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed as number;
                return `${label}: ₹${value.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    };

    this.paymentModeChart = new Chart(ctx, config);
  }

  private createDailyTrendChart(): void {
    if (!this.dailyTrendChartRef || this.dailyTrend().length === 0) return;

    if (this.dailyTrendChart) {
      this.dailyTrendChart.destroy();
    }

    const ctx = this.dailyTrendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dailyTrend();
    const labels = data.map(d => {
      const date = new Date(d.entryDate);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: data.map(d => d.incomeAmount),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
          },
          {
            label: 'Expense',
            data: data.map(d => d.expenseAmount),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '₹' + (value as number).toLocaleString('en-IN')
            },
            title: {
              display: true,
              text: 'Amount (₹)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ₹${value.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    };

    this.dailyTrendChart = new Chart(ctx, config);
  }

  private createCategoryChart(): void {
    if (!this.categoryChartRef || this.categorySummary().length === 0) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.categorySummary();
    const incomeData = data.filter(d => d.type === 'Income');
    const expenseData = data.filter(d => d.type === 'Expense');

    // Get unique categories
    const categories = Array.from(new Set([
      ...incomeData.map(d => d.categoryName),
      ...expenseData.map(d => d.categoryName)
    ]));

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Income',
            data: categories.map(cat => {
              const item = incomeData.find(d => d.categoryName === cat);
              return item ? item.totalAmount : 0;
            }),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
          },
          {
            label: 'Expense',
            data: categories.map(cat => {
              const item = expenseData.find(d => d.categoryName === cat);
              return item ? item.totalAmount : 0;
            }),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '₹' + (value as number).toLocaleString('en-IN')
            },
            title: {
              display: true,
              text: 'Amount (₹)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ₹${value.toLocaleString('en-IN')}`;
              }
            }
          }
        },
        indexAxis: 'y'
      }
    };

    this.categoryChart = new Chart(ctx, config);
  }
}
