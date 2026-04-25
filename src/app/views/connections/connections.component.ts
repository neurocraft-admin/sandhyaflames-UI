import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective } from '@coreui/angular';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { ConnectionService, SaveNewConnectionRequest, SaveTransferRequest, SaveSurrenderRequest, PaymentSplitBreakdown } from '../../services/connection.service';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';
import { PaymentSplitModalComponent, PaymentSplitModalData } from '../daily-delivery-update/payment-split-modal.component';

interface ConnectionItem {
  itemType: 'product' | 'service' | 'deposit';
  itemId?: number;
  itemName: string;
  price: number;
  quantity: number;
  totalAmount: number;
}

@Component({
  selector: 'app-connections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonDirective, PaymentSplitModalComponent],
  templateUrl: './connections.component.html'
})
export class ConnectionsComponent {
  private customerSvc = inject(CustomerService);
  private productSvc = inject(ProductService);
  private connectionSvc = inject(ConnectionService);
  private fb = inject(FormBuilder);
  private toastSvc = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  customers: Customer[] = [];
  products: Product[] = [];
  connectionItems: ConnectionItem[] = [];
  
  loading = signal(false);
  isEditMode = signal(false);
  editConnectionId = signal<number | null>(null);

  // Payment Split Modal
  showPaymentSplitModal = signal(false);
  paymentSplit: PaymentSplitBreakdown = { cash: 0, upi: 0, card: 0, bank: 0, credit: 0 };
  // ✅ FIX: Cache modal data to prevent unnecessary reinitialization
  private _cachedModalData: PaymentSplitModalData | null = null;

  connectionForm = this.fb.group({
    connectionType: ['NewConnection', Validators.required],
    customerId: [0, Validators.required],
    productId: [0],
    quantity: [1, [Validators.required, Validators.min(1)]],
    serviceChargeAmount: [0, [Validators.min(0)]],
    depositAmount: [0, [Validators.min(0)]]
  });

  ngOnInit() {
    this.loadCustomers();
    this.loadProducts();
    
    // Initialize with Service Charge and Deposit as default items
    this.addDefaultItems();

    // Check for edit query param
    this.route.queryParams.subscribe(params => {
      const editId = params['edit'];
      if (editId) {
        this.loadConnectionForEdit(+editId);
      }
    });
  }

  loadCustomers() {
    this.customerSvc.getCustomers().subscribe({
      next: (rows) => {
        this.customers = rows.filter(c => c.isActive) || [];
      },
      error: () => this.toastSvc.error('Failed to load customers')
    });
  }

  loadProducts() {
    this.productSvc.getProducts().subscribe({
      next: (rows) => {
        this.products = rows.filter(p => p.isActive) || [];
      },
      error: () => this.toastSvc.error('Failed to load products')
    });
  }

  loadConnectionForEdit(connectionId: number) {
    this.loading.set(true);
    this.connectionSvc.getConnectionById(connectionId).subscribe({
      next: (connection) => {
        this.editConnectionId.set(connectionId);
        this.isEditMode.set(true);
        
        // Populate form
        this.connectionForm.patchValue({
          connectionType: connection.transactionType,
          customerId: connection.customerId,
          productId: connection.productId,
          quantity: connection.quantity
        });

        // Clear and rebuild items
        this.connectionItems = [];

        // Add product
        const product = this.products.find(p => p.productId === connection.productId);
        if (product) {
          this.connectionItems.push({
            itemType: 'product',
            itemId: connection.productId,
            itemName: connection.productName,
            price: product.unitPrice || 0,
            quantity: connection.quantity,
            totalAmount: (product.unitPrice || 0) * connection.quantity
          });
        }

        // Add service charge
        this.connectionItems.push({
          itemType: 'service',
          itemName: 'Service Charge',
          price: connection.serviceChargeAmount,
          quantity: 1,
          totalAmount: connection.serviceChargeAmount
        });

        // Add deposit
        this.connectionItems.push({
          itemType: 'deposit',
          itemName: 'Deposit',
          price: connection.depositAmount,
          quantity: 1,
          totalAmount: connection.depositAmount
        });

        this.loading.set(false);
        this.toastSvc.info('Connection loaded for editing');
      },
      error: (err) => {
        this.loading.set(false);
        this.toastSvc.error('Failed to load connection: ' + (err.error?.message || err.message));
      }
    });
  }

  goBack() {
    this.router.navigate(['/connections/list']);
  }

  addDefaultItems() {
    // Add Service Charge placeholder
    this.connectionItems.push({
      itemType: 'service',
      itemName: 'Service Charge',
      price: 0,
      quantity: 1,
      totalAmount: 0
    });

    // Add Deposit placeholder
    this.connectionItems.push({
      itemType: 'deposit',
      itemName: 'Deposit',
      price: 0,
      quantity: 1,
      totalAmount: 0
    });
  }

  addProduct() {
    const productId = this.connectionForm.get('productId')?.value;
    const quantity = this.connectionForm.get('quantity')?.value || 1;

    if (!productId || productId === 0) {
      this.toastSvc.error('Please select a product');
      return;
    }

    const product = this.products.find(p => p.productId === productId);
    if (!product) {
      this.toastSvc.error('Product not found');
      return;
    }

    // Check if product already exists in the grid
    const existingProduct = this.connectionItems.find(
      item => item.itemType === 'product' && item.itemId === productId
    );

    if (existingProduct) {
      // Update quantity and total
      existingProduct.quantity += quantity;
      existingProduct.totalAmount = existingProduct.price * existingProduct.quantity;
      this.toastSvc.success('Product quantity updated');
    } else {
      // Add new product to grid (before service charge and deposit)
      const insertIndex = this.connectionItems.findIndex(
        item => item.itemType === 'service' || item.itemType === 'deposit'
      );
      
      const newItem: ConnectionItem = {
        itemType: 'product',
        itemId: product.productId,
        itemName: product.productName,
        price: product.unitPrice || 0,
        quantity: quantity,
        totalAmount: (product.unitPrice || 0) * quantity
      };

      if (insertIndex >= 0) {
        this.connectionItems.splice(insertIndex, 0, newItem);
      } else {
        this.connectionItems.push(newItem);
      }
      
      this.toastSvc.success('Product added to connection');
    }

    // Reset product selection
    this.connectionForm.patchValue({ productId: 0, quantity: 1 });
  }

  removeItem(index: number) {
    const item = this.connectionItems[index];
    
    // Don't allow removing service charge and deposit
    if (item.itemType === 'service' || item.itemType === 'deposit') {
      this.toastSvc.error('Service Charge and Deposit cannot be removed');
      return;
    }

    this.connectionItems.splice(index, 1);
    this.toastSvc.success('Item removed');
  }

  updateCustomAmount(index: number, newAmount: string) {
    const amount = parseFloat(newAmount) || 0;
    const item = this.connectionItems[index];
    
    item.price = amount;
    item.totalAmount = amount * item.quantity;
  }

  updateQuantity(index: number, newQty: string) {
    const qty = parseInt(newQty) || 1;
    const item = this.connectionItems[index];
    
    item.quantity = qty;
    item.totalAmount = item.price * qty;
  }

  get totalAmount(): number {
    return this.connectionItems.reduce((sum, item) => sum + item.totalAmount, 0);
  }

  get paymentSplitModalData(): PaymentSplitModalData {
    // ✅ FIX: Return cached object to prevent ngOnChanges triggering on every change detection
    if (this._cachedModalData && 
        this._cachedModalData.totalAmount === this.totalAmount) {
      return this._cachedModalData;
    }
    
    this._cachedModalData = {
      productName: 'Connection Payment',
      totalAmount: this.totalAmount,
      currentSplit: this.paymentSplit,
      disableCredit: false
    };
    
    return this._cachedModalData;
  }

  openPaymentSplitModal() {
    // Initialize default split if not set
    if (this.paymentSplit.cash === 0 && this.paymentSplit.upi === 0 && 
        this.paymentSplit.card === 0 && this.paymentSplit.bank === 0 && 
        this.paymentSplit.credit === 0) {
      // Default to full amount in cash
      this.paymentSplit =  { 
        cash: this.totalAmount, 
        upi: 0, 
        card: 0, 
        bank: 0, 
        credit: 0 
      };
    }
    
    // ✅ FIX: Create new cached modal data when opening
    this._cachedModalData = {
      productName: 'Connection Payment',
      totalAmount: this.totalAmount,
      currentSplit: { ...this.paymentSplit }, // Clone to avoid reference issues
      disableCredit: false
    };
    
    this.showPaymentSplitModal.set(true);
  }

  onPaymentSplitSave(splitData: PaymentSplitBreakdown) {
    this.paymentSplit = splitData;
    this.showPaymentSplitModal.set(false);
    this._cachedModalData = null; // Clear cache after save
    this.toastSvc.success('Payment split saved');
  }

  closePaymentSplitModal() {
    this.showPaymentSplitModal.set(false);
    this._cachedModalData = null; // Clear cache on close
  }

  get hasPaymentSplit(): boolean {
    return this.paymentSplit.cash > 0 || this.paymentSplit.upi > 0 || 
           this.paymentSplit.card > 0 || this.paymentSplit.bank > 0 || 
           this.paymentSplit.credit > 0;
  }

  get connectionTypeName(): string {
    const type = this.connectionForm.get('connectionType')?.value;
    switch (type) {
      case 'NewConnection': return 'New Connection';
      case 'ConnectionTransfer': return 'Connection Transfer';
      case 'CylinderSurrender': return 'Cylinder Surrender';
      default: return '';
    }
  }

  get connectionTypeDescription(): string {
    const type = this.connectionForm.get('connectionType')?.value;
    switch (type) {
      case 'NewConnection': 
        return 'Customer receives a new gas connection. Reduces filled stock. Collects deposit and service charge.';
      case 'ConnectionTransfer': 
        return 'Customer returns cylinder for connection transfer. Increases empty stock. Refunds deposit, collects service charge.';
      case 'CylinderSurrender': 
        return 'Customer permanently surrenders connection. Increases empty stock. Refunds deposit, collects service charge.';
      default: return '';
    }
  }

  get connectionTypeIcon(): string {
    const type = this.connectionForm.get('connectionType')?.value;
    switch (type) {
      case 'NewConnection': return '🆕';
      case 'ConnectionTransfer': return '🔄';
      case 'CylinderSurrender': return '🔚';
      default: return 'ℹ️';
    }
  }

  get connectionTypeAlertClass(): string {
    const type = this.connectionForm.get('connectionType')?.value;
    switch (type) {
      case 'NewConnection': return 'alert-success border-success';
      case 'ConnectionTransfer': return 'alert-warning border-warning';
      case 'CylinderSurrender': return 'alert-danger border-danger';
      default: return 'alert-info';
    }
  }

  get connectionTypeCardClass(): string {
    const type = this.connectionForm.get('connectionType')?.value;
    switch (type) {
      case 'NewConnection': return 'border-success';
      case 'ConnectionTransfer': return 'border-warning';
      case 'CylinderSurrender': return 'border-danger';
      default: return '';
    }
  }

  get connectionTypeTextClass(): string {
    const type = this.connectionForm.get('connectionType')?.value;
    switch (type) {
      case 'NewConnection': return 'text-success';
      case 'ConnectionTransfer': return 'text-warning';
      case 'CylinderSurrender': return 'text-danger';
      default: return 'text-info';
    }
  }

  resetForm() {
    this.connectionForm.reset({
      connectionType: 'NewConnection',
      customerId: 0,
      productId: 0,
      quantity: 1,
      serviceChargeAmount: 0,
      depositAmount: 0
    });
    
    // Clear items and re-add default items
    this.connectionItems = [];
    this.addDefaultItems();
    this.isEditMode.set(false);
    
    // Reset payment split
    this.paymentSplit = { cash: 0, upi: 0, card: 0, bank: 0, credit: 0 };
  }

  saveConnection() {
    if (this.connectionForm.get('customerId')?.value === 0) {
      this.toastSvc.error('Please select a customer');
      return;
    }

    const productItems = this.connectionItems.filter(item => item.itemType === 'product');
    if (productItems.length === 0) {
      this.toastSvc.error('Please add at least one product');
      return;
    }

    // Get form values
    const connectionType = this.connectionForm.get('connectionType')?.value || 'NewConnection';
    const customerId = this.connectionForm.get('customerId')?.value || 0;
    
    // Get product and quantities from grid
    const productId = productItems[0].itemId || 0;
    const quantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get amounts from grid
    const serviceChargeItem = this.connectionItems.find(item => item.itemType === 'service');
    const depositItem = this.connectionItems.find(item => item.itemType === 'deposit');
    const serviceChargeAmount = serviceChargeItem?.totalAmount || 0;
    const depositAmount = depositItem?.totalAmount || 0;

    // Get payment mode (default to Cash for now)
    const paymentMode = 'Cash';
    
    // Get transaction date (today)
    const transactionDate = new Date().toISOString().split('T')[0];

    this.loading.set(true);

    // Call appropriate API based on connection type
    if (connectionType === 'NewConnection') {
      const request: SaveNewConnectionRequest = {
        transactionDate,
        customerId,
        productId,
        quantity,
        depositAmount,
        serviceChargeAmount,
        paymentMode,
        paymentSplit: this.hasPaymentSplit ? this.paymentSplit : undefined
      };
      
      this.connectionSvc.saveNewConnection(request).subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.toastSvc.success(`New Connection saved successfully! Transaction No: ${response.transactionNo}`);
            this.resetForm();
          } else {
            this.toastSvc.error(response.message || 'Failed to save connection');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.toastSvc.error(err.error?.message || 'Failed to save connection');
        }
      });
    } else if (connectionType === 'ConnectionTransfer') {
      const request: SaveTransferRequest = {
        transactionDate,
        customerId,
        productId,
        quantity,
        depositAmount,
        serviceChargeAmount,
        paymentMode,
        paymentSplit: this.hasPaymentSplit ? this.paymentSplit : undefined
      };
      
      this.connectionSvc.saveTransfer(request).subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.toastSvc.success(`Transfer saved successfully! Transaction No: ${response.transactionNo}`);
            this.resetForm();
          } else {
            this.toastSvc.error(response.message || 'Failed to save transfer');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.toastSvc.error(err.error?.message || 'Failed to save transfer');
        }
      });
    } else if (connectionType === 'CylinderSurrender') {
      const request: SaveSurrenderRequest = {
        transactionDate,
        customerId,
        productId,
        quantity,
        depositAmount,
        serviceChargeAmount,
        paymentMode,
        paymentSplit: this.hasPaymentSplit ? this.paymentSplit : undefined
      };
      
      this.connectionSvc.saveSurrender(request).subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.success) {
            this.toastSvc.success(`Surrender saved successfully! Transaction No: ${response.transactionNo}`);
            this.resetForm();
          } else {
            this.toastSvc.error(response.message || 'Failed to save surrender');
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.toastSvc.error(err.error?.message || 'Failed to save surrender');
        }
      });
    }
  }

  editConnection() {
    this.isEditMode.set(true);
    this.toastSvc.info('Edit mode activated');
  }
}
