import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductPricingService } from '../../services/product-pricing.service';
import { ProductDropdownService, ProductOption } from '../../services/product-dropdown.service';
import { ToastService } from '../../services/toast.service';
import { ProductPricing } from '../../models/product-pricing.model';

@Component({
  selector: 'app-product-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-pricing.component.html'
})
export class ProductPricingComponent {
  private fb = inject(FormBuilder);
  private svc = inject(ProductPricingService);
  private toast = inject(ToastService);
  private productSvc = inject(ProductDropdownService);

  rows: any[] = [];
  history: any[] = [];
  products: ProductOption[] = [];

  isEditing = signal(false);

  form = this.fb.group({
    productId: [0, Validators.required],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    effectiveDate: ['', Validators.required]
  });

  ngOnInit() {
    this.loadAll();
    this.productSvc.getAll().subscribe({
      next: (p) => this.products = p || [],
      error: () => this.toast.error('Failed to load products')
    });
  }

  loadAll() {
    this.svc.getActive().subscribe({
      next: (data) => this.rows = data || [],
      error: () => this.toast.error('Failed to load prices')
    });
  }

  startCreate() {
    this.isEditing.set(true);
    this.form.reset({
      productId: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      effectiveDate: this.todayISO()
    });
  }

  cancel() {
    this.isEditing.set(false);
  }

  submit() {
    if (this.form.invalid) {
      this.toast.error('Fill all fields');
      return;
    }
    const payload = this.form.getRawValue() as ProductPricing;
    this.svc.setPrice(payload).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Saved');
        this.isEditing.set(false);
        this.loadAll();
      },
      error: () => this.toast.error('Save failed')
    });
  }

  viewHistory(productId: number) {
    this.svc.getHistory(productId).subscribe({
      next: (res) => this.history = res || [],
      error: () => this.toast.error('Failed to load history')
    });
  }

  private todayISO(): string {
    return new Date().toISOString().substring(0,10);
  }
}
