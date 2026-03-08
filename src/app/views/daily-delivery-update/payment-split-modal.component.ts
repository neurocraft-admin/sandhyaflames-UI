import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentSplitBreakdown } from '../../models/daily-delivery-item-actual.model';

export interface PaymentSplitModalData {
  productName: string;
  totalAmount: number;
  currentSplit?: PaymentSplitBreakdown;
}

@Component({
  selector: 'app-payment-split-modal',
  templateUrl: './payment-split-modal.component.html',
  styleUrls: ['./payment-split-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PaymentSplitModalComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() data!: PaymentSplitModalData;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PaymentSplitBreakdown>();

  splitForm!: FormGroup;
  validationError: string = '';

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reinitialize form whenever data input changes (switching between rows)
    if (changes['data'] && !changes['data'].firstChange && this.splitForm) {
      this.initForm();
    }
  }

  initForm(): void {
    const currentSplit = this.data?.currentSplit || { cash: 0, upi: 0, card: 0, bank: 0, credit: 0 };
    
    this.splitForm = this.fb.group({
      cash: [currentSplit.cash, [Validators.required, Validators.min(0)]],
      upi: [currentSplit.upi, [Validators.required, Validators.min(0)]],
      card: [currentSplit.card, [Validators.required, Validators.min(0)]],
      bank: [currentSplit.bank, [Validators.required, Validators.min(0)]],
      credit: [currentSplit.credit, [Validators.required, Validators.min(0)]]
    });

    // Subscribe to form changes to validate in real-time
    this.splitForm.valueChanges.subscribe(() => {
      this.validateSplit();
    });

    // Initial validation
    this.validateSplit();
  }

  get currentTotal(): number {
    const values = this.splitForm.value;
    return (values.cash || 0) + (values.upi || 0) + (values.card || 0) + (values.bank || 0) + (values.credit || 0);
  }

  get expectedTotal(): number {
    return this.data?.totalAmount || 0;
  }

  get difference(): number {
    return this.expectedTotal - this.currentTotal;
  }

  get isValid(): boolean {
    return Math.abs(this.difference) < 0.01; // Allow for rounding errors
  }

  validateSplit(): void {
    const diff = this.difference;
    
    if (Math.abs(diff) < 0.01) {
      this.validationError = '';
    } else if (diff > 0) {
      this.validationError = `Payment split is ₹${Math.abs(diff).toFixed(2)} short`;
    } else {
      this.validationError = `Payment split exceeds by ₹${Math.abs(diff).toFixed(2)}`;
    }
  }

  onSave(): void {
    if (!this.isValid) {
      return;
    }

    if (this.splitForm.invalid) {
      return;
    }

    const breakdown: PaymentSplitBreakdown = {
      cash: this.splitForm.value.cash || 0,
      upi: this.splitForm.value.upi || 0,
      card: this.splitForm.value.card || 0,
      bank: this.splitForm.value.bank || 0,
      credit: this.splitForm.value.credit || 0
    };

    this.save.emit(breakdown);
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Close modal when clicking on backdrop (outside modal content)
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Helper method to distribute remaining amount to first empty field
  autoDistribute(): void {
    if (this.difference <= 0) return;

    const values = this.splitForm.value;
    
    // Find first field with 0 value and set it to the difference
    if (values.cash === 0) {
      this.splitForm.patchValue({ cash: this.difference });
    } else if (values.upi === 0) {
      this.splitForm.patchValue({ upi: this.difference });
    } else if (values.card === 0) {
      this.splitForm.patchValue({ card: this.difference });
    } else if (values.bank === 0) {
      this.splitForm.patchValue({ bank: this.difference });
    } else {
      // All fields have values, add to cash
      this.splitForm.patchValue({ cash: values.cash + this.difference });
    }
  }

  clearAll(): void {
    // Reset all fields including credit
    this.splitForm.reset({
      cash: 0,
      upi: 0,
      card: 0,
      bank: 0,
      credit: 0
    });
    
    // Mark form as pristine and untouched to reset validation state
    this.splitForm.markAsPristine();
    this.splitForm.markAsUntouched();
    
    // Force recalculation of validation
    this.validateSplit();
  }
}
