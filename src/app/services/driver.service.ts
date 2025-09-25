// driver.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Driver } from '../models/driver.model';
import { environment } from '../../environments/environment';

const DRIVERS_URL = `${environment.apiUrl}/drivers`;

@Injectable({ providedIn: 'root' })
export class DriverService {
  private http = inject(HttpClient);

  // GET → map API -> UI model
  getDrivers(): Observable<Driver[]> {
  return this.http.get<any[]>(DRIVERS_URL).pipe(
    map(rows => (rows || []).map(d => ({
      driverId: d.driverId,
      driverName: d.fullName,
      phone: d.contactNumber,
      licenseNo: d.licenseNo ?? '',
      jobType: d.jobType,
      isActive: d.isActive,
      createdAt: d.joiningDate ?? new Date().toISOString()
    } as Driver)))
  );
}


  // SAVE (create or update) → **POST** to your single SP endpoint
  saveDriver(editId: number | null, dto: Partial<Driver>): Observable<any> {
  const payload = {
    driverId: editId ?? 0,
    fullName: dto.driverName,
    contactNumber: dto.phone,
    licenseNo: dto.licenseNo,
    jobType: dto.jobType,         // ✅ important for DB CHECK
    isActive: dto.isActive ?? true
  };
  console.log('Payload to API:', payload);
  return this.http.post(DRIVERS_URL, payload);
}

  // soft delete (toggle inactive) — keep your existing endpoint
  softDeleteDriver(id: number): Observable<any> {
    return this.http.put(`${DRIVERS_URL}/${id}`, { isActive: false });
  }
}
