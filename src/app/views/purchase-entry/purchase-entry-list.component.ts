import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { PurchaseEntryService } from '../../services/purchase-entry.service';
import { PurchaseEntry, PurchaseEntryItem } from '../../models/purchase-entry.model';
import { ToastService } from '../../services/toast.service';
import { ProductDropdownService, ProductOption } from '../../services/product-dropdown.service';
import { VendorDropdownService, VendorOption } from '../../services/vendor-dropdown.service';

@Component({
  selector: 'app-purchase-entry-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './purchase-entry-list.component.html'
})
export class PurchaseEntryListComponent {
  private svc = inject(PurchaseEntryService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private productSvc = inject(ProductDropdownService);
  private vendorSvc = inject(VendorDropdownService);

  rows: PurchaseEntry[] = [];
  products: ProductOption[] = [];
  vendors: VendorOption[] = [];

  isEditing = signal(false);
  editId: number | null = null;
  loading = signal(false);

  form = this.fb.group({
  vendorId: [0, Validators.required],   // ✅ default to number 0
  invoiceNo: ['', Validators.required],
  purchaseDate: ['', Validators.required],
  remarks: [''],
  isActive: [true],
  items: this.fb.array([])
});

  get items(): FormArray { return this.form.get('items') as FormArray; }

  totalAmount = computed(() => {
    return this.items.controls.reduce((sum, ctrl) => {
      const v = ctrl.value as PurchaseEntryItem;
      const qty = Number(v.qty) || 0;
      const price = Number(v.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  });

//   ngOnInit() {
//     this.loadAll();
//   }
  ngOnInit() {
  this.svc.getAll().subscribe({ next: (data) => this.rows = data });
  this.vendorSvc.getAll().subscribe({ next: (v) => this.vendors = v });
  this.productSvc.getAll().subscribe({ next: (p) => this.products = p });
}

  loadAll() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => (this.rows = data || []),
      error: () => this.toast.error('Failed to load purchase entries'),
      complete: () => this.loading.set(false)
    });
    this.productSvc.getAll().subscribe({
      next: (p) => (this.products = p || []),
      error: () => this.toast.error('Failed to load products')
    });
    this.vendorSvc.getAll().subscribe({
      next: (v) => (this.vendors = v || []),
      error: () => this.toast.error('Failed to load vendors')
    });
  }

  startCreate() {
    this.isEditing.set(true);
    this.editId = null;
    this.form.reset({ isActive: true, purchaseDate: this.todayISO() });
    this.items.clear();
    this.addItemRow();
  }

  startEdit(row: PurchaseEntry) {
    this.isEditing.set(true);
    this.editId = row.purchaseId;

    this.form.patchValue({
      vendorId: row.vendorId,
      invoiceNo: row.invoiceNo,
      purchaseDate: row.purchaseDate?.substring(0, 10),
      remarks: row.remarks ?? '',
      isActive: row.isActive
    });

    this.items.clear();
    (row.items || []).forEach(it => this.items.push(this.newItemGroup(it)));
    if (this.items.length === 0) this.addItemRow();
  }

  cancel() {
    this.isEditing.set(false);
    this.editId = null;
  }

  submit() {
    if (this.form.invalid || this.items.length === 0) {
      this.toast.error('Please fill required fields and add at least one item');
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      vendorId: Number(raw.vendorId),
      invoiceNo: raw.invoiceNo?.trim(),
      purchaseDate: raw.purchaseDate, // yyyy-MM-dd
      remarks: raw.remarks?.trim() || '',
      isActive: !!raw.isActive,
      items: (raw.items || []).map((it: any) => ({
        productId: Number(it.productId),
        qty: Number(it.qty),
        unitPrice: Number(it.unitPrice)
      }))
    };

    this.svc.save(this.editId, payload).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success(res.message || 'Saved');
          this.isEditing.set(false);
          this.editId = null;
          this.loadAll();
        } else {
          this.toast.error(res?.message || 'Save failed');
        }
      },
      error: () => this.toast.error('Error saving purchase entry')
    });
  }

  toggleActive(row: PurchaseEntry) {
    const desired = !row.isActive;
    this.svc.toggleActive(row.purchaseId, desired).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success(res.message || 'Status updated');
          this.loadAll();
        } else {
          this.toast.error(res?.message || 'Update failed');
        }
      },
      error: () => this.toast.error('Error updating status')
    });
  }

  addItemRow() { this.items.push(this.newItemGroup()); }
  removeItemRow(ix: number) { this.items.removeAt(ix); }

  onProductChange(ix: number) {
    // If you want to auto-fill price from Pricing API later, hook here
  }

  private newItemGroup(it?: Partial<PurchaseEntryItem>) {
    return this.fb.group({
      productId: [it?.productId ?? '', Validators.required],
      qty: [it?.qty ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [it?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  private todayISO(): string { return new Date().toISOString().substring(0,10); }
}