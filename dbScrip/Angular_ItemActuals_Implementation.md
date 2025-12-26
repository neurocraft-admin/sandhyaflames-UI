# Angular Implementation Guide: Item-Level Delivery Actuals

## Overview
Update the DailyDeliveryUpdate component to show item-wise tracking instead of consolidated totals.

---

## 📋 STEP 1: Create/Update Models

### File: `src/app/models/daily-delivery-item-actual.model.ts`

```typescript
export interface DailyDeliveryItemActual {
  actualId?: number;
  deliveryId: number;
  productId: number;
  productName: string;
  categoryName: string;
  plannedQuantity: number;
  deliveredQuantity: number;
  pendingQuantity: number;
  cashCollected: number;
  itemStatus: 'Completed' | 'Partial' | 'Pending';
  remarks?: string;
  updatedAt?: Date;
  unitPrice: number;
  totalAmount: number;
}

export interface UpdateItemActualsRequest {
  items: ItemActualInput[];
}

export interface ItemActualInput {
  productId: number;
  delivered: number;
  pending: number;
  cashCollected: number;
  remarks?: string;
}

export interface DeliveryWithItems {
  delivery: {
    deliveryId: number;
    deliveryDate: string;
    vehicleId: number;
    vehicleNumber: string;
    status: string;
    returnTime?: string;
    remarks?: string;
    completedInvoices: number;
    pendingInvoices: number;
    cashCollected: number;
    emptyCylindersReturned: number;
  };
  items: DailyDeliveryItemActual[];
}

export interface CloseDeliveryWithItemsRequest {
  returnTime: string;
  emptyCylindersReturned: number;
  remarks?: string;
}
```

---

## 📋 STEP 2: Update Service

### File: `src/app/services/daily-delivery.service.ts`

Add these methods to your existing service:

```typescript
import { DailyDeliveryItemActual, UpdateItemActualsRequest, DeliveryWithItems, CloseDeliveryWithItemsRequest } from '../models/daily-delivery-item-actual.model';

// Add to DailyDeliveryService class:

/* Initialize item actuals for a delivery */
initializeItemActuals(deliveryId: number): Observable<{ success: number; message: string }> {
  return this.http.post<{ success: number; message: string }>(
    `${environment.apiUrl}/dailydelivery/${deliveryId}/items/initialize`,
    {}
  );
}

/* Get item-level actuals for a delivery */
getItemActuals(deliveryId: number): Observable<DailyDeliveryItemActual[]> {
  return this.http.get<DailyDeliveryItemActual[]>(
    `${environment.apiUrl}/dailydelivery/${deliveryId}/items/actuals`
  );
}

/* Update item-level actuals */
updateItemActuals(deliveryId: number, request: UpdateItemActualsRequest): Observable<{ success: number; message: string }> {
  return this.http.put<{ success: number; message: string }>(
    `${environment.apiUrl}/dailydelivery/${deliveryId}/items/actuals`,
    request
  );
}

/* Get delivery with item actuals (combined) */
getDeliveryWithItems(deliveryId: number): Observable<DeliveryWithItems> {
  return this.http.get<DeliveryWithItems>(
    `${environment.apiUrl}/dailydelivery/${deliveryId}/with-items`
  );
}

/* Close delivery with item verification */
closeDeliveryWithItems(deliveryId: number, request: CloseDeliveryWithItemsRequest): Observable<{ success: number; message: string }> {
  return this.http.put<{ success: number; message: string }>(
    `${environment.apiUrl}/dailydelivery/${deliveryId}/close-with-items`,
    request
  );
}
```

---

## 📋 STEP 3: Update Component

### File: `src/app/views/daily-delivery-update/daily-delivery-update.component.ts`

Replace or enhance the existing component:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ToastService } from '../../services/toast.service';
import { DailyDeliveryItemActual, CloseDeliveryWithItemsRequest } from '../../models/daily-delivery-item-actual.model';

@Component({
  selector: 'app-daily-delivery-update',
  templateUrl: './daily-delivery-update.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class DailyDeliveryUpdateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deliveryService = inject(DailyDeliveryService);
  private toast = inject(ToastService);

  deliveryId: number = 0;
  loading = signal<boolean>(false);
  itemActuals = signal<DailyDeliveryItemActual[]>([]);
  
  deliveryInfo: any = null;
  
  form!: FormGroup;

  ngOnInit(): void {
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.form = this.fb.group({
      returnTime: ['', Validators.required],
      emptyCylindersReturned: [0, [Validators.required, Validators.min(0)]],
      remarks: [''],
      items: this.fb.array([])
    });

    this.loadDeliveryData();
  }

  get itemsFormArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  loadDeliveryData(): void {
    this.loading.set(true);
    
    // First, try to get delivery with items
    this.deliveryService.getDeliveryWithItems(this.deliveryId).subscribe({
      next: (data) => {
        this.deliveryInfo = data.delivery;
        
        if (data.items && data.items.length > 0) {
          // Items already initialized
          this.itemActuals.set(data.items);
          this.buildItemForms(data.items);
        } else {
          // Initialize items first
          this.initializeItems();
        }
        
        this.loading.set(false);
      },
      error: () => {
        // Fallback: Initialize items
        this.initializeItems();
      }
    });
  }

  initializeItems(): void {
    this.deliveryService.initializeItemActuals(this.deliveryId).subscribe({
      next: () => {
        // Now fetch the initialized items
        this.deliveryService.getItemActuals(this.deliveryId).subscribe({
          next: (items) => {
            this.itemActuals.set(items);
            this.buildItemForms(items);
            this.loading.set(false);
          },
          error: () => {
            this.toast.error('Failed to load item details');
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.toast.error('Failed to initialize item tracking');
        this.loading.set(false);
      }
    });
  }

  buildItemForms(items: DailyDeliveryItemActual[]): void {
    this.itemsFormArray.clear();
    
    items.forEach(item => {
      const itemGroup = this.fb.group({
        productId: [item.productId],
        productName: [item.productName],
        categoryName: [item.categoryName],
        plannedQuantity: [item.plannedQuantity],
        deliveredQuantity: [item.deliveredQuantity, [Validators.required, Validators.min(0)]],
        pendingQuantity: [item.pendingQuantity, [Validators.required, Validators.min(0)]],
        cashCollected: [item.cashCollected, [Validators.required, Validators.min(0)]],
        remarks: [item.remarks || ''],
        unitPrice: [item.unitPrice]
      });
      
      // Auto-calculate pending when delivered changes
      itemGroup.get('deliveredQuantity')?.valueChanges.subscribe(delivered => {
        const planned = itemGroup.get('plannedQuantity')?.value || 0;
        const pending = Math.max(0, planned - delivered);
        itemGroup.get('pendingQuantity')?.setValue(pending, { emitEvent: false });
      });
      
      this.itemsFormArray.push(itemGroup);
    });
  }

  getItemStatus(index: number): string {
    const item = this.itemsFormArray.at(index);
    const delivered = item.get('deliveredQuantity')?.value || 0;
    const pending = item.get('pendingQuantity')?.value || 0;
    
    if (pending === 0) return 'Completed';
    if (delivered > 0) return 'Partial';
    return 'Pending';
  }

  getItemStatusClass(index: number): string {
    const status = this.getItemStatus(index);
    return {
      'Completed': 'badge bg-success',
      'Partial': 'badge bg-warning',
      'Pending': 'badge bg-secondary'
    }[status] || 'badge bg-secondary';
  }

  calculateTotalAmount(index: number): number {
    const item = this.itemsFormArray.at(index);
    const delivered = item.get('deliveredQuantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    return delivered * unitPrice;
  }

  getTotalCashCollected(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      total += item.get('cashCollected')?.value || 0;
    }
    return total;
  }

  getTotalDelivered(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      total += item.get('deliveredQuantity')?.value || 0;
    }
    return total;
  }

  getTotalPending(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      total += item.get('pendingQuantity')?.value || 0;
    }
    return total;
  }

  saveItems(): void {
    if (this.itemsFormArray.invalid) {
      this.toast.error('Please fill all required fields');
      return;
    }

    const items = this.itemsFormArray.controls.map(control => ({
      productId: control.get('productId')?.value,
      delivered: control.get('deliveredQuantity')?.value,
      pending: control.get('pendingQuantity')?.value,
      cashCollected: control.get('cashCollected')?.value,
      remarks: control.get('remarks')?.value || ''
    }));

    this.deliveryService.updateItemActuals(this.deliveryId, { items }).subscribe({
      next: () => {
        this.toast.success('Item actuals updated successfully');
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update item actuals');
      }
    });
  }

  closeDelivery(): void {
    if (this.form.invalid) {
      this.toast.error('Please fill all required fields');
      return;
    }

    // First save items
    const items = this.itemsFormArray.controls.map(control => ({
      productId: control.get('productId')?.value,
      delivered: control.get('deliveredQuantity')?.value,
      pending: control.get('pendingQuantity')?.value,
      cashCollected: control.get('cashCollected')?.value,
      remarks: control.get('remarks')?.value || ''
    }));

    this.deliveryService.updateItemActuals(this.deliveryId, { items }).subscribe({
      next: () => {
        // Then close delivery
        const closeRequest: CloseDeliveryWithItemsRequest = {
          returnTime: this.form.value.returnTime,
          emptyCylindersReturned: this.form.value.emptyCylindersReturned,
          remarks: this.form.value.remarks
        };

        this.deliveryService.closeDeliveryWithItems(this.deliveryId, closeRequest).subscribe({
          next: () => {
            this.toast.success('Delivery closed successfully');
            this.router.navigate(['/DailyDelivery']);
          },
          error: (err) => {
            this.toast.error(err.error?.message || 'Failed to close delivery');
          }
        });
      },
      error: (err) => {
        this.toast.error('Failed to save items: ' + (err.error?.message || ''));
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/DailyDelivery']);
  }
}
```

---

## 📋 STEP 4: Create Template

### File: `src/app/views/daily-delivery-update/daily-delivery-update.component.html`

```html
<div class="container mt-3">
  <div class="card shadow-sm">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">Update Daily Delivery - Item-Level Tracking</h5>
    </div>
    <div class="card-body">
      
      <!-- Loading Spinner -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Main Form -->
      <form [formGroup]="form" *ngIf="!loading()">
        
        <!-- Delivery Info Summary -->
        <div class="alert alert-info mb-4" *ngIf="deliveryInfo">
          <div class="row">
            <div class="col-md-3">
              <strong>Delivery Date:</strong><br>
              {{ deliveryInfo.deliveryDate | date: 'dd/MM/yyyy' }}
            </div>
            <div class="col-md-3">
              <strong>Vehicle:</strong><br>
              {{ deliveryInfo.vehicleNumber }}
            </div>
            <div class="col-md-3">
              <strong>Status:</strong><br>
              <span class="badge" [class.bg-success]="deliveryInfo.status === 'Closed'" 
                    [class.bg-warning]="deliveryInfo.status === 'Open'">
                {{ deliveryInfo.status }}
              </span>
            </div>
            <div class="col-md-3">
              <strong>Total Items:</strong><br>
              {{ itemsFormArray.length }}
            </div>
          </div>
        </div>

        <!-- Item-Level Tracking Table -->
        <h6 class="mb-3">Item-Wise Delivery Status</h6>
        <div class="table-responsive mb-4">
          <table class="table table-bordered table-sm">
            <thead class="table-light">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Planned</th>
                <th>Delivered</th>
                <th>Pending</th>
                <th>Unit Price</th>
                <th>Cash Collected</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody formArrayName="items">
              <tr *ngFor="let item of itemsFormArray.controls; let i = index" [formGroupName]="i">
                <!-- Product Name -->
                <td>
                  <strong>{{ item.get('productName')?.value }}</strong>
                </td>
                
                <!-- Category -->
                <td>
                  <small class="text-muted">{{ item.get('categoryName')?.value }}</small>
                </td>
                
                <!-- Planned Quantity (readonly) -->
                <td class="text-center">
                  <strong>{{ item.get('plannedQuantity')?.value }}</strong>
                </td>
                
                <!-- Delivered Quantity (editable) -->
                <td>
                  <input type="number" 
                         class="form-control form-control-sm" 
                         formControlName="deliveredQuantity"
                         min="0"
                         [max]="item.get('plannedQuantity')?.value">
                </td>
                
                <!-- Pending Quantity (auto-calculated) -->
                <td class="text-center">
                  <span class="badge bg-secondary">
                    {{ item.get('pendingQuantity')?.value }}
                  </span>
                </td>
                
                <!-- Unit Price (readonly) -->
                <td class="text-end">
                  {{ item.get('unitPrice')?.value | currency:'INR' }}
                </td>
                
                <!-- Cash Collected (editable) -->
                <td>
                  <input type="number" 
                         class="form-control form-control-sm" 
                         formControlName="cashCollected"
                         min="0"
                         step="0.01">
                  <small class="text-muted">
                    Expected: {{ calculateTotalAmount(i) | currency:'INR' }}
                  </small>
                </td>
                
                <!-- Status Badge -->
                <td class="text-center">
                  <span [class]="getItemStatusClass(i)">
                    {{ getItemStatus(i) }}
                  </span>
                </td>
                
                <!-- Remarks -->
                <td>
                  <input type="text" 
                         class="form-control form-control-sm" 
                         formControlName="remarks"
                         placeholder="Optional notes">
                </td>
              </tr>
              
              <!-- Empty State -->
              <tr *ngIf="itemsFormArray.length === 0">
                <td colspan="9" class="text-center text-muted">
                  No items found for this delivery
                </td>
              </tr>
            </tbody>
            
            <!-- Totals Footer -->
            <tfoot class="table-secondary">
              <tr>
                <th colspan="3" class="text-end">Totals:</th>
                <th class="text-center">{{ getTotalDelivered() }}</th>
                <th class="text-center">{{ getTotalPending() }}</th>
                <th></th>
                <th class="text-end">{{ getTotalCashCollected() | currency:'INR' }}</th>
                <th colspan="2"></th>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Delivery Closure Section -->
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label">Return Time <span class="text-danger">*</span></label>
            <input type="time" class="form-control" formControlName="returnTime">
          </div>
          
          <div class="col-md-4">
            <label class="form-label">Empty Cylinders Returned</label>
            <input type="number" class="form-control" formControlName="emptyCylindersReturned" min="0">
          </div>
          
          <div class="col-md-4">
            <label class="form-label">Overall Remarks</label>
            <input type="text" class="form-control" formControlName="remarks" placeholder="Optional">
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex justify-content-between">
          <button type="button" class="btn btn-secondary" (click)="cancel()">
            <i class="bi bi-x-circle"></i> Cancel
          </button>
          
          <div>
            <button type="button" class="btn btn-primary me-2" (click)="saveItems()">
              <i class="bi bi-save"></i> Save Items
            </button>
            
            <button type="button" class="btn btn-success" (click)="closeDelivery()" 
                    [disabled]="form.invalid">
              <i class="bi bi-check-circle"></i> Save & Close Delivery
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
```

---

## 📋 STEP 5: Add CSS (Optional)

### File: `src/app/views/daily-delivery-update/daily-delivery-update.component.scss`

```scss
.table {
  font-size: 0.9rem;
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
  }
  
  input.form-control-sm {
    min-width: 80px;
  }
  
  .badge {
    min-width: 70px;
  }
}

.alert-info {
  border-left: 4px solid #0dcaf0;
}
```

---

## 🎯 Key Features Implemented

✅ **Item-wise tracking** - Each product shows planned vs delivered  
✅ **Auto-calculation** - Pending qty auto-updates when delivered changes  
✅ **Status badges** - Visual status (Completed/Partial/Pending)  
✅ **Cash tracking** - Per-item cash collection  
✅ **Expected amount** - Shows what cash should be collected  
✅ **Totals row** - Summary of all items  
✅ **Save & Close** - Two-step process for safety  
✅ **Responsive** - Works on mobile/tablet  

---

## 🔄 Workflow

1. User navigates to `/DailyDeliveryUpdate/24`
2. Component loads delivery + initializes items (if needed)
3. Shows table with all delivery items
4. User enters delivered quantities → pending auto-updates
5. User enters cash collected per item
6. Click "Save Items" → Updates without closing
7. Click "Save & Close" → Updates items + closes delivery
8. Redirects to `/DailyDelivery`

---

## ✅ Testing Checklist

- [ ] Table displays all delivery items
- [ ] Delivered quantity changes update pending qty
- [ ] Status badges show correct colors
- [ ] Cash collected validation works
- [ ] Save Items updates without closing
- [ ] Close Delivery saves and redirects
- [ ] Empty state shows when no items
- [ ] Loading spinner displays correctly
- [ ] Toast messages appear on success/error

---

This implementation provides full item-level visibility while maintaining your existing coding patterns!
