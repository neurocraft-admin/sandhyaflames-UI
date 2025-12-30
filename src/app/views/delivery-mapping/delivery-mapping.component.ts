import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DailyDeliveryMappingService } from '../../services/daily-delivery-mapping.service';
import { CustomerService } from '../../services/customer.service';
import { 
  DailyDeliveryItem, 
  CustomerCylinderMapping, 
  DeliveryMappingSummary 
} from '../../models/daily-delivery-mapping.model';
import { Customer } from '../../models/customer.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-delivery-mapping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './delivery-mapping.component.html'
})
export class DeliveryMappingComponent implements OnInit {
  private mappingSvc = inject(DailyDeliveryMappingService);
  private customerSvc = inject(CustomerService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastSvc = inject(ToastService);

  deliveryId: number = 0;
  commercialItems: DailyDeliveryItem[] = [];
  mappings: CustomerCylinderMapping[] = [];
  customers: Customer[] = [];
  summary: DeliveryMappingSummary | null = null;

  showMappingForm = signal(false);
  loading = signal(false);

  mappingForm = this.fb.group({
    productId: [0, Validators.required],
    customerId: [0, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    isCreditSale: [false],
    paymentMode: ['Cash', Validators.required],
    invoiceNumber: [''],
    remarks: ['']
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.deliveryId = +params['id'];
      if (this.deliveryId) {
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading.set(true);
    
    // Load summary
    this.mappingSvc.getDeliverySummary(this.deliveryId).subscribe({
      next: (summary) => this.summary = summary,
      error: () => this.toastSvc.error('Failed to load delivery summary')
    });

    // Load commercial items
    this.mappingSvc.getCommercialItems(this.deliveryId).subscribe({
      next: (items) => {
        this.commercialItems = items;
        this.loading.set(false);
      },
      error: () => {
        this.toastSvc.error('Failed to load commercial items');
        this.loading.set(false);
      }
    });

    // Load existing mappings
    this.loadMappings();

    // Load customers
    this.customerSvc.getCustomers().subscribe({
      next: (customers) => this.customers = customers.filter(c => c.isActive),
      error: () => this.toastSvc.error('Failed to load customers')
    });
  }

  loadMappings() {
    this.mappingSvc.getMappingsByDelivery(this.deliveryId).subscribe({
      next: (mappings) => this.mappings = mappings,
      error: () => this.toastSvc.error('Failed to load mappings')
    });
  }

  openMappingForm(item: DailyDeliveryItem) {
    if (item.remainingQuantity <= 0) {
      this.toastSvc.error('All cylinders for this product are already mapped');
      return;
    }

    this.showMappingForm.set(true);
    this.mappingForm.patchValue({
      productId: item.productId,
      quantity: Math.min(1, item.remainingQuantity),
      isCreditSale: false,
      paymentMode: 'Cash',
      customerId: 0
    });
  }

  cancelMapping() {
    this.showMappingForm.set(false);
    this.mappingForm.reset();
  }

  onCreditSaleChange() {
    const isCreditSale = this.mappingForm.get('isCreditSale')?.value;
    if (isCreditSale) {
      this.mappingForm.patchValue({ paymentMode: 'Credit' });
    } else {
      this.mappingForm.patchValue({ paymentMode: 'Cash' });
    }
  }

  submitMapping() {
    if (this.mappingForm.invalid) {
      this.toastSvc.error('Please fill all required fields');
      return;
    }

    const raw = this.mappingForm.getRawValue();
    const dto = {
      deliveryId: this.deliveryId,
      productId: raw.productId,
      customerId: raw.customerId,
      quantity: raw.quantity,
      isCreditSale: raw.isCreditSale,
      paymentMode: raw.paymentMode,
      invoiceNumber: raw.invoiceNumber,
      remarks: raw.remarks
    };

    this.loading.set(true);
    this.mappingSvc.createMapping(dto).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.showMappingForm.set(false);
          this.loadData();
        } else {
          this.toastSvc.error(res?.message || 'Mapping failed');
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastSvc.error('Error creating mapping');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  deleteMapping(mappingId: number) {
    if (!confirm('Remove this customer mapping?')) return;

    this.mappingSvc.deleteMapping(mappingId).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.toastSvc.success(res.message);
          this.loadData();
        } else {
          this.toastSvc.error(res?.message || 'Delete failed');
        }
      },
      error: () => this.toastSvc.error('Error deleting mapping')
    });
  }

  getProductName(productId: number): string {
    return this.commercialItems.find(i => i.productId === productId)?.productName || '';
  }

  getMaxQuantity(): number {
    const itemId = this.mappingForm.get('productId')?.value;
    const item = this.commercialItems.find(i => i.productId === itemId);
    return item?.remainingQuantity || 1;
  }

  goBack() {
    this.router.navigate(['/DailyDelivery']);
  }
}
