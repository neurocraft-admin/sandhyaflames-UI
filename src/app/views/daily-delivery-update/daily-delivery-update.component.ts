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
        const pending = Math.max(0, planned - (delivered || 0));
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
