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
import { DailyCashCollectionReport, PaymentModeSummary, DailyCollectionTrend } from '../../../models/reports.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

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
  @ViewChild('paymentModeChart') paymentModeChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef?: ElementRef<HTMLCanvasElement>;

  startDate = signal<string>(this.getTodayDate());
  endDate = signal<string>(this.getTodayDate());
  reportData = signal<DailyCashCollectionReport[]>([]);
  paymentModeSummary = signal<PaymentModeSummary[]>([]);
  dailyTrend = signal<DailyCollectionTrend[]>([]);
  isLoading = signal<boolean>(false);

  private paymentModeChart?: Chart;
  private trendChart?: Chart;

  constructor(
    private reportsService: ReportsService,
    private excelService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    
    // Load all three data sources in parallel
    forkJoin({
      collections: this.reportsService.getDailyCashCollectionReport(this.startDate(), this.endDate()),
      paymentSummary: this.reportsService.getPaymentModeSummary(this.startDate(), this.endDate()),
      dailyTrend: this.reportsService.getDailyCollectionTrend(this.startDate(), this.endDate())
    }).subscribe({
      next: (data) => {
        this.reportData.set(data.collections);
        this.paymentModeSummary.set(data.paymentSummary);
        this.dailyTrend.set(data.dailyTrend);
        this.isLoading.set(false);
        
        // Wait for Angular to render the canvas elements before creating charts
        setTimeout(() => {
          this.updateCharts();
        }, 100);
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

  private updateCharts(): void {
    // Check if canvas elements are available before creating charts
    if (!this.paymentModeChartRef || !this.trendChartRef) {
      console.warn('Chart canvas elements not yet available');
      return;
    }

    this.createPaymentModeChart();
    this.createTrendChart();
  }

  private createPaymentModeChart(): void {
    if (!this.paymentModeChartRef || this.paymentModeSummary().length === 0) return;

    // Destroy existing chart if it exists
    if (this.paymentModeChart) {
      this.paymentModeChart.destroy();
    }

    const ctx = this.paymentModeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.paymentModeSummary();
    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: data.map(d => d.paymentMode),
        datasets: [{
          data: data.map(d => d.totalAmount),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',   // Cash - Blue
            'rgba(255, 206, 86, 0.8)',   // UPI - Yellow
            'rgba(75, 192, 192, 0.8)',   // Card - Teal
            'rgba(153, 102, 255, 0.8)',  // Bank - Purple
            'rgba(255, 159, 64, 0.8)'    // Other - Orange
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 12
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets.length) {
                  const bgColors = data.datasets[0].backgroundColor;
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i] as number;
                    let bgColor = 'rgba(54, 162, 235, 0.8)'; // Default color
                    if (Array.isArray(bgColors) && bgColors[i]) {
                      bgColor = bgColors[i] as string;
                    } else if (typeof bgColors === 'string') {
                      bgColor = bgColors;
                    }
                    return {
                      text: `${label}: ₹${value.toLocaleString('en-IN')}`,
                      fillStyle: bgColor,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.paymentModeChart = new Chart(ctx, config);
  }

  private createTrendChart(): void {
    if (!this.trendChartRef || this.dailyTrend().length === 0) return;

    // Destroy existing chart if it exists
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dailyTrend();
    const labels = data.map(d => {
      const date = new Date(d.collectionDate);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Delivery Collections',
            data: data.map(d => d.deliveryAmount),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2
          },
          {
            label: 'Income Entries',
            data: data.map(d => d.incomeAmount),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return '₹' + (value as number).toLocaleString('en-IN');
              }
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
              },
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                return `Total: ₹${total.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    };

    this.trendChart = new Chart(ctx, config);
  }
}
