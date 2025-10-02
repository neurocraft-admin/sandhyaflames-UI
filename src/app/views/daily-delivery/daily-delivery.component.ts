// views/daily-delivery/daily-delivery.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ProductDropdownService, ProductOption } from '../../services/product-dropdown.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-daily-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './daily-delivery.component.html'
})
export class DailyDeliveryComponent {
  private fb = inject(FormBuilder);
  private svc = inject(DailyDeliveryService);
  private productSvc = inject(ProductDropdownService);
  private toast = inject(ToastService);

  products: ProductOption[] = [];
  isEditing = signal(true);

  form = this.fb.group({
    deliveryDate: [this.today(), Validators.required],
    vehicleId: [0, Validators.required],
    startTime: ['08:00:00', Validators.required],
    returnTime: [null],   // ✅ null by default, not empty string
    remarks: [''],
    driverIds: this.fb.control<number[]>([]),
    items: this.fb.array([])
  });

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(){
    this.productSvc.getAll().subscribe(p => this.products = p || []);
    this.addItemRow();
  }

  addItemRow(){
    this.items.push(this.fb.group({
      productId: [0, Validators.required],
      categoryId: [0, Validators.required],
      subCategoryId: [null],
      noOfCylinders: [null],
      noOfInvoices: [null],
      noOfDeliveries: [null],
      noOfItems: [1, [Validators.required, Validators.min(1)]]
    }));
  }
// Inside DailyDeliveryComponent class

getCategoryName(productId: number): string {
  const prod = this.products.find(p => p.productId === productId);
  return prod?.categoryName ?? '-';
}

getSubCategoryName(productId: number): string {
  const prod = this.products.find(p => p.productId === productId);
  return prod?.subCategoryName ?? '-';
}

  onProductChange(ix: number){
    const grp = this.items.at(ix);
    const pid = Number(grp.get('productId')?.value);
    const p = this.products.find(x => x.productId === pid);
    grp.get('categoryId')?.setValue(p?.categoryId ?? 0);
    grp.get('subCategoryId')?.setValue(p?.subCategoryId ?? null);
  }

  // ✅ Ensure returnTime is null if empty string
  private normalizePayload(payload: any) {
    if (payload.returnTime === '' || payload.returnTime === undefined) {
      payload.returnTime = null;
    }
    return payload;
  }

  submit(){
    if(this.form.invalid || this.items.length === 0){
      this.toast.error('Fill required fields and add at least one item');
      return;
    }
    let payload = this.form.getRawValue();
    payload = this.normalizePayload(payload);

    this.svc.create(payload as any).subscribe({
      next: (res) => { this.toast.success('Delivery created'); },
      error: () => this.toast.error('Create failed')
    });
  }

  private today(){ return new Date().toISOString().substring(0,10); }
}
