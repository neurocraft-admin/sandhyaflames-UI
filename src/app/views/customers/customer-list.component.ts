import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer, CustomerUpsertDto } from '../../models/customer.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-list.component.html'
})
export class CustomerListComponent {
  private customerSvc = inject(CustomerService);
  private fb = inject(FormBuilder);
  private toastSvc = inject(ToastService);

  customers: Customer[] = [];
  isEditing = signal(false);
  editId: number | null = null;
  loading = signal(false);

  form = this.fb.group({
    customerName: ['', Validators.required],
    contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    email: ['', [Validators.email]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    gstNumber: [''],
    customerType: ['Retail', Validators.required],
    isActive: [true]
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.customerSvc.getCustomers().subscribe({
      next: (rows) => (this.customers = rows || []),
      error: () => this.toastSvc.error('Failed to load customers'),
      complete: () => this.loading.set(false)
    });
  }

  startCreate() {
    this.isEditing.set(true);
    this.editId = null;
    this.form.reset({ isActive: true, customerType: 'Retail' });
  }

  startEdit(c: Customer) {
    this.isEditing.set(true);
    this.editId = c.customerId;
    this.form.patchValue(c);
  }

  cancel() {
    this.isEditing.set(false);
    this.editId = null;
  }

  submit() {
    if (this.form.invalid) {
      this.toastSvc.error('Please fill all required fields correctly');
      return;
    }

    const raw = this.form.getRawValue();
    const dto: Partial<Customer> = {
      customerId: this.editId ?? 0,
      customerName: raw.customerName ?? '',
      contactNumber: raw.contactNumber ?? '',
      email: raw.email ?? '',
      address: raw.address ?? '',
      city: raw.city ?? '',
      pincode: raw.pincode ?? '',
      gstNumber: raw.gstNumber ?? '',
      customerType: raw.customerType ?? 'Retail',
      isActive: raw.isActive ?? true
    };

    this.loading.set(true);
    this.customerSvc.saveCustomer(this.editId, dto).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.isEditing.set(false);
          this.editId = null;
          this.loadCustomers();
        } else {
          this.toastSvc.error(res?.message || 'Save failed');
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastSvc.error('Error saving customer');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  softDelete(id: number) {
    if (!confirm('Mark this customer inactive?')) return;
    this.customerSvc.softDeleteCustomer(id).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.loadCustomers();
        } else {
          this.toastSvc.error(res?.message || 'Delete failed');
        }
      },
      error: () => this.toastSvc.error('Error deleting customer')
    });
  }
}
