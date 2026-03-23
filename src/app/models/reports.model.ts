// =============================================
// Reports Module - TypeScript Models
// =============================================

// 1️⃣ Daily Delivery Report
export interface DailyDeliveryReport {
  deliveryId: number;
  deliveryDate: string;
  status: string;
  startTime?: string;
  returnTime?: string;
  driverName: string;
  helperName?: string;
  vehicleNumber: string;
  routeName: string;
  totalProductTypes: number;
  totalQuantity: number;
  productsDetail: string;
  cashCollected: number;
  remarks?: string;
  createdAt: string;
}

// 2️⃣ Daily Cash Collection Report
export interface DailyCashCollectionReport {
  source: string;
  reference: string;
  category: string;
  amount: number;
  paymentMode: string;
  collectionTime: string;
  collectedBy: string;
}

// 3️⃣ Daily Driver Delivery Report
export interface DailyDriverDeliveryReport {
  driverId: number;
  driverName: string;
  totalDeliveries: number;
  totalCylinders: number;
  totalOtherItems: number;
  totalItems: number;
  productsBreakdown: string;
  totalCashCollected: number;
}

// 4️⃣ Daily Helper Delivery Report
export interface DailyHelperDeliveryReport {
  helperId: number;
  helperName: string;
  totalDeliveriesAssisted: number;
  totalCylinders: number;
  totalOtherItems: number;
  totalItems: number;
  productsBreakdown: string;
  deliveriesDetail: string;
}

// 5️⃣ Daily Expense Report
export interface DailyExpenseReport {
  entryId: number;
  entryDate: string;
  type: string;  // 'Income' or 'Expense'
  categoryName: string;
  amount: number;
  paymentMode: string;
  remarks?: string;
  createdAt: string;
  createdBy: string;
  linkedReference?: string;
}

// 6️⃣ Daily Cylinder Stock Report
export interface DailyCylinderStockReport {
  productId: number;
  productName: string;
  categoryName: string;
  subCategoryName: string;
  currentFilled: number;
  currentEmpty: number;
  currentDamaged: number;
  totalStock: number;
  dailyFilledInward: number;
  dailyFilledOutward: number;
  dailyEmptyInward: number;
  dailyEmptyOutward: number;
  dailyDamagedChange: number;
  lastUpdated: string;
}

// 7️⃣ Daily Other Items Stock Report
export interface DailyOtherItemsStockReport {
  productId: number;
  productName: string;
  categoryName: string;
  subCategoryName: string;
  currentStock: number;
  dailyInward: number;
  dailyOutward: number;
  netChange: number;
  lastUpdated: string;
}

// 8️⃣ Performance Report (Drivers & Helpers)
export interface PerformanceReport {
  personId: number;
  personType: string;  // "Driver" or "Helper"
  personName: string;
  totalDeliveries: number;
  contributedItems: number;
  contributedCash: number;
  avgItemsPerDelivery: number;
  completionRate: number;
  dailyBreakdown?: string;
}
