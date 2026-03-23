// src/app/services/dashboard.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummary } from '../models/dashboard-summary.model';
import { OpenDeliveryMonitoring } from '../models/open-delivery-monitoring.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`);
  }

  getTodayOpenDeliveries(): Observable<OpenDeliveryMonitoring[]> {
    return this.http.get<OpenDeliveryMonitoring[]>(`${environment.apiUrl}/dashboard/today-open-deliveries`);
  }
}
