// src/app/views/daily-delivery/daily-delivery.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ProductDropdownService, ProductOption } from '../../services/product-dropdown.service';
import { DriverService } from '../../services/driver.service';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../services/toast.service';
import { DeliveryCloseRequest } from '../../models/daily-delivery.model';
import { Vehicle } from '../../models/vehicle.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-daily-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './daily-delivery.component.html'
})

export class DailyDeliveryComponent {
  private fb = inject(FormBuilder);
  private svc = inject(DailyDeliveryService);
  private productSvc = inject(ProductDropdownService);
  private driverSvc = inject(DriverService);
  private vehicleSvc = inject(VehicleService);
  private toast = inject(ToastService);

  assignedDriverName: string = '';
  assignedDriverId: number | null = null;
  assignedVehicleNumber: string = '';
  assignedVehicleId: number | null = null;

  products: ProductOption[] = [];
  drivers: any[] = [];
  vehicles: Vehicle[] = [];
  deliveries: any[] = [];
  isEditing = signal(true);

  form = this.fb.group({
    deliveryDate: [this.today(), Validators.required],
    driverId: [0, Validators.required],
    vehicleId: [0, Validators.required],
    startTime: ['08:00:00', Validators.required],
    returnTime: [null],
    remarks: [''],
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit() {
  console.log('✅ DailyDeliveryComponent initialized');
    this.productSvc.getAll().subscribe(p => this.products = p || []);
  console.log('✅ ngOnInit fired');
  this.driverSvc.getDeliveryDrivers().subscribe({
    next: d => {
      console.log('Driver API result:', d);
      this.drivers = d;
    },
    error: e => console.error('Driver load error', e)
  });
    this.addItemRow();
    this.loadDeliveries(); // Load existing list
  }
  loadDriversForVehicle(vehicleId: number) {
      this.svc.getDriversForVehicle(vehicleId).subscribe(res => {
        this.assignedDriverId = res.assignedDriverId;
        this.assignedDriverName = res.assignedDriverName;
        this.drivers = res.drivers;
        this.form.patchValue({ driverId: 0 }); // default: blank/optional
      });
    }

  /* Form row controls */
  addItemRow() {
  const group = this.fb.group({
    productId: [0, Validators.required],
    noOfCylinders: [0],
    noOfInvoices: [1, [Validators.required, Validators.min(1)]],
    noOfDeliveries: [1, [Validators.required, Validators.min(1)]],
    noOfItems: [0]
  });

  this.items.push(group);
}
// ✅ New lightweight safe wrapper
onProductSelect(item: AbstractControl, event: Event) {
  const itemGroup = item as FormGroup;  // 👈 Safely cast inside TypeScript
  const select = event.target as HTMLSelectElement;
  const productId = Number(select.value);

  if (!productId || productId === 0) return;

  const product = this.products.find(p => p.productId === productId) || null;
  this.onProductChange(itemGroup, product);
}
// ✅ Called when product selection changes
// onProductChange(itemGroup: FormGroup, product: any) {
//   if (!product) return;

//   const name = (product.categoryName || product.productName || '').toLowerCase();
//   const isCylinder = name.includes('cylinder');

//   if (isCylinder) {
//     // 🔹 Cylinder product logic
//     itemGroup.patchValue({
//       noOfCylinders: itemGroup.value.noOfCylinders || 1,
//       noOfItems: 0
//     });

//     // Apply correct validators
//     itemGroup.get('noOfCylinders')?.setValidators([Validators.required, Validators.min(1)]);
//     itemGroup.get('noOfItems')?.clearValidators();
//   } else {
//     // 🔹 Non-cylinder product logic
//     itemGroup.patchValue({
//       noOfCylinders: 0,
//       noOfItems: itemGroup.value.noOfItems || 1
//     });

//     // Apply correct validators
//     itemGroup.get('noOfItems')?.setValidators([Validators.required, Validators.min(1)]);
//     itemGroup.get('noOfCylinders')?.clearValidators();
//   }

//   // Force Angular to re-evaluate validity
//   itemGroup.get('noOfCylinders')?.updateValueAndValidity();
//   itemGroup.get('noOfItems')?.updateValueAndValidity();
// }
// ✅ Keep your existing onProductChange(), but make it optional-safe
onProductChange(itemGroup: FormGroup, product?: any) {
  if (!product) return;

  const name = (product.categoryName || product.productName || '').toLowerCase();
  const isCylinder = name.includes('cylinder');

  if (isCylinder) {
    // 🔹 Cylinder logic
    itemGroup.patchValue({
      noOfCylinders: itemGroup.value.noOfCylinders || 1,
      noOfItems: 0
    });
    itemGroup.get('noOfCylinders')?.setValidators([Validators.required, Validators.min(1)]);
    itemGroup.get('noOfItems')?.clearValidators();
  } else {
    // 🔹 Non-cylinder logic
    itemGroup.patchValue({
      noOfCylinders: 0,
      noOfItems: itemGroup.value.noOfItems || 1
    });
    itemGroup.get('noOfItems')?.setValidators([Validators.required, Validators.min(1)]);
    itemGroup.get('noOfCylinders')?.clearValidators();
  }

  // ✅ Re-evaluate validity after updates
  itemGroup.get('noOfCylinders')?.updateValueAndValidity();
  itemGroup.get('noOfItems')?.updateValueAndValidity();
}
  

  onDriverChange() {
    const driverId = this.form.get('driverId')?.value;
    if (!driverId || driverId === 0) {
      this.vehicles = [];
      this.assignedVehicleNumber = '';
      this.assignedVehicleId = null;
      this.form.patchValue({ vehicleId: 0 });
      return;
    }

    // First, get the assigned vehicle for this driver
    this.driverSvc.getVehicleByDriver(driverId).subscribe({
      next: (res) => {
        if (res) {
          this.assignedVehicleNumber = res.vehicleNo;
          this.assignedVehicleId = res.vehicleId;
          // Set the assigned vehicle as default
          this.form.patchValue({ vehicleId: res.vehicleId });
        } else {
          this.assignedVehicleNumber = '';
          this.assignedVehicleId = null;
          this.form.patchValue({ vehicleId: 0 });
        }
      },
      error: () => {
        this.assignedVehicleNumber = '';
        this.assignedVehicleId = null;
        this.form.patchValue({ vehicleId: 0 });
      }
    });

    // Get all active vehicles for dropdown
    this.vehicleSvc.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles.filter(v => v.isActive);
      },
      error: () => {
        this.vehicles = [];
        this.toast.error('Failed to load vehicles');
      }
    });
  }

  private normalizePayload(payload: any) {
    if (!payload.returnTime) payload.returnTime = null;
    return payload;
  }

  /* Create new delivery */
  submit() {
    console.log('Form value:', this.form.value);
    console.log('Form valid:', this.form.valid);
    if (this.form.invalid) {
    this.toast.error('Please select driver, vehicle, date and start time');
    return;
  }
  if (this.items.length === 0) {
    this.toast.error('Please add at least one product item');
    return;
  }

    let payload = this.normalizePayload(this.form.getRawValue());
    this.svc.create(payload as any).subscribe({
      next: () => {
        this.toast.success('Delivery created');
        this.form.reset({ deliveryDate: this.today(), startTime: '08:00:00', driverId: 0, vehicleId: 0 });
        this.vehicles = [];
        this.assignedVehicleNumber = '';
        this.assignedVehicleId = null;
        this.items.clear();
        this.addItemRow();
        this.loadDeliveries();
      },
    error: (err) => {
  let message = 'Something went wrong while creating delivery.';

  const raw = err?.error;

  let technicalMessage = '';

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      technicalMessage = parsed?.message || raw;
    } catch {
      technicalMessage = raw;
    }
  } else if (raw?.message) {
    technicalMessage = raw.message;
  } else if (raw?.title) {
    technicalMessage = raw.title;
  }

  // ✅ Apply friendly error mapping
  if (technicalMessage.includes('UX_DailyDelivery_Vehicle_Date_Open')) {
    message = 'A delivery already exists for this vehicle and date.';
  } else if (technicalMessage.includes('no active price')) {
    message = 'Some items have no active price for the selected date.';
  } else {
    message = technicalMessage; // fallback to raw if no mapping
  }

  this.toast.error(message);
}


    });
    console.log('Form value:', this.form.value);
    console.log('Form valid:', this.form.valid);

  }

  /* Load deliveries for table */
  loadDeliveries() {
    this.svc.list({}).subscribe({
      next: res => this.deliveries = res || [],
      error: () => this.toast.error('Failed to load deliveries')
    });
  }

  /* Recompute metrics */
  recompute(id: number) {
    this.svc.updateMetrics(id).subscribe({
      next: () => {
        this.toast.success('Metrics updated');
        this.loadDeliveries();
      },
      error: () => this.toast.error('Metrics update failed')
    });
  }

  /* Close delivery */
  closeDelivery(id: number) {
    const payload: DeliveryCloseRequest = {
      completedInvoices: 0,
      pendingInvoices: 0,
      cashCollected: 0,
      emptyCylindersReturned: 0,
      postIncome: true,
      paymentMode: 'Cash'
    };
    this.svc.close(id, payload).subscribe({
      next: () => {
        this.toast.success('Delivery closed');
        this.loadDeliveries();
      },
      error: () => this.toast.error('Close failed')
    });
  }

  /* Helpers for UI labels */
  getCategoryName(productId: number): string {
    const prod = this.products.find(p => p.productId === productId);
    return prod?.categoryName ?? '-';
  }
  getSubCategoryName(productId: number): string {
    const prod = this.products.find(p => p.productId === productId);
    return prod?.subCategoryName ?? '-';
  }

  private today() {
    return new Date().toISOString().substring(0, 10);
  }
}
