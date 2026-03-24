import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { ReportsService } from '../../../services/reports.service';
import { ExcelExportService } from '../../../services/excel-export.service';
import { PerformanceReport } from '../../../models/reports.model';
import { Chart, ChartConfiguration } from 'chart.js/auto';

@Component({
  selector: 'app-performance',
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
    IconDirective,
    ChartjsComponent
  ],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.scss'
})
export class PerformanceComponent implements OnInit, AfterViewInit {
  @ViewChild('deliveryChart') deliveryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('itemsChart') itemsChartRef!: ElementRef<HTMLCanvasElement>;
  
  startDate = signal<string>(this.getMonthStartDate());
  endDate = signal<string>(this.getTodayDate());
  personType = signal<string>('');
  reportData = signal<PerformanceReport[]>([]);
  isLoading = signal<boolean>(false);

  private deliveryChart?: Chart;
  private itemsChart?: Chart;

  constructor(
    private reportsService: ReportsService,
    private excelService: ExcelExportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  loadReport(): void {
    this.isLoading.set(true);
    
    this.reportsService.getPerformanceReport(
      this.startDate(),
      this.endDate(),
      this.personType() || undefined
    ).subscribe({
      next: (data: PerformanceReport[]) => {
        this.reportData.set(data);
        this.isLoading.set(false);
        
        // Wait for Angular to render the canvas elements before creating charts
        setTimeout(() => {
          this.updateCharts();
        }, 100);
      },
      error: (error: any) => {
        console.error('Error loading performance report:', error);
        this.isLoading.set(false);
        alert('Failed to load report. Please try again.');
      }
    });
  }

  onDateChange(): void {
    if (this.startDate() && this.endDate()) {
      this.loadReport();
    }
  }

  onFilterChange(): void {
    this.loadReport();
  }

  exportToExcel(): void {
    if (this.reportData().length === 0) {
      alert('No data to export');
      return;
    }

    const excelData = this.reportData().map(item => ({
      'Person ID': item.personId,
      'Type': item.personType,
      'Name': item.personName,
      'Total Deliveries': item.totalDeliveries,
      'Contributed Items': item.contributedItems,
      'Contributed Cash': item.contributedCash,
      'Avg Items/Delivery': item.avgItemsPerDelivery.toFixed(2),
      'Completion Rate': `${item.completionRate.toFixed(2)}%`
    }));

    this.excelService.exportToExcel(
      excelData,
      `Performance_Report_${this.startDate()}_to_${this.endDate()}`,
      'Performance'
    );
    
    // Check if canvas elements are available
    if (!this.deliveryChartRef || !this.itemsChartRef) {
      console.warn('Chart canvas elements not yet available');
      return;
    }
  }

  private updateCharts(): void {
    if (this.reportData().length === 0) return;

    // Sort by total deliveries for better visualization
    const sortedData = [...this.reportData()].sort((a, b) => b.totalDeliveries - a.totalDeliveries);
    const top10 = sortedData.slice(0, 10); // Show top 10 performers

    const labels = top10.map(item => `${item.personName} (${item.personType})`);
    const deliveries = top10.map(item => item.totalDeliveries);
    const items = top10.map(item => item.contributedItems);
    const cash = top10.map(item => item.contributedCash);

    // Delivery Chart
    this.createDeliveryChart(labels, deliveries, items);

    // Items & Cash Chart
    this.createItemsChart(labels, items, cash);
  }

  private createDeliveryChart(labels: string[], deliveries: number[], items: number[]): void {
    if (this.deliveryChart) {
      this.deliveryChart.destroy();
    }

    if (!this.deliveryChartRef) return;

    const ctx = this.deliveryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.deliveryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Deliveries',
            data: deliveries,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Contributed Items',
            data: items,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Top 10 Performers - Deliveries & Items'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private createItemsChart(labels: string[], items: number[], cash: number[]): void {
    if (this.itemsChart) {
      this.itemsChart.destroy();
    }

    if (!this.itemsChartRef) return;

    const ctx = this.itemsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.itemsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Contributed Items',
            data: items,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Cash Collected (₹)',
            data: cash,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Top 10 Performers - Items & Cash Collection'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Items'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Cash (₹)'
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
  }

  // Summary calculations
  getTotalDeliveries(): number {
    return this.reportData().reduce((sum, item) => sum + item.totalDeliveries, 0);
  }

  getTotalItems(): number {
    return this.reportData().reduce((sum, item) => sum + item.contributedItems, 0);
  }

  getTotalCash(): number {
    return this.reportData().reduce((sum, item) => sum + item.contributedCash, 0);
  }

  getAvgCompletionRate(): number {
    if (this.reportData().length === 0) return 0;
    const total = this.reportData().reduce((sum, item) => sum + item.completionRate, 0);
    return total / this.reportData().length;
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private getMonthStartDate(): string {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  }
}
