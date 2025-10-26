import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product, ProductUpsertDto } from '../../models/product.model';
import { ProductCategory, ProductSubCategory } from '../../models/category.model';
import { ToastService } from '../../services/toast.service';

@Component({
selector: 'app-product-list',
standalone: true,
imports: [CommonModule, ReactiveFormsModule],
templateUrl: './product-list.component.html'
})
export class ProductListComponent {
private productSvc = inject(ProductService);
private catSvc = inject(CategoryService);
private fb = inject(FormBuilder);
private toastSvc = inject(ToastService);

products: Product[] = [];
categories: ProductCategory[] = [];
subcategories: ProductSubCategory[] = [];

// UI state
isEditing = signal(false);
editId: number | null = null;
loading = signal(false);
error = signal<string | null>(null);

form = this.fb.group({
productName: ['', [Validators.required, Validators.maxLength(200)]],
categoryId: [null as number | null, Validators.required],
subCategoryId: [null as number | null, Validators.required],
unitPrice: [null as number | null],
purchasePrice: [null as number | null],
description: [''],
hsnCode: [''],
isActive: [true]
});

ngOnInit() {
this.loadData();
this.form.get('categoryId')!.valueChanges.subscribe((catId) => {
if (catId) {
this.catSvc.getSubCategories(catId).subscribe({
next: (res) => (this.subcategories = res || []),
error: () => (this.subcategories = [])
});
} else {
this.subcategories = [];
this.form.patchValue({ subCategoryId: null });
}
});
}
loadData() {
this.loading.set(true);
this.error.set(null);


this.catSvc.getCategories().subscribe({
next: (cats) => (this.categories = cats || []),
error: (e) => this.error.set('Failed to load categories')
});


this.productSvc.getProducts().subscribe({
next: (rows) => (this.products = rows || []),
error: (e) => this.error.set('Failed to load products'),
complete: () => this.loading.set(false)
});
}

startCreate() {
this.isEditing.set(true);
this.editId = null;
this.form.reset({ isActive: true });
this.subcategories = [];
}
startEdit(p: Product) {
this.isEditing.set(true);
this.editId = p.productId;
this.form.patchValue({
productName: p.productName,
categoryId: p.categoryId,
subCategoryId: p.subCategoryId,
unitPrice: p.unitPrice,
purchasePrice: p.purchasePrice,
description: p.description || '',
hsnCode: p.hsnCode || '',
isActive: p.isActive
});
// load subcategories for existing category
if (p.categoryId) {
this.catSvc.getSubCategories(p.categoryId).subscribe({
next: (res) => (this.subcategories = res || [])
});
}
}
cancel() {
this.isEditing.set(false);
this.editId = null;
}
submit() {
  if (this.form.invalid) return;
  const dto: ProductUpsertDto = this.form.getRawValue() as ProductUpsertDto;

  const call$ = this.editId
    ? this.productSvc.updateProduct(this.editId, dto)
    : this.productSvc.createProduct(dto);

  this.loading.set(true);
  call$.subscribe({
    next: (res: any) => {
      if (res?.success) {
        this.toastSvc.success(res.message);
        console.log('Current toasts:', this.toastSvc.toasts);

        //this.toaster.addToast({ color: 'success', body: res.message });  // ✅ Success toas
        this.isEditing.set(false);
        this.editId = null;
        this.loadData();
      } else {
        this.toastSvc.error(res?.message || 'Save failed');
      }
    },
    error: () => {
        this.toastSvc.error('Error saving product');
        this.error.set('Save failed');
      },
    complete: () => this.loading.set(false)
  });
}


}