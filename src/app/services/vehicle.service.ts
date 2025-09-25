import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Vehicle } from '../models/vehicle.model';
import { environment } from '../../environments/environment';

const VEHICLES_URL = `${environment.apiUrl}/vehicles`;

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private http = inject(HttpClient);

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<any[]>(VEHICLES_URL).pipe(
      map(rows => (rows || []).map(v => ({
        vehicleId: v.vehicleId,
        vehicleNumber: v.vehicleNumber,
        make: v.make,
        model: v.model,
        purchaseDate: v.purchaseDate,
        isActive: v.isActive
      } as Vehicle)))
    );
  }

  saveVehicle(editId: number | null, dto: Partial<Vehicle>): Observable<any> {
    const payload = {
      vehicleId: editId ?? 0,
      vehicleNumber: dto.vehicleNumber,
      make: dto.make,
      model: dto.model,
      purchaseDate: dto.purchaseDate,
      isActive: dto.isActive ?? true
    };
    return this.http.post(VEHICLES_URL, payload);
  }

  deactivateVehicle(id: number): Observable<any> {
    return this.http.delete(`${VEHICLES_URL}/${id}`);
  }
}
