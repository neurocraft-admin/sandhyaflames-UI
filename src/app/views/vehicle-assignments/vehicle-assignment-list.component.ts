import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VehicleAssignmentService } from '../../services/vehicle-assignment.service';
import { VehicleAssignment } from '../../models/vehicle-assignment.model';
import { ToastService } from '../../services/toast.service';
import { VehicleService } from '../../services/vehicle.service';
import { DriverService } from '../../services/driver.service';
import { Vehicle } from '../../models/vehicle.model';
import { Driver } from '../../models/driver.model';

@Component({
  selector: 'app-vehicle-assignment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-assignment-list.component.html'
})
export class VehicleAssignmentListComponent {
  private assignSvc = inject(VehicleAssignmentService);
  private fb = inject(FormBuilder);
  private toastSvc = inject(ToastService);
  private vehicleSvc = inject(VehicleService);
  private driverSvc = inject(DriverService);

  assignments: VehicleAssignment[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];

  isEditing = signal(false);
  editId: number | null = null;
  loading = signal(false);

  form = this.fb.group({
    vehicleId: [0, Validators.required],
    driverId: [0, Validators.required],
    assignedDate: ['', Validators.required],
    routeName: ['', Validators.required],
    shift: ['Morning', Validators.required],
    isActive: [true]
  });

  ngOnInit() {
    this.loadAssignments();
    this.loadVehicles();
    this.loadDrivers();
  }

  loadAssignments() {
    this.loading.set(true);
    this.assignSvc.getAssignments().subscribe({
      next: (rows) => (this.assignments = rows || []),
      error: () => this.toastSvc.error('Failed to load assignments'),
      complete: () => this.loading.set(false)
    });
  }

  loadVehicles() {
    this.vehicleSvc.getVehicles().subscribe({
      next: (rows) => (this.vehicles = rows),
      error: () => this.toastSvc.error('Failed to load vehicles')
    });
  }

  loadDrivers() {
    this.driverSvc.getDrivers().subscribe({
      next: (rows) => (this.drivers = rows),
      error: () => this.toastSvc.error('Failed to load drivers')
    });
  }

  startCreate() {
    this.isEditing.set(true);
    this.editId = null;
    this.form.reset({ shift: 'Morning', isActive: true });
  }

  startEdit(a: VehicleAssignment) {
    this.isEditing.set(true);
    this.editId = a.assignmentId;
    this.form.patchValue(a);
  }

  cancel() {
    this.isEditing.set(false);
    this.editId = null;
  }

  submit() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const dto: Partial<VehicleAssignment> = {
      assignmentId: this.editId ?? 0,
      vehicleId: raw.vehicleId ?? 0,
      driverId: raw.driverId ?? 0,
      assignedDate: raw.assignedDate ?? '',
      routeName: raw.routeName ?? '',
      shift: raw.shift ?? 'Morning',
      isActive: raw.isActive ?? true
    };

    this.assignSvc.saveAssignment(this.editId, dto).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.isEditing.set(false);
          this.editId = null;
          this.loadAssignments();
        } else {
          this.toastSvc.error(res?.message || 'Save failed');
        }
      },
      error: () => this.toastSvc.error('Error saving assignment'),
      complete: () => this.loading.set(false)
    });
  }

  softDelete(id: number) {
    if (!confirm('Mark this assignment inactive?')) return;
    this.assignSvc.softDeleteAssignment(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.loadAssignments();
        } else {
          this.toastSvc.error(res?.message || 'Delete failed');
        }
      },
      error: () => this.toastSvc.error('Error deleting assignment')
    });
  }
}
