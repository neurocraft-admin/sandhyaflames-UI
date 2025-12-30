import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerCreditService } from '../../services/customer-credit.service';
import { CustomerService } from '../../services/customer.service';
import { CustomerCredit, CreditTransaction } from '../../models/customer-credit.model';
import { Customer } from '../../models/customer.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-customer-credit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-credit.component.html'
})
export class CustomerCreditComponent {
  private creditSvc = inject(CustomerCreditService);
  private customerSvc = inject(CustomerService);
  private fb = inject(FormBuilder);
  private toastSvc = inject(ToastService);

  credits: CustomerCredit[] = [];
  customers: Customer[] = [];
  transactions: CreditTransaction[] = [];
  
  selectedCustomerId: number | null = null;
  showCreditForm = signal(false);
  showPaymentForm = signal(false);
  showTransactions = signal(false);
  loading = signal(false);

  creditForm = this.fb.group({
    customerId: [0, Validators.required],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    isActive: [true]
  });

  paymentForm = this.fb.group({
    customerId: [0, Validators.required],
    paymentAmount: [0, [Validators.required, Validators.min(1)]],
    paymentMode: ['Cash', Validators.required],
    referenceNumber: [''],
    paymentDate: [this.today(), Validators.required],
    remarks: ['']
  });

  ngOnInit() {
    this.loadCredits();
    this.loadCustomers();
  }

  loadCredits() {
    this.loading.set(true);
    this.creditSvc.getCustomerCredits().subscribe({
      next: (rows) => (this.credits = rows || []),
      error: () => this.toastSvc.error('Failed to load credits'),
      complete: () => this.loading.set(false)
    });
  }

  loadCustomers() {
    this.customerSvc.getCustomers().subscribe({
      next: (rows) => (this.customers = rows.filter(c => c.isActive) || []),
      error: () => this.toastSvc.error('Failed to load customers')
    });
  }

  openCreditForm() {
    this.showCreditForm.set(true);
    this.creditForm.reset({ isActive: true, creditLimit: 0, customerId: 0 });
  }

  openPaymentForm() {
    this.showPaymentForm.set(true);
    this.paymentForm.reset({ 
      paymentMode: 'Cash', 
      paymentDate: this.today(),
      customerId: 0,
      paymentAmount: 0
    });
  }

  cancelCreditForm() {
    this.showCreditForm.set(false);
  }

  cancelPaymentForm() {
    this.showPaymentForm.set(false);
  }

  submitCredit() {
    if (this.creditForm.invalid) {
      this.toastSvc.error('Please fill all required fields');
      return;
    }

    const raw = this.creditForm.getRawValue();
    this.loading.set(true);
    this.creditSvc.saveCreditLimit(raw).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.showCreditForm.set(false);
          this.loadCredits();
        } else {
          this.toastSvc.error(res?.message || 'Save failed');
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastSvc.error('Error saving credit limit');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.toastSvc.error('Please fill all required fields');
      return;
    }

    const raw = this.paymentForm.getRawValue();
    this.loading.set(true);
    this.creditSvc.recordPayment(raw).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.showPaymentForm.set(false);
          this.loadCredits();
        } else {
          this.toastSvc.error(res?.message || 'Payment failed');
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastSvc.error('Error recording payment');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  viewTransactions(customerId: number) {
    this.selectedCustomerId = customerId;
    this.showTransactions.set(true);
    this.creditSvc.getTransactionsByCustomer(customerId).subscribe({
      next: (rows) => (this.transactions = rows || []),
      error: () => this.toastSvc.error('Failed to load transactions')
    });
  }

  closeTransactions() {
    this.showTransactions.set(false);
    this.transactions = [];
    this.selectedCustomerId = null;
  }

  getCustomerName(customerId: number): string {
    return this.customers.find(c => c.customerId === customerId)?.customerName || '';
  }

  private today(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
