import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Vehicle } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../services/toast.service';
import { ButtonDirective } from '@coreui/angular';   // CoreUI button

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  templateUrl: './vehicle-list.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonDirective
  ]
})
export class VehicleListComponent {
  private fb = inject(FormBuilder);
  private vehicleSvc = inject(VehicleService);
  private toastSvc = inject(ToastService);

  vehicles = signal<Vehicle[]>([]);
  loading = signal(false);
  isEditing = signal(false);
  editId: number | null = null;

  form = this.fb.group({
    vehicleNumber: ['', Validators.required],
    make: ['', Validators.required],
    model: ['', Validators.required],
    purchaseDate: ['', Validators.required],
    isActive: [true]
  });

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.vehicleSvc.getVehicles().subscribe(data => this.vehicles.set(data));
  }

  startAdd() {
    this.form.reset({ isActive: true });
    this.isEditing.set(true);
    this.editId = null;
  }

  startEdit(v: Vehicle) {
    this.form.patchValue(v);
    this.isEditing.set(true);
    this.editId = v.vehicleId;
  }

  submit() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const dto: Partial<Vehicle> = {
      vehicleId: this.editId ?? 0,
      vehicleNumber: raw.vehicleNumber ?? '',
      make: raw.make ?? '',
      model: raw.model ?? '',
      purchaseDate: raw.purchaseDate ?? new Date().toISOString(),
      isActive: raw.isActive ?? true
    };

    this.loading.set(true);
    this.vehicleSvc.saveVehicle(this.editId, dto).subscribe({
      next: (res: any) => {
        if (res?.message) this.toastSvc.success(res.message);
        this.isEditing.set(false);
        this.editId = null;
        this.loadVehicles();
      },
      error: () => this.toastSvc.error('Error saving vehicle'),
      complete: () => this.loading.set(false)
    });
  }

  deactivate(id: number) {
    if (!confirm('Are you sure you want to deactivate this vehicle?')) return;
    this.vehicleSvc.deactivateVehicle(id).subscribe({
      next: (res: any) => {
        if (res?.message) this.toastSvc.success(res.message);
        this.loadVehicles();
      },
      error: () => this.toastSvc.error('Error deactivating vehicle')
    });
  }
}
