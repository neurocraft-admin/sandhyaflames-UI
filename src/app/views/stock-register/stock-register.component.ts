import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockRegisterService } from '../../services/stock-register.service';
import { ToastService } from '../../services/toast.service';
import { StockRegister, StockSummary } from '../../models/stock-register.model';

@Component({
  selector: 'app-stock-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './stock-register.component.html',
  styleUrls: ['./stock-register.component.scss']
})
export class StockRegisterComponent implements OnInit {
  private stockService = inject(StockRegisterService);
  private toast = inject(ToastService);

  stockItems = signal<StockRegister[]>([]);
  filteredItems = signal<StockRegister[]>([]);
  summaryData = signal<StockSummary[]>([]);
  
  loading = signal<boolean>(false);
  showSummary = signal<boolean>(false);
  
  // Filter options
  searchTerm: string = '';
  groupByOption: 'Product' | 'Category' | 'SubCategory' = 'Product';

  ngOnInit(): void {
    this.loadStockRegister();
  }
console = console;
  loadStockRegister(): void {
    this.loading.set(true);
    this.showSummary.set(false);
    
    this.stockService.getStockRegister({ searchTerm: this.searchTerm || undefined }).subscribe({
      next: (data) => {
      console.log('🔍 API Response:', data); // ADD THIS
      console.log('🔍 First Item:', data[0]); // ADD THIS
        this.stockItems.set(data);
        this.filteredItems.set(data);
        this.loading.set(false);
      },
      error: (error) => {
      console.error('❌ API Error:', error); // ADD THIS
        this.toast.error(error.error?.message || 'Failed to load stock register');
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.loading.set(true);
    this.showSummary.set(true);
    
    this.stockService.getStockSummary(this.groupByOption).subscribe({
      next: (data) => {
        this.summaryData.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.toast.error(error.error?.message || 'Failed to load summary');
        this.loading.set(false);
      }
    });
  }

  applySearch(): void {
    if (this.searchTerm.trim()) {
      this.loadStockRegister();
    } else {
      this.filteredItems.set(this.stockItems());
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredItems.set(this.stockItems());
  }

  toggleView(viewType: 'detailed' | 'summary'): void {
    if (viewType === 'summary') {
      this.loadSummary();
    } else {
      this.showSummary.set(false);
      if (this.stockItems().length === 0) {
        this.loadStockRegister();
      }
    }
  }

  getStockStatusClass(item: StockRegister): string {
    const totalFilled = item.filledStock;
    if (totalFilled === 0) return 'text-danger fw-bold';
    if (totalFilled < 50) return 'text-warning fw-bold';
    return 'text-success';
  }

  getTotalFilledStock(): number {
    return this.filteredItems().reduce((sum, item) => sum + item.filledStock, 0);
  }

  getTotalEmptyStock(): number {
    return this.filteredItems().reduce((sum, item) => sum + item.emptyStock, 0);
  }

  getTotalDamagedStock(): number {
    return this.filteredItems().reduce((sum, item) => sum + item.damagedStock, 0);
  }

  getTotalStock(): number {
    return this.filteredItems().reduce((sum, item) => sum + item.totalStock, 0);
  }

  refreshData(): void {
    this.searchTerm = '';
    this.loadStockRegister();
    this.toast.success('Stock data refreshed');
  }
}
