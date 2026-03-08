import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup, AbstractControl, FormsModule } from '@angular/forms';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ProductDropdownService, ProductOption } from '../../services/product-dropdown.service';
import { DriverService } from '../../services/driver.service';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../services/toast.service';
import { DeliveryCloseRequest } from '../../models/daily-delivery.model';
import { Vehicle } from '../../models/vehicle.model';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-daily-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './daily-delivery.component.html'
})

export class DailyDeliveryComponent {
  private fb = inject(FormBuilder);
  private svc = inject(DailyDeliveryService);
  private productSvc = inject(ProductDropdownService);
  private driverSvc = inject(DriverService);
  private vehicleSvc = inject(VehicleService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Permissions
  permissions = {
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false
  };

  assignedDriverName: string = '';
  assignedDriverId: number | null = null;
  assignedVehicleNumber: string = '';
  assignedVehicleId: number | null = null;

  products: ProductOption[] = [];
  drivers: any[] = [];
  vehicles: Vehicle[] = [];
  deliveries: any[] = [];
  filteredDeliveries: any[] = [];
  paginatedDeliveries: any[] = [];
  routes: any[] = []; // ✅ NEW: All routes for dropdown
  isEditing = signal(false); // ✅ Changed default to false
  editingDeliveryId: number | null = null; // ✅ NEW: Track which delivery is being edited
  
  // Filter & Pagination
  fromDate: string = this.yesterday();
  toDate: string = this.today();
  filterStatus: string = 'Open';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  form = this.fb.group({
    deliveryDate: [this.today(), Validators.required],
    driverId: [0, Validators.required],
    helperId: [null as number | null], // ✅ NEW: Helper selection (optional)
    vehicleId: [0, Validators.required],
    routeId: [null as number | null], // ✅ NEW: Route selection (optional)
    routeName: [''], // ✅ NEW: For route autocomplete/display
    startTime: ['08:00:00', Validators.required],
    returnTime: [null],
    remarks: [''],
    hasCreditCustomers: [{ value: false, disabled: true }],
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit() {
    console.log('✅ DailyDeliveryComponent initialized');
    this.productSvc.getAll().subscribe(p => this.products = p || []);
    console.log('✅ ngOnInit fired');
    
    // ✅ NEW: Load routes for dropdown
    this.svc.getRoutes().subscribe({
      next: routes => {
        console.log('Routes loaded:', routes);
        this.routes = routes || [];
      },
      error: e => console.error('Routes load error', e)
    });
      
    // Check for edit query param first
    this.route.queryParams.subscribe(params => {
      const editId = params['edit'];
      if (editId) {
        // Edit mode: Load ALL drivers (not filtered by availability)
        this.driverSvc.getDrivers().subscribe({
          next: d => {
            console.log('All drivers loaded for edit:', d);
            this.drivers = d;
            this.loadDeliveryForEdit(Number(editId));
          },
          error: e => console.error('Driver load error', e)
        });
      } else {
        // Create mode: Load only available drivers
        this.svc.getAvailableDrivers().subscribe({
          next: d => {
            console.log('Available drivers API result:', d);
            this.drivers = d;
            this.loadDeliveries();
          },
          error: e => console.error('Driver load error', e)
        });
      }
    });
    
    this.addItemRow();
    this.loadPermissions();
  }

  loadPermissions() {
    this.authService.getUserPermissions('DailyDelivery').subscribe({
      next: (perms) => {
        if (perms && perms.permissionMask !== undefined) {
          this.permissions.canView = (perms.permissionMask & 1) === 1;
          this.permissions.canCreate = (perms.permissionMask & 2) === 2;
          this.permissions.canUpdate = (perms.permissionMask & 4) === 4;
          this.permissions.canDelete = (perms.permissionMask & 8) === 8;
        }
      },
      error: () => {
        // If error, assume no permissions
        this.permissions = { canView: false, canCreate: false, canUpdate: false, canDelete: false };
      }
    });
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
    noOfItems: [0]
  });

  this.items.push(group);
}

  removeItemRow(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
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

    // Get vehicles based on mode (available for create, all for edit)
    if (this.isEditing()) {
      // Edit mode: Load ALL vehicles so current selection is visible
      this.vehicleSvc.getVehicles().subscribe({
        next: (vehicles) => {
          this.vehicles = vehicles.filter((v: any) => v.isActive);
        },
        error: () => {
          this.vehicles = [];
          this.toast.error('Failed to load vehicles');
        }
      });
    } else {
      // Create mode: Load only available vehicles (not locked by open deliveries)
      this.svc.getAvailableVehicles().subscribe({
        next: (vehicles) => {
          this.vehicles = vehicles.filter((v: any) => v.isActive);
        },
        error: () => {
          this.vehicles = [];
          this.toast.error('Failed to load vehicles');
        }
      });
    }
  }

  private normalizePayload(payload: any) {
    if (!payload.returnTime) payload.returnTime = null;
    return payload;
  }

  /* Create new delivery or update existing */
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

    // ✅ If editing, call update API instead
    if (this.isEditing() && this.editingDeliveryId) {
      this.updateDelivery(this.editingDeliveryId, payload);
      return;
    }

    // ✅ Otherwise, create new delivery
    this.svc.create(payload as any).subscribe({
      next: () => {
        this.toast.success('Delivery created');
        this.resetForm();
        
        // Reload available drivers after creating delivery
        this.svc.getAvailableDrivers().subscribe({
          next: d => this.drivers = d,
          error: e => console.error('Driver reload error', e)
        });
        
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

  /* ✅ NEW: Update existing delivery */
  updateDelivery(deliveryId: number, payload: any) {
    this.svc.update(deliveryId, payload as any).subscribe({
      next: () => {
        this.toast.success('Delivery updated');
        this.resetForm();
        this.isEditing.set(false);
        this.editingDeliveryId = null;
        
        // Reload available drivers for create mode
        this.svc.getAvailableDrivers().subscribe({
          next: d => this.drivers = d,
          error: e => console.error('Driver reload error', e)
        });
        
        this.loadDeliveries();
      },
      error: (err) => {
        let message = 'Failed to update delivery';
        if (err?.error?.message) {
          message = err.error.message;
        }
        this.toast.error(message);
      }
    });
  }

  /* ✅ NEW: Delete delivery (soft delete, Open only) */
  deleteDelivery(deliveryId: number) {
    if (!confirm('⚠️ Cancel this delivery?\n\nThis will:\n• Free up driver, helper, and vehicle\n• Restore all assigned stock\n• Cannot be undone\n\nProceed?')) {
      return;
    }

    this.svc.delete(deliveryId).subscribe({
      next: () => {
        this.toast.success('Delivery canceled. Resources and stock have been freed.');
        this.loadDeliveries();
      },
      error: (err) => {
        let message = 'Failed to cancel delivery';
        if (err?.error?.message) {
          message = err.error.message;
        }
        this.toast.error(message);
      }
    });
  }

  /* ✅ NEW: Cancel editing */
  cancelEdit() {
    this.resetForm();
    this.isEditing.set(false);
    this.editingDeliveryId = null;
    
    // Reload available drivers for create mode
    this.svc.getAvailableDrivers().subscribe({
      next: d => {
        this.drivers = d;
        console.log('Reloaded available drivers after cancel:', d.length);
      },
      error: e => console.error('Driver reload error', e)
    });
    
    this.router.navigate([], { queryParams: {}, queryParamsHandling: 'merge' });
  }

  /* ✅ NEW: Reset form to initial state */
  resetForm() {
    this.form.reset({ 
      deliveryDate: this.today(), 
      startTime: '08:00:00', 
      driverId: 0, 
      helperId: null,
      vehicleId: 0, 
      routeId: null,
      routeName: '',
      hasCreditCustomers: false 
    });
    this.vehicles = [];
    this.assignedVehicleNumber = '';
    this.assignedVehicleId = null;
    this.items.clear();
    this.addItemRow();
  }

  /* ✅ NEW: Load delivery for editing */
  loadDeliveryForEdit(deliveryId: number) {
    this.svc.getById(deliveryId).subscribe({
      next: (delivery) => {
        console.log('Loading delivery for edit:', delivery);
        
        // Set edit mode
        this.isEditing.set(true);
        this.editingDeliveryId = deliveryId;
        
        // Load ALL drivers (not just available) so current driver is visible
        this.driverSvc.getDrivers().subscribe({
          next: (allDrivers) => {
            this.drivers = allDrivers;
            
            // Set assigned driver info
            const assignedDriver = allDrivers.find((d: any) => d.driverId === delivery.DriverId);
            if (assignedDriver) {
              this.assignedDriverName = assignedDriver.driverName;
              this.assignedDriverId = assignedDriver.driverId;
            }
          }
        });
        
        // Load ALL vehicles (not just available) so current vehicle is visible
        this.vehicleSvc.getVehicles().subscribe({
          next: (allVehicles) => {
            this.vehicles = allVehicles;
            
            // Set assigned vehicle info
            const assignedVehicle = allVehicles.find((v: any) => v.vehicleId === delivery.VehicleId);
            if (assignedVehicle) {
              this.assignedVehicleNumber = assignedVehicle.vehicleNumber;
              this.assignedVehicleId = assignedVehicle.vehicleId;
            }
          }
        });
        
        // Populate form
        this.form.patchValue({
          deliveryDate: delivery.DeliveryDate?.substring(0, 10) || this.today(),
          driverId: delivery.DriverId || 0,
          helperId: delivery.HelperId || null,
          vehicleId: delivery.VehicleId || 0,
          routeId: delivery.RouteId || null,
          routeName: delivery.RouteName || '',
          startTime: delivery.StartTime || '08:00:00',
          returnTime: delivery.ReturnTime || null,
          remarks: delivery.Remarks || '',
          hasCreditCustomers: delivery.HasCreditCustomers || false
        });
        
        // Load delivery items
        this.items.clear();
        if (delivery.Items && delivery.Items.length > 0) {
          delivery.Items.forEach((item: any) => {
            const itemGroup = this.fb.group({
              productId: [item.ProductId || 0, Validators.required],
              noOfCylinders: [item.NoOfCylinders || 0],
              noOfInvoices: [item.NoOfInvoices || 1, [Validators.required, Validators.min(1)]],
              noOfItems: [item.NoOfItems || 0]
            });
            this.items.push(itemGroup);
          });
        } else {
          this.addItemRow();
        }
        
        this.toast.info('Editing delivery #' + deliveryId);
        
        // ✅ Scroll to top to show the populated form
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load delivery:', err);
        this.toast.error('Failed to load delivery for editing');
        this.router.navigate([], { queryParams: {}, queryParamsHandling: 'merge' });
      }
    });
  }

  /* ✅ NEW: Handle route selection or auto-create */
  onRouteChange(event: Event) {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const routeName = input.value;

    if (!routeName || routeName.trim() === '') {
      this.form.patchValue({ routeId: null, routeName: '' });
      return;
    }

    // Check if route exists in the list
    const existingRoute = this.routes.find(r => 
      r.RouteName?.toLowerCase() === routeName.toLowerCase() ||
      r.routeName?.toLowerCase() === routeName.toLowerCase()
    );

    if (existingRoute) {
      this.form.patchValue({ 
        routeId: existingRoute.RouteId || existingRoute.routeId, 
        routeName: existingRoute.RouteName || existingRoute.routeName 
      });
    } else {
      // Auto-create new route
      this.svc.getOrCreateRoute(routeName).subscribe({
        next: (response) => {
          this.form.patchValue({ routeId: response.routeId, routeName: response.routeName });
          // Refresh routes list
          this.svc.getRoutes().subscribe(routes => this.routes = routes || []);
          this.toast.success(`Route "${response.routeName}" created`);
        },
        error: () => {
          this.toast.error('Failed to create route');
          this.form.patchValue({ routeId: null, routeName: '' });
        }
      });
    }
  }

  /* Load deliveries for table */
  loadDeliveries() {
    this.svc.list({}).subscribe({
      next: res => {
        console.log('Deliveries from API:', res);
        // Note: API doesn't return DriverId/DriverName - needs backend update
        this.deliveries = res || [];
        this.applyFilters();
      },
      error: () => this.toast.error('Failed to load deliveries')
    });
  }

  /* Apply filters and pagination */
  applyFilters() {
    let filtered = [...this.deliveries];

    // Filter by date range
    if (this.fromDate || this.toDate) {
      filtered = filtered.filter(d => {
        // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
        const deliveryDate = d.DeliveryDate.substring(0, 10);
        const matchesFrom = !this.fromDate || deliveryDate >= this.fromDate;
        const matchesTo = !this.toDate || deliveryDate <= this.toDate;
        return matchesFrom && matchesTo;
      });
    }

    // Filter by status
    if (this.filterStatus && this.filterStatus !== 'All') {
      filtered = filtered.filter(d => d.Status === this.filterStatus);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.DeliveryDate).getTime() - new Date(a.DeliveryDate).getTime());

    this.filteredDeliveries = filtered;
    this.totalPages = Math.ceil(this.filteredDeliveries.length / this.pageSize);
    this.currentPage = 1;
    this.updatePagination();
  }

  /* Update pagination */
  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedDeliveries = this.filteredDeliveries.slice(start, end);
  }

  /* Pagination controls */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /* Clear filters */
  clearFilters() {
    this.fromDate = this.yesterday();
    this.toDate = this.today();
    this.filterStatus = 'Open';
    this.applyFilters();
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

  private yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().substring(0, 10);
  }
}
