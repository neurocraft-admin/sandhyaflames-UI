import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DailyDeliveryReport,
  DailyCashCollectionReport,
  DailyDriverDeliveryReport,
  DailyHelperDeliveryReport,
  DailyExpenseReport,
  DailyCylinderStockReport,
  DailyOtherItemsStockReport,
  PerformanceReport
} from '../models/reports.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  // =============================================
  // 1️⃣ Daily Delivery Report
  // =============================================
  getDailyDeliveryReport(
    startDate: string,
    endDate: string,
    status?: string,
    driverId?: number,
    vehicleId?: number
  ): Observable<DailyDeliveryReport[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    if (status) params = params.set('status', status);
    if (driverId) params = params.set('driverId', driverId.toString());
    if (vehicleId) params = params.set('vehicleId', vehicleId.toString());

    return this.http.get<DailyDeliveryReport[]>(`${this.apiUrl}/daily-delivery`, { params });
  }

  // =============================================
  // 2️⃣ Daily Cash Collection Report
  // =============================================
  getDailyCashCollectionReport(startDate: string, endDate: string): Observable<DailyCashCollectionReport[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<DailyCashCollectionReport[]>(`${this.apiUrl}/daily-cash-collection`, { params });
  }

  // =============================================
  // 3️⃣ Daily Driver Delivery Report
  // =============================================
  getDailyDriverDeliveryReport(startDate: string, endDate: string, driverId?: number): Observable<DailyDriverDeliveryReport[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    if (driverId) params = params.set('driverId', driverId.toString());

    return this.http.get<DailyDriverDeliveryReport[]>(`${this.apiUrl}/daily-driver-delivery`, { params });
  }

  // =============================================
  // 4️⃣ Daily Helper Delivery Report
  // =============================================
  getDailyHelperDeliveryReport(startDate: string, endDate: string, helperId?: number): Observable<DailyHelperDeliveryReport[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    if (helperId) params = params.set('helperId', helperId.toString());

    return this.http.get<DailyHelperDeliveryReport[]>(`${this.apiUrl}/daily-helper-delivery`, { params });
  }

  // =============================================
  // 5️⃣ Daily Expense Report
  // =============================================
  getDailyExpenseReport(startDate: string, endDate: string, categoryId?: number): Observable<DailyExpenseReport[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    if (categoryId) params = params.set('categoryId', categoryId.toString());

    return this.http.get<DailyExpenseReport[]>(`${this.apiUrl}/daily-expense`, { params });
  }

  // =============================================
  // 6️⃣ Daily Cylinder Stock Report
  // =============================================
  getDailyCylinderStockReport(date: string): Observable<DailyCylinderStockReport[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DailyCylinderStockReport[]>(`${this.apiUrl}/daily-cylinder-stock`, { params });
  }

  // =============================================
  // 7️⃣ Daily Other Items Stock Report
  // =============================================
  getDailyOtherItemsStockReport(date: string): Observable<DailyOtherItemsStockReport[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DailyOtherItemsStockReport[]>(`${this.apiUrl}/daily-other-items-stock`, { params });
  }

  // =============================================
  // 8️⃣ Performance Report (Drivers & Helpers)
  // =============================================
  getPerformanceReport(
    startDate: string,
    endDate: string,
    personType?: string,
    personId?: number
  ): Observable<PerformanceReport[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    if (personType) params = params.set('personType', personType);
    if (personId) params = params.set('personId', personId.toString());

    return this.http.get<PerformanceReport[]>(`${this.apiUrl}/performance`, { params });
  }
}
