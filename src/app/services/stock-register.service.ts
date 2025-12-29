import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StockRegister, StockSummary, StockTransaction, StockAdjustmentRequest } from '../models/stock-register.model';

@Injectable({
  providedIn: 'root'
})
export class StockRegisterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stockregister`;

  /**
   * Get stock register with optional filters
   */
  getStockRegister(filters?: {
    productId?: number;
    categoryId?: number;
    subCategoryId?: number;
    searchTerm?: string;
  }): Observable<StockRegister[]> {
    let params = new HttpParams();
    
    if (filters?.productId) {
      params = params.set('productId', filters.productId.toString());
    }
    if (filters?.categoryId) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters?.subCategoryId) {
      params = params.set('subCategoryId', filters.subCategoryId.toString());
    }
    if (filters?.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }

    return this.http.get<StockRegister[]>(this.apiUrl, { params });
  }

  /**
   * Get consolidated stock summary
   */
  getStockSummary(groupBy: 'Product' | 'Category' | 'SubCategory' = 'Product'): Observable<StockSummary[]> {
    return this.http.get<StockSummary[]>(`${this.apiUrl}/summary`, {
      params: { groupBy }
    });
  }

  /**
   * Get stock transaction history
   */
  getTransactionHistory(filters?: {
    productId?: number;
    fromDate?: string;
    toDate?: string;
    transactionType?: string;
  }): Observable<StockTransaction[]> {
    let params = new HttpParams();
    
    if (filters?.productId) {
      params = params.set('productId', filters.productId.toString());
    }
    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }
    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }
    if (filters?.transactionType) {
      params = params.set('transactionType', filters.transactionType);
    }

    return this.http.get<StockTransaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  /**
   * Manually adjust stock
   */
  adjustStock(adjustment: StockAdjustmentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/adjust`, adjustment);
  }

  /**
   * Initialize stock register for all products
   */
  initializeStockRegister(): Observable<any> {
    return this.http.post(`${this.apiUrl}/initialize`, {});
  }
}
