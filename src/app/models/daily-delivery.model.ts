// src/app/models/daily-delivery.model.ts
export interface DeliveryItem {
  productId: number;
  noOfCylinders?: number | null;  // For cylinder products
  noOfInvoices?: number | null;   // Number of customer invoices
  noOfItems?: number | null;      // For accessory products
  // noOfDeliveries - DEPRECATED: Not used in business logic
}

export interface DailyDelivery {
  deliveryId?: number;    // ✅ NEW: For edit/update operations
  deliveryDate: string;   // yyyy-MM-dd
  driverId: number;       // driver-first design
  helperId?: number | null; // ✅ NEW: Helper selection
  vehicleId: number;      // ✅ NEW: Vehicle assignment
  routeId?: number | null; // ✅ NEW: Route/Area selection
  routeName?: string;     // ✅ NEW: For display purposes
  startTime: string;      // HH:mm:ss
  returnTime?: string | null;
  remarks?: string | null;
  status?: string;        // ✅ NEW: 'Open' or 'Closed'
  items: DeliveryItem[];
}

/* Route/Area model */
export interface DeliveryRoute {
  routeId: number;
  routeName: string;
  description?: string | null;
  isActive: boolean;
}

/* Delivery Charge model with payment split */
export interface DeliveryCharge {
  deliveryId: number;
  chargeAmount: number;
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  bankAmount: number;
  remarks?: string | null;
}

/* Charge payment split for display */
export interface ChargePaymentSplit {
  paymentMode: string;
  amount: number;
}

/* Request payload used while closing a delivery */
export interface DeliveryCloseRequest {
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  postIncome: boolean;
  paymentMode: string;
}

/* Read model for metrics responses and list view */
export interface DailyDeliveryMetrics {
  deliveryId: number;
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  otherItemsDelivered: number;
  cylindersDelivered: number;
  nonCylItemsDelivered: number;
  invoiceCount: number;
  deliveryCount: number;
  plannedInvoices: number;
}
