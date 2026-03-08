// src/app/services/daily-delivery.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
    return this.http.get<any>(`${URL}/${id}`).pipe(
      map(response => {
        // Map PascalCase from API to camelCase for Angular
        if (response && typeof response === 'object') {
          const mapped: any = {};
          for (const key in response) {
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            mapped[camelKey] = response[key];
          }
          
          // Map Items array if present
          if (response.Items && Array.isArray(response.Items)) {
            mapped.items = response.Items.map((item: any) => {
              const mappedItem: any = {};
              for (const key in item) {
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                mappedItem[camelKey] = item[key];
              }
              return mappedItem;
            });
          }
          
          return mapped;
        }
        return response;
      })
    );
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

/* Validate credit mappings for delivery */
validateCreditMappings(deliveryId: number, productId?: number): Observable<any> {
  const params: Record<string, string> = {};
  if (productId) {
    params['productId'] = productId.toString();
  }
  return this.http.get<any>(
    `${URL}/${deliveryId}/validate-credit`,
    { params }
  );
}

// ===============================================================
// ✅ NEW METHODS FOR 5 ENHANCEMENTS
// ===============================================================

/* Update delivery (only if status is Open) */
update(id: number, payload: DailyDelivery): Observable<{ success: boolean; message: string }> {
  return this.http.put<{ success: boolean; message: string }>(`${URL}/${id}`, payload);
}

/* Delete delivery (only if status is Open) */
delete(id: number): Observable<{ success: boolean; message: string }> {
  return this.http.delete<{ success: boolean; message: string }>(`${URL}/${id}`);
}

/* Get all routes (for dropdown) */
getRoutes(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/delivery-routes`).pipe(
    map((rows: any[]) => (rows || []).map(r => ({
      routeId: r.RouteId,
      routeName: r.RouteName,
      description: r.Description,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    })))
  );
}

/* Get or create route (auto-insert) */
getOrCreateRoute(routeName: string): Observable<{ routeId: number; routeName: string }> {
  return this.http.post<{ routeId: number; routeName: string }>(
    `${environment.apiUrl}/delivery-routes/get-or-create`,
    { routeName }
  );
}

/* Save delivery charge with payment split */
saveDeliveryCharge(deliveryId: number, charge: any): Observable<any> {
  return this.http.post<any>(`${URL}/${deliveryId}/charge`, charge);
}

/* Get delivery charge with payment split */
getDeliveryCharge(deliveryId: number): Observable<any> {
  return this.http.get<any>(`${URL}/${deliveryId}/charge`);
}

/* Get available drivers (not locked by open deliveries) */
getAvailableDrivers(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/drivers/available`).pipe(
    map((rows: any[]) => (rows || []).map(d => ({
      driverId: d.DriverId,
      driverName: d.FullName,
      phone: d.ContactNumber,
      jobType: d.JobType,
      isActive: d.IsActive
    })))
  );
}

/* Get available vehicles (not locked by open deliveries) */
getAvailableVehicles(): Observable<any[]> {
  return this.http.get<any[]>(`${environment.apiUrl}/vehicles/available`).pipe(
    map((rows: any[]) => (rows || []).map(v => ({
      vehicleId: v.VehicleId,
      vehicleNumber: v.VehicleNumber,
      make: v.Make,
      model: v.Model,
      isActive: v.IsActive
    })))
  );
}

}
