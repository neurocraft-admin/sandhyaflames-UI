import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ToastService } from '../../services/toast.service';
import { DailyDeliveryItemActual, CloseDeliveryWithItemsRequest, PaymentSplitBreakdown } from '../../models/daily-delivery-item-actual.model';
import { PaymentSplitModalComponent, PaymentSplitModalData } from './payment-split-modal.component';
import { CreditMappingModalComponent, CreditMappingData } from './credit-mapping-modal.component';

@Component({
  selector: 'app-daily-delivery-update',
  templateUrl: './daily-delivery-update.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PaymentSplitModalComponent, CreditMappingModalComponent]
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

  // Payment split modal state
  showPaymentSplitModal = signal<boolean>(false);
  currentPaymentSplitIndex: number = -1;
  paymentSplitModalData: PaymentSplitModalData = {
    productName: '',
    totalAmount: 0
  };

  // Credit mapping modal state
  showCreditMappingModal = signal<boolean>(false);
  currentCreditMappingIndex: number = -1;
  creditMappingModalData: CreditMappingData = {
    deliveryId: 0,
    productId: 0,
    productName: '',
    creditAmount: 0
  };

  ngOnInit(): void {
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.form = this.fb.group({
      returnTime: ['', Validators.required],
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
        emptyReturned: [item.emptyReturned || 0, [Validators.min(0)]],
        damagedReturned: [item.damagedReturned || 0, [Validators.min(0)]],
        cashCollected: [item.cashCollected, [Validators.required, Validators.min(0)]],
        remarks: [item.remarks || ''],
        unitPrice: [item.unitPrice],
        // Payment split breakdown
        paymentSplit: this.fb.group({
          cash: [item.paymentBreakdown?.cash || 0],
          upi: [item.paymentBreakdown?.upi || 0],
          card: [item.paymentBreakdown?.card || 0],
          bank: [item.paymentBreakdown?.bank || 0],
          credit: [item.paymentBreakdown?.credit || 0]
        })
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

  // Payment Split Methods
  openPaymentSplitModal(index: number): void {
    const item = this.itemsFormArray.at(index);
    const cashCollected = item.get('cashCollected')?.value || 0;

    // Validate that cashCollected is not zero
    if (cashCollected === 0) {
      this.toast.error('Please enter amount collected before setting payment split');
      return;
    }

    this.currentPaymentSplitIndex = index;
    
    // CRITICAL FIX: Clone the payment split data to avoid shared object reference
    const originalSplit = item.get('paymentSplit')?.value;
    const clonedSplit = originalSplit ? {
      cash: originalSplit.cash || 0,
      upi: originalSplit.upi || 0,
      card: originalSplit.card || 0,
      bank: originalSplit.bank || 0,
      credit: originalSplit.credit || 0
    } : undefined;
    
    this.paymentSplitModalData = {
      productName: item.get('productName')?.value || '',
      totalAmount: cashCollected,
      currentSplit: clonedSplit
    };
    this.showPaymentSplitModal.set(true);
  }

  closePaymentSplitModal(): void {
    this.showPaymentSplitModal.set(false);
    this.currentPaymentSplitIndex = -1;
  }

  savePaymentSplit(breakdown: PaymentSplitBreakdown): void {
    if (this.currentPaymentSplitIndex < 0) return;

    const item = this.itemsFormArray.at(this.currentPaymentSplitIndex);
    item.get('paymentSplit')?.patchValue(breakdown);
    
    this.toast.success('Payment split saved');
    this.closePaymentSplitModal();
  }

  hasPaymentSplit(index: number): boolean {
    const item = this.itemsFormArray.at(index);
    const split = item.get('paymentSplit')?.value;
    return (split.cash + split.upi + split.card + split.bank + split.credit) > 0;
  }

  isPaymentSplitValid(index: number): boolean {
    const item = this.itemsFormArray.at(index);
    const cashCollected = item.get('cashCollected')?.value || 0;
    const split = item.get('paymentSplit')?.value;
    const splitTotal = (split.cash || 0) + (split.upi || 0) + (split.card || 0) + (split.bank || 0) + (split.credit || 0);
    
    return Math.abs(cashCollected - splitTotal) < 0.01;
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

  getTotalEmptyReturned(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      total += item.get('emptyReturned')?.value || 0;
    }
    return total;
  }

  getTotalDamagedReturned(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      total += item.get('damagedReturned')?.value || 0;
    }
    return total;
  }

  // Credit Mapping Methods
  openCreditMappingModal(index: number): void {
    const item = this.itemsFormArray.at(index);
    const creditAmount = item.get('paymentSplit.credit')?.value || 0;

    if (creditAmount <= 0) {
      this.toast.error('No credit amount to map');
      return;
    }

    this.currentCreditMappingIndex = index;
    this.creditMappingModalData = {
      deliveryId: this.deliveryId,
      productId: item.get('productId')?.value,
      productName: item.get('productName')?.value || '',
      creditAmount: creditAmount
    };
    this.showCreditMappingModal.set(true);
  }

  closeCreditMappingModal(): void {
    this.showCreditMappingModal.set(false);
    this.currentCreditMappingIndex = -1;
  }

  onCreditMappingSaved(): void {
    this.toast.success('Credit mappings saved successfully');
    this.closeCreditMappingModal();
    // Refresh data if needed
  }

  hasCreditAmount(index: number): boolean {
    const item = this.itemsFormArray.at(index);
    const creditAmount = item.get('paymentSplit.credit')?.value || 0;
    return creditAmount > 0;
  }

  async isCreditMapped(index: number): Promise<boolean> {
    const item = this.itemsFormArray.at(index);
    const creditAmount = item.get('paymentSplit.credit')?.value || 0;

    if (creditAmount <= 0) {
      return true; // No credit, so it's "mapped" (not required)
    }

    const productId = item.get('productId')?.value;

    try {
      const validation: any = await this.deliveryService.validateCreditMappings(this.deliveryId, productId).toPromise();
      return validation?.IsValid || false;
    } catch {
      return false;
    }
  }

  async saveItems(): Promise<void> {
    if (this.itemsFormArray.invalid) {
      this.toast.error('Please fill all required fields');
      return;
    }

    // Validate payment splits
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      if (!this.isPaymentSplitValid(i)) {
        const item = this.itemsFormArray.at(i);
        const productName = item.get('productName')?.value;
        this.toast.error(`Payment split for ${productName} does not match amount collected`);
        return;
      }
    }

    // Validate credit mappings
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      const creditAmount = item.get('paymentSplit.credit')?.value || 0;

      if (creditAmount > 0) {
        const productId = item.get('productId')?.value;
        const productName = item.get('productName')?.value;

        try {
          const validation: any = await this.deliveryService.validateCreditMappings(this.deliveryId, productId).toPromise();
          
          if (!validation?.isValid) {
            this.toast.error(`Credit entered for ${productName} but customer mapping is incomplete. Please complete customer mapping before saving.`);
            return;
          }
        } catch {
          this.toast.error(`Failed to validate credit mapping for ${productName}`);
          return;
        }
      }
    }

    const items = this.itemsFormArray.controls.map(control => ({
      productId: control.get('productId')?.value,
      deliveredQuantity: control.get('deliveredQuantity')?.value,
      pendingQuantity: control.get('pendingQuantity')?.value,
      emptyReturned: control.get('emptyReturned')?.value || 0,
      damagedReturned: control.get('damagedReturned')?.value || 0,
      cashCollected: control.get('cashCollected')?.value,
      itemStatus: this.getItemStatus(this.itemsFormArray.controls.indexOf(control)),
      remarks: control.get('remarks')?.value || '',
      paymentSplit: control.get('paymentSplit')?.value
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

  async closeDelivery(): Promise<void> {
    if (this.form.invalid) {
      this.toast.error('Please fill all required fields');
      return;
    }

    // Validate payment splits
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      if (!this.isPaymentSplitValid(i)) {
        const item = this.itemsFormArray.at(i);
        const productName = item.get('productName')?.value;
        this.toast.error(`Payment split for ${productName} does not match amount collected. Please set correct payment split.`);
        return;
      }
    }

    // Validate credit mappings before closing
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      const creditAmount = item.get('paymentSplit.credit')?.value || 0;

      if (creditAmount > 0) {
        const productId = item.get('productId')?.value;
        const productName = item.get('productName')?.value;

        try {
          const validation: any = await this.deliveryService.validateCreditMappings(this.deliveryId, productId).toPromise();
          
          if (!validation?.isValid) {
            this.toast.error(`Cannot close delivery: Credit entered for ${productName} but customer mapping is incomplete. Please complete all credit mappings before closing.`);
            return;
          }
        } catch {
          this.toast.error(`Failed to validate credit mapping for ${productName}`);
          return;
        }
      }
    }

    // First save items with payment splits
    const items = this.itemsFormArray.controls.map(control => ({
      productId: control.get('productId')?.value,
      deliveredQuantity: control.get('deliveredQuantity')?.value,
      pendingQuantity: control.get('pendingQuantity')?.value,
      emptyReturned: control.get('emptyReturned')?.value || 0,
      damagedReturned: control.get('damagedReturned')?.value || 0,
      cashCollected: control.get('cashCollected')?.value,
      itemStatus: this.getItemStatus(this.itemsFormArray.controls.indexOf(control)),
      remarks: control.get('remarks')?.value || '',
      paymentSplit: control.get('paymentSplit')?.value
    }));

    this.deliveryService.updateItemActuals(this.deliveryId, { items }).subscribe({
      next: () => {
        // Then close delivery
        const closeRequest: CloseDeliveryWithItemsRequest = {
          returnTime: this.form.value.returnTime,
          emptyCylindersReturned: this.getTotalEmptyReturned(), // Calculate from items
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
