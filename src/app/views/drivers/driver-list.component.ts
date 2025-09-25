import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DriverService } from '../../services/driver.service';
import { Driver, DriverUpsertDto } from '../../models/driver.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './driver-list.component.html'
})
export class DriverListComponent {
  private driverSvc = inject(DriverService);
  private fb = inject(FormBuilder);
  private toastSvc = inject(ToastService);

  drivers: Driver[] = [];
  isEditing = signal(false);
  editId: number | null = null;
  loading = signal(false);

  form = this.fb.group({
  driverName: ['', Validators.required],
  phone: ['', Validators.required],
  licenseNo: ['', Validators.required],
  jobType: ['Driver', Validators.required],   // ✅ add jobType
  isActive: [true]
});


  ngOnInit() {
    this.loadDrivers();
  }

  loadDrivers() {
    this.loading.set(true);
    this.driverSvc.getDrivers().subscribe({
      next: (rows) => (this.drivers = rows || []),
      error: () => this.toastSvc.error('Failed to load drivers'),
      complete: () => this.loading.set(false)
    });
  }

  startCreate() {
    this.isEditing.set(true);
    this.editId = null;
    this.form.reset({ isActive: true });
  }

  startEdit(d: Driver) {
    this.isEditing.set(true);
    this.editId = d.driverId;
    this.form.patchValue(d);
  }

  cancel() {
    this.isEditing.set(false);
    this.editId = null;
  }

  submit() {
  if (this.form.invalid) return;

  const raw = this.form.getRawValue();
  const dto: Partial<Driver> = {
    driverId: this.editId ?? 0,
    driverName: raw.driverName ?? '',
    phone: raw.phone ?? '',
    licenseNo: raw.licenseNo ?? '',
    jobType: raw.jobType ?? 'Driver',
    isActive: raw.isActive ?? true
  };

  this.driverSvc.saveDriver(this.editId, dto).subscribe({
    next: (res: any) => {
      if (res?.success) {
        this.toastSvc.success(res.message);
        this.isEditing.set(false);
        this.editId = null;
        this.loadDrivers();
      } else {
        this.toastSvc.error(res?.message || 'Save failed');
      }
    },
    error: () => this.toastSvc.error('Error saving driver'),
    complete: () => this.loading.set(false)
  });
}


  softDelete(id: number) {
    if (!confirm('Mark this driver inactive?')) return;
    this.driverSvc.softDeleteDriver(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.loadDrivers();
        } else {
          this.toastSvc.error(res?.message || 'Delete failed');
        }
      },
      error: () => this.toastSvc.error('Error deleting driver')
    });
  }
}
