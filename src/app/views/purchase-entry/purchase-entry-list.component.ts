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
    vendorId: [0 as number, Validators.required],       // number (not string)
    invoiceNo: ['', Validators.required],
    purchaseDate: ['', Validators.required],
    remarks: [''],
    isActive: [true],
    items: this.fb.array([])
  });

  get items(): FormArray { return this.form.get('items') as FormArray; }

  totalAmount = computed(() =>
    this.items.controls.reduce((sum, ctrl) => {
      const v = ctrl.value as PurchaseEntryItem;
      const qty = Number(v.qty) || 0;
      const price = Number(v.unitPrice) || 0;
      return sum + qty * price;
    }, 0)
  );

  ngOnInit() {
    this.loadAll();
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
    this.form.reset({
      vendorId: 0,
      invoiceNo: '',
      purchaseDate: this.todayISO(),
      remarks: '',
      isActive: true
    });
    this.items.clear();
    this.addItemRow();
  }

  startEdit(row: PurchaseEntry) {
    // Fetch full record with items from API
    this.svc.getById(row.purchaseId).subscribe({
      next: (full) => {
        if (!full) {
          this.toast.error('Purchase not found');
          return;
        }
        this.isEditing.set(true);
        this.editId = full.purchaseId;
        this.form.patchValue({
          vendorId: full.vendorId,
          invoiceNo: full.invoiceNo,
          purchaseDate: (full.purchaseDate || '').substring(0, 10),
          remarks: full.remarks ?? '',
          isActive: full.isActive
        });

        this.items.clear();
        (full.items || []).forEach(it => this.items.push(this.newItemGroup(it)));
        if (this.items.length === 0) this.addItemRow();
      },
      error: () => this.toast.error('Failed to load purchase details')
    });
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
      invoiceNo: (raw.invoiceNo || '').trim(),
      purchaseDate: raw.purchaseDate, // yyyy-MM-dd
      remarks: (raw.remarks || '').trim(),
      isActive: !!raw.isActive,
      items: (raw.items || []).map((it: any) => ({
        productId: Number(it.productId),
        categoryId: Number(it.categoryId),        // ✅ include for API
        subCategoryId: Number(it.subCategoryId),  // ✅ include for API
        qty: Number(it.qty),
        unitPrice: Number(it.unitPrice)
      }))
    };

    this.svc.save(this.editId, payload).subscribe({
      next: (res: { success: number; message: string }) => {
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
      next: (res: { success: number; message: string }) => {
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
    const grp = this.items.at(ix);
    const productId = Number(grp.get('productId')?.value);
    const p = this.products.find(x => x.productId === productId);
    // Auto-fill category/subcategory IDs from selected product
    grp.get('categoryId')?.setValue(p?.categoryId ?? 0);
    grp.get('subCategoryId')?.setValue(p?.subCategoryId ?? 0);
    // (Optional) You could also default unitPrice from pricing module here later.
  }

  getCategoryNameForRow(ix: number): string {
    const pid = Number(this.items.at(ix).get('productId')?.value);
    const p = this.products.find(x => x.productId === pid);
    return p?.categoryName ?? '';
    }

  getSubCategoryNameForRow(ix: number): string {
    const pid = Number(this.items.at(ix).get('productId')?.value);
    const p = this.products.find(x => x.productId === pid);
    return p?.subCategoryName ?? '';
  }

  private newItemGroup(it?: Partial<PurchaseEntryItem>) {
    return this.fb.group({
      productId: [it?.productId ?? 0, Validators.required],
      categoryId: [it?.categoryId ?? 0, Validators.required],        // hidden, auto-filled
      subCategoryId: [it?.subCategoryId ?? 0, Validators.required],  // hidden, auto-filled
      qty: [it?.qty ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [it?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  private todayISO(): string { return new Date().toISOString().substring(0,10); }
}
