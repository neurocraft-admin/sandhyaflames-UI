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

  // ✅ NEW: Delivery charge state
  hasDeliveryCharge = signal<boolean>(false);
  deliveryChargeAmount = signal<number>(0);

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
      items: this.fb.array([]),
      // ✅ NEW: Delivery charge fields
      deliveryCharge: this.fb.group({
        chargeAmount: [0, [Validators.min(0)]],
        paymentSplit: this.fb.group({
          cash: [0],
          upi: [0],
          card: [0],
          bank: [0]
        }),
        remarks: ['']
      })
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
    // ✅ Check if this is delivery charge payment split
    if (this.currentPaymentSplitIndex === -2) {
      this.saveDeliveryChargePaymentSplit(breakdown);
      return;
    }

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

  // ✅ NEW: Delivery Charge Payment Split Methods
  openDeliveryChargePaymentSplit(): void {
    const chargeAmount = this.form.get('deliveryCharge.chargeAmount')?.value || 0;

    if (chargeAmount <= 0) {
      this.toast.error('Please enter delivery charge amount before setting payment split');
      return;
    }

    this.currentPaymentSplitIndex = -2; // Special index for delivery charge
    
    const originalSplit = this.form.get('deliveryCharge.paymentSplit')?.value;
    const clonedSplit = originalSplit ? {
      cash: originalSplit.cash || 0,
      upi: originalSplit.upi || 0,
      card: originalSplit.card || 0,
      bank: originalSplit.bank || 0,
      credit: 0 // ✅ Delivery charge does NOT support credit
    } : undefined;
    
    this.paymentSplitModalData = {
      productName: 'Delivery Charge',
      totalAmount: chargeAmount,
      currentSplit: clonedSplit,
      disableCredit: true // ✅ NEW: Flag to disable credit in modal
    };
    this.showPaymentSplitModal.set(true);
  }

  saveDeliveryChargePaymentSplit(breakdown: PaymentSplitBreakdown): void {
    // Remove credit from breakdown (should be 0 anyway)
    const cleanBreakdown = {
      cash: breakdown.cash || 0,
      upi: breakdown.upi || 0,
      card: breakdown.card || 0,
      bank: breakdown.bank || 0
    };

    this.form.get('deliveryCharge.paymentSplit')?.patchValue(cleanBreakdown);
    this.toast.success('Delivery charge payment split saved');
    this.closePaymentSplitModal();
  }

  hasDeliveryChargePaymentSplit(): boolean {
    const split = this.form.get('deliveryCharge.paymentSplit')?.value;
    return (split.cash + split.upi + split.card + split.bank) > 0;
  }

  isDeliveryChargePaymentSplitValid(): boolean {
    const chargeAmount = this.form.get('deliveryCharge.chargeAmount')?.value || 0;
    const split = this.form.get('deliveryCharge.paymentSplit')?.value;
    const splitTotal = (split.cash || 0) + (split.upi || 0) + (split.card || 0) + (split.bank || 0);
    
    if (chargeAmount === 0) return true; // No charge, so split is valid (not required)
    return Math.abs(chargeAmount - splitTotal) < 0.01;
  }

  getTotalCashCollected(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      const item = this.itemsFormArray.at(i);
      total += item.get('cashCollected')?.value || 0;
    }
    // ✅ Add delivery charge to total
    total += this.form.get('deliveryCharge.chargeAmount')?.value || 0;
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

    // Validate payment splits for items
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      if (!this.isPaymentSplitValid(i)) {
        const item = this.itemsFormArray.at(i);
        const productName = item.get('productName')?.value;
        this.toast.error(`Payment split for ${productName} does not match amount collected. Please set correct payment split.`);
        return;
      }
    }

    // ✅ NEW: Validate delivery charge payment split
    const deliveryChargeAmount = this.form.get('deliveryCharge.chargeAmount')?.value || 0;
    if (deliveryChargeAmount > 0 && !this.isDeliveryChargePaymentSplitValid()) {
      this.toast.error('Delivery charge payment split does not match amount. Please set correct payment split.');
      return;
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

    // ✅ NEW: Save delivery charge first (if exists)
    if (deliveryChargeAmount > 0) {
      const chargePayload = {
        chargeAmount: deliveryChargeAmount,
        cashAmount: this.form.get('deliveryCharge.paymentSplit.cash')?.value || 0,
        upiAmount: this.form.get('deliveryCharge.paymentSplit.upi')?.value || 0,
        cardAmount: this.form.get('deliveryCharge.paymentSplit.card')?.value || 0,
        bankAmount: this.form.get('deliveryCharge.paymentSplit.bank')?.value || 0,
        remarks: this.form.get('deliveryCharge.remarks')?.value || ''
      };

      try {
        await this.deliveryService.saveDeliveryCharge(this.deliveryId, chargePayload).toPromise();
      } catch (err: any) {
        this.toast.error('Failed to save delivery charge: ' + (err.error?.message || ''));
        return;
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
