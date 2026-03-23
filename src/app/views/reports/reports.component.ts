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
  NavComponent,
  NavItemComponent,
  NavLinkDirective,
  FormModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ReportsService } from '../../services/reports.service';
import {
  DailyDeliveryReport,
  DailyCashCollectionReport,
  DailyDriverDeliveryReport,
  DailyHelperDeliveryReport,
  DailyExpenseReport,
  DailyCylinderStockReport,
  DailyOtherItemsStockReport
} from '../../models/reports.model';

@Component({
  selector: 'app-reports',
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
    NavComponent,
    NavItemComponent,
    NavLinkDirective,
    FormModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  // Common date filter
  reportDate = signal<string>(this.getTodayDate());
  activeTab = signal<number>(0);

  // Report data signals
  deliveryReport = signal<DailyDeliveryReport[]>([]);
  cashCollectionReport = signal<DailyCashCollectionReport[]>([]);
  driverDeliveryReport = signal<DailyDriverDeliveryReport[]>([]);
  helperDeliveryReport = signal<DailyHelperDeliveryReport[]>([]);
  expenseReport = signal<DailyExpenseReport[]>([]);
  cylinderStockReport = signal<DailyCylinderStockReport[]>([]);
  otherItemsStockReport = signal<DailyOtherItemsStockReport[]>([]);

  // Loading states
  isLoading = signal<boolean>(false);

  // Filters
  deliveryStatusFilter = signal<string>('');
  driverIdFilter = signal<number | undefined>(undefined);
  vehicleIdFilter = signal<number | undefined>(undefined);
  helperIdFilter = signal<number | undefined>(undefined);
  categoryIdFilter = signal<number | undefined>(undefined);

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadActiveTabReport();
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onTabChange(tabIndex: number): void {
    this.activeTab.set(tabIndex);
    this.loadActiveTabReport();
  }

  onDateChange(): void {
    this.loadActiveTabReport();
  }

  loadActiveTabReport(): void {
    switch (this.activeTab()) {
      case 0:
        this.loadDeliveryReport();
        break;
      case 1:
        this.loadCashCollectionReport();
        break;
      case 2:
        this.loadDriverDeliveryReport();
        break;
      case 3:
        this.loadHelperDeliveryReport();
        break;
      case 4:
        this.loadExpenseReport();
        break;
      case 5:
        this.loadCylinderStockReport();
        break;
      case 6:
        this.loadOtherItemsStockReport();
        break;
    }
  }

  // =============================================
  // 1️⃣ Daily Delivery Report
  // =============================================
  loadDeliveryReport(): void {
    this.isLoading.set(true);
    this.reportsService
      .getDailyDeliveryReport(
        this.reportDate(),
        this.reportDate(),
        this.deliveryStatusFilter() || undefined,
        this.driverIdFilter(),
        this.vehicleIdFilter ()
      )
      .subscribe({
        next: (data) => {
          this.deliveryReport.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading delivery report:', err);
          this.isLoading.set(false);
        }
      });
  }

  getTotalDeliveries(): number {
    return this.deliveryReport().length;
  }

  getTotalDeliveryQuantity(): number {
    return this.deliveryReport().reduce((sum, item) => sum + item.totalQuantity, 0);
  }

  getTotalDeliveryCash(): number {
    return this.deliveryReport().reduce((sum, item) => sum + item.cashCollected, 0);
  }

  // =============================================
  // 2️⃣ Daily Cash Collection Report
  // =============================================
  loadCashCollectionReport(): void {
    this.isLoading.set(true);
    this.reportsService.getDailyCashCollectionReport(this.reportDate(), this.reportDate()).subscribe({
      next: (data) => {
        this.cashCollectionReport.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading cash collection report:', err);
        this.isLoading.set(false);
      }
    });
  }

  getTotalCashCollection(): number {
    return this.cashCollectionReport().reduce((sum, item) => sum + item.amount, 0);
  }

  getCashCollectionByMode(mode: string): number {
    return this.cashCollectionReport()
      .filter(item => item.paymentMode === mode)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  // =============================================
  // 3️⃣ Daily Driver Delivery Report
  // =============================================
  loadDriverDeliveryReport(): void {
    this.isLoading.set(true);
    this.reportsService
      .getDailyDriverDeliveryReport(this.reportDate(), this.reportDate(), this.driverIdFilter())
      .subscribe({
        next: (data) => {
          this.driverDeliveryReport.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading driver delivery report:', err);
          this.isLoading.set(false);
        }
      });
  }

  getTotalDriverDeliveries(): number {
    return this.driverDeliveryReport().reduce((sum, item) => sum + item.totalDeliveries, 0);
  }

  getTotalDriverItems(): number {
    return this.driverDeliveryReport().reduce((sum, item) => sum + item.totalItems, 0);
  }

  getTotalDriverCash(): number {
    return this.driverDeliveryReport().reduce((sum, item) => sum + item.totalCashCollected, 0);
  }

  // =============================================
  // 4️⃣ Daily Helper Delivery Report
  // =============================================
  loadHelperDeliveryReport(): void {
    this.isLoading.set(true);
    this.reportsService
      .getDailyHelperDeliveryReport(this.reportDate(), this.reportDate(), this.helperIdFilter())
      .subscribe({
        next: (data) => {
          this.helperDeliveryReport.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading helper delivery report:', err);
          this.isLoading.set(false);
        }
      });
  }

  getTotalHelperDeliveries(): number {
    return this.helperDeliveryReport().reduce((sum, item) => sum + item.totalDeliveriesAssisted, 0);
  }

  getTotalHelperItems(): number {
    return this.helperDeliveryReport().reduce((sum, item) => sum + item.totalItems, 0);
  }

  // =============================================
  // 5️⃣ Daily Expense Report
  // =============================================
  loadExpenseReport(): void {
    this.isLoading.set(true);
    this.reportsService
      .getDailyExpenseReport(this.reportDate(), this.reportDate(), this.categoryIdFilter())
      .subscribe({
        next: (data) => {
          this.expenseReport.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading expense report:', err);
          this.isLoading.set(false);
        }
      });
  }

  getTotalExpenses(): number {
    return this.expenseReport().reduce((sum, item) => sum + item.amount, 0);
  }

  getExpensesByMode(mode: string): number {
    return this.expenseReport()
      .filter(item => item.paymentMode === mode)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  // =============================================
  // 6️⃣ Daily Cylinder Stock Report
  // =============================================
  loadCylinderStockReport(): void {
    this.isLoading.set(true);
    this.reportsService.getDailyCylinderStockReport(this.reportDate()).subscribe({
      next: (data) => {
        this.cylinderStockReport.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading cylinder stock report:', err);
        this.isLoading.set(false);
      }
    });
  }

  getTotalCylinderStock(): number {
    return this.cylinderStockReport().reduce((sum, item) => sum + item.totalStock, 0);
  }

  getTotalFilledStock(): number {
    return this.cylinderStockReport().reduce((sum, item) => sum + item.currentFilled, 0);
  }

  getTotalEmptyStock(): number {
    return this.cylinderStockReport().reduce((sum, item) => sum + item.currentEmpty, 0);
  }

  getTotalDamagedStock(): number {
    return this.cylinderStockReport().reduce((sum, item) => sum + item.currentDamaged, 0);
  }

  // =============================================
  // 7️⃣ Daily Other Items Stock Report
  // =============================================
  loadOtherItemsStockReport(): void {
    this.isLoading.set(true);
    this.reportsService.getDailyOtherItemsStockReport(this.reportDate()).subscribe({
      next: (data) => {
        this.otherItemsStockReport.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading other items stock report:', err);
        this.isLoading.set(false);
      }
    });
  }

  getTotalOtherItemsStock(): number {
    return this.otherItemsStockReport().reduce((sum, item) => sum + item.currentStock, 0);
  }

  getTotalOtherItemsInward(): number {
    return this.otherItemsStockReport().reduce((sum, item) => sum + item.dailyInward, 0);
  }

  getTotalOtherItemsOutward(): number {
    return this.otherItemsStockReport().reduce((sum, item) => sum + item.dailyOutward, 0);
  }
}
