// vehicle-assignment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VehicleAssignment } from '../models/vehicle-assignment.model';
import { environment } from '../../environments/environment';

const ASSIGN_URL = `${environment.apiUrl}/vehicle-assignments`;

@Injectable({ providedIn: 'root' })
export class VehicleAssignmentService {
  private http = inject(HttpClient);

  // ✅ GET all assignments (API already returns array of rows)
  getAssignments(): Observable<VehicleAssignment[]> {
    return this.http.get<any[]>(ASSIGN_URL).pipe(
      map(rows =>
        (rows || []).map(a => ({
          assignmentId: a.AssignmentId,
          vehicleId: a.VehicleId,
          vehicleNumber: a.VehicleNumber ?? '',
          driverId: a.DriverId,
          driverName: a.DriverName ?? '',
          assignedDate: a.AssignedDate,
          routeName: a.RouteName ?? '',
          shift: a.Shift ?? '',
          isActive: a.IsActive ?? true,
          createdAt: a.CreatedAt ?? new Date().toISOString()
        } as VehicleAssignment))
      )
    );
  }

  // ✅ GET by Id
  getById(id: number): Observable<VehicleAssignment | null> {
    return this.http.get<any[]>(`${ASSIGN_URL}/${id}`).pipe(
      map(rows => {
        if (!rows || rows.length === 0) return null;
        const a = rows[0];
        return {
          assignmentId: a.AssignmentId,
          vehicleId: a.VehicleId,
          vehicleNumber: a.VehicleNumber ?? '',
          driverId: a.DriverId,
          driverName: a.DriverName ?? '',
          assignedDate: a.AssignedDate,
          routeName: a.RouteName ?? '',
          shift: a.Shift ?? '',
          isActive: a.IsActive ?? true,
          createdAt: a.CreatedAt ?? new Date().toISOString()
        } as VehicleAssignment;
      })
    );
  }

  // ✅ SAVE (create or update)
  saveAssignment(editId: number | null, dto: Partial<VehicleAssignment>): Observable<{ success: number; message: string }> {
    const payload = {
      assignmentId: editId ?? 0,
      vehicleId: dto.vehicleId,
      driverId: dto.driverId,
      assignedDate: dto.assignedDate,
      routeName: dto.routeName ?? '',
      shift: dto.shift ?? '',
      isActive: dto.isActive ?? true
    };
    return this.http.post<{ success: number; message: string }>(ASSIGN_URL, payload);
  }

  // ✅ TOGGLE status (soft delete)
  softDeleteAssignment(id: number): Observable<{ success: number; message: string }> {
    return this.http.put<{ success: number; message: string }>(`${ASSIGN_URL}/${id}`, { isActive: false });
  }
}
