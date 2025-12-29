// src/app/services/daily-delivery.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DailyDelivery, DeliveryCloseRequest } from '../models/daily-delivery.model';
import { DailyDeliveryItemActual, UpdateItemActualsRequest, DeliveryWithItems, CloseDeliveryWithItemsRequest } from '../models/daily-delivery-item-actual.model';

const URL = `${environment.apiUrl}/dailydelivery`;

@Injectable({ providedIn: 'root' })
export class DailyDeliveryService {
  private http = inject(HttpClient);

  /* Create new daily delivery */
  create(payload: DailyDelivery): Observable<{ deliveryId: number }> {
    return this.http.post<{ deliveryId: number }>(URL, payload);
  }

  /* Get delivery by ID */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${URL}/${id}`);
  }

  /* List all deliveries (with optional filters) */
  list(params?: { fromDate?: string; toDate?: string; vehicleId?: number; status?: string }): Observable<any[]> {
    return this.http.get<any[]>(URL, { params: params as any });
  }

  /* Recompute metrics for a specific delivery */
  updateMetrics(id: number): Observable<any> {
    return this.http.put(`${URL}/${id}/metrics`, {});
  }

  /* Close delivery and recompute metrics */
  close(id: number, payload: DeliveryCloseRequest): Observable<any> {
    return this.http.put(`${URL}/${id}/close`, payload);
  }
  /* Get summary view data */
getSummary(params?: { fromDate?: string; toDate?: string; vehicleId?: number }): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/dailydelivery/summary`, { params: params as any });
}
updateActuals(id: number, data: any): Observable<any> {
  return this.http.put(`${environment.apiUrl}/dailydelivery/${id}/actuals`, data);
}

closeDelivery(id: number) {
  return this.http.put(`/api/dailydelivery/${id}/close`, {});
}

getDeliveryById(id: number) {
  return this.http.get<any>(`/api/dailydelivery/${id}`);
}
getDriversForVehicle(vehicleId: number) {
  return this.http.get<any>(`/api/dailydelivery/drivers-for-vehicle?vehicleId=${vehicleId}`);
}

/* Initialize item actuals for a delivery */
initializeItemActuals(deliveryId: number): Observable<{ success: number; message: string }> {
  return this.http.post<{ success: number; message: string }>(
    `${URL}/${deliveryId}/items/initialize`,
    {}
  );
}

/* Get item-level actuals for a delivery */
getItemActuals(deliveryId: number): Observable<DailyDeliveryItemActual[]> {
  return this.http.get<DailyDeliveryItemActual[]>(
    `${URL}/${deliveryId}/items/actuals`
  );
}

/* Update item-level actuals */
updateItemActuals(deliveryId: number, request: UpdateItemActualsRequest): Observable<{ success: number; message: string }> {
  return this.http.put<{ success: number; message: string }>(
    `${URL}/${deliveryId}/items/actuals`,
    request
  );
}

/* Get delivery with item actuals (combined) */
getDeliveryWithItems(deliveryId: number): Observable<DeliveryWithItems> {
  return this.http.get<DeliveryWithItems>(
    `${URL}/${deliveryId}/with-items`
  );
}

/* Close delivery with item verification */
closeDeliveryWithItems(deliveryId: number, request: CloseDeliveryWithItemsRequest): Observable<{ success: number; message: string }> {
  return this.http.put<{ success: number; message: string }>(
    `${URL}/${deliveryId}/close-with-items`,
    request
  );
}

}
