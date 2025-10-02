import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DailyDelivery, DeliveryCloseRequest } from '../models/daily-delivery.model';

const URL = `${environment.apiUrl}/dailydelivery`;

@Injectable({ providedIn: 'root' })
export class DailyDeliveryService {
  private http = inject(HttpClient);

  create(payload: DailyDelivery): Observable<{ deliveryId: number }> {
    return this.http.post<{ deliveryId: number }>(URL, payload);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${URL}/${id}`);
  }

  update(id: number, payload: DailyDelivery): Observable<any> {
    return this.http.put(`${URL}/${id}`, payload);
  }

  close(id: number, payload: DeliveryCloseRequest): Observable<any> {
    return this.http.put(`${URL}/${id}/close`, payload);
  }
}