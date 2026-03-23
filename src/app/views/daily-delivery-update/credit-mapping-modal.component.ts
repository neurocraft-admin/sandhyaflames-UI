import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { DailyDeliveryMappingService } from '../../services/daily-delivery-mapping.service';
import { ToastService } from '../../services/toast.service';
import { Customer } from '../../models/customer.model';

export interface CreditMappingData {
  deliveryId: number;
  productId: number;
  productName: string;
  creditAmount: number;
}

interface CreditMappingEntry {
  customerId: number;
  customerName: string;
  amount: number;
  invoiceNumber?: string;
}

@Component({
  selector: 'app-credit-mapping-modal',
  templateUrl: './credit-mapping-modal.component.html',
  styleUrls: ['./credit-mapping-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CreditMappingModalComponent implements OnInit {
  // Expose Math to template
  Math = Math;
  
  private fb = inject(FormBuilder);
  private customerSvc = inject(CustomerService);
  private mappingSvc = inject(DailyDeliveryMappingService);
  private toast = inject(ToastService);

  @Input() data!: CreditMappingData;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  customers: Customer[] = [];
  mappingForm!: FormGroup;
  validationError: string = '';
  loading = signal(false);

  get mappings(): FormArray {
    return this.mappingForm.get('mappings') as FormArray;
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.initForm();
  }

  loadCustomers(): void {
    this.customerSvc.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers.filter(c => c.isActive);
      },
      error: () => {
        this.toast.error('Failed to load customers');
      }
    });
  }

  initForm(): void {
    this.mappingForm = this.fb.group({
      mappings: this.fb.array([])
    });

    // Add initial empty mapping
    this.addMapping();
  }

  createMappingGroup(data?: CreditMappingEntry): FormGroup {
    return this.fb.group({
      customerId: [data?.customerId || 0, [Validators.required, Validators.min(1)]],
      amount: [data?.amount || 0, [Validators.required, Validators.min(0.01)]],
      invoiceNumber: [data?.invoiceNumber || '']
    });
  }

  addMapping(): void {
    this.mappings.push(this.createMappingGroup());
    this.validateMappings();
  }

  removeMapping(index: number): void {
    if (this.mappings.length > 1) {
      this.mappings.removeAt(index);
      this.validateMappings();
    }
  }

  get totalMapped(): number {
    let total = 0;
    for (let i = 0; i < this.mappings.length; i++) {
      const amount = this.mappings.at(i).get('amount')?.value || 0;
      total += Number(amount);
    }
    return total;
  }

  get expectedTotal(): number {
    return this.data?.creditAmount || 0;
  }

  get difference(): number {
    return this.expectedTotal - this.totalMapped;
  }

  get isValid(): boolean {
    return Math.abs(this.difference) < 0.01 && this.mappingForm.valid;
  }

  validateMappings(): void {
    const diff = this.difference;
    
    if (Math.abs(diff) < 0.01) {
      if (this.mappingForm.valid) {
        this.validationError = '';
      } else {
        this.validationError = 'Please fill all required fields';
      }
    } else if (diff > 0) {
      this.validationError = `₹${Math.abs(diff).toFixed(2)} remaining to be mapped`;
    } else {
      this.validationError = `Total exceeds credit amount by ₹${Math.abs(diff).toFixed(2)}`;
    }
  }

  getCustomerName(customerId: number): string {
    return this.customers.find(c => c.customerId === customerId)?.customerName || '';
  }

  onCustomerChange(index: number): void {
    this.validateMappings();
  }

  onAmountChange(): void {
    this.validateMappings();
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  autoDistribute(): void {
    if (this.mappings.length === 0) {
      this.addMapping();
    }
    
    // Find first mapping with zero or empty amount
    for (let i = 0; i < this.mappings.length; i++) {
      const currentAmount = this.mappings.at(i).get('amount')?.value || 0;
      if (currentAmount === 0) {
        this.mappings.at(i).get('amount')?.setValue(this.difference);
        this.validateMappings();
        return;
      }
    }
    
    // If all have amounts, add to last
    const lastIndex = this.mappings.length - 1;
    const lastAmount = this.mappings.at(lastIndex).get('amount')?.value || 0;
    this.mappings.at(lastIndex).get('amount')?.setValue(lastAmount + this.difference);
    this.validateMappings();
  }

  onSave(): void {
    if (!this.isValid) {
      this.toast.error(this.validationError || 'Please correct the errors before saving');
      return;
    }

    this.loading.set(true);

    // Save each mapping
    const savePromises: Promise<any>[] = [];
    
    for (let i = 0; i < this.mappings.length; i++) {
      const mapping = this.mappings.at(i).value;
      
      const request = {
        deliveryId: this.data.deliveryId,
        productId: this.data.productId,
        customerId: mapping.customerId,
        quantity: 1, // For credit sales, quantity is typically 1
        isCreditSale: true,
        paymentMode: 'Credit',
        totalAmount: mapping.amount, // Send the actual credit amount
        invoiceNumber: mapping.invoiceNumber || '',
        remarks: `Credit sale - Amount: ₹${mapping.amount}`
      };

      const promise = this.mappingSvc.createMapping(request).toPromise();
      savePromises.push(promise);
    }

    Promise.all(savePromises)
      .then(() => {
        this.loading.set(false);
        this.toast.success('Credit mappings saved successfully');
        this.saved.emit();
        this.onClose();
      })
      .catch((error) => {
        this.loading.set(false);
        this.toast.error('Failed to save credit mappings: ' + (error?.message || 'Unknown error'));
      });
  }
}
