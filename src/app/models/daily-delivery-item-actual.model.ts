export interface DailyDeliveryItemActual {
  actualId?: number;
  deliveryId: number;
  productId: number;
  productName: string;
  categoryName: string;
  plannedQuantity: number;
  deliveredQuantity: number;
  pendingQuantity: number;
  emptyReturned: number;
  damagedReturned: number;
  cashCollected: number;
  itemStatus: 'Completed' | 'Partial' | 'Pending';
  remarks?: string;
  updatedAt?: Date;
  unitPrice: number;
  totalAmount: number;
}

export interface UpdateItemActualsRequest {
  items: ItemActualInput[];
}

export interface ItemActualInput {
  productId: number;
  delivered: number;
  pending: number;
  emptyReturned: number;
  damagedReturned: number;
  cashCollected: number;
  remarks?: string;
}

export interface DeliveryWithItems {
  delivery: {
    deliveryId: number;
    deliveryDate: string;
    vehicleId: number;
    vehicleNumber: string;
    status: string;
    returnTime?: string;
    remarks?: string;
    completedInvoices: number;
    pendingInvoices: number;
    cashCollected: number;
    emptyCylindersReturned: number;
  };
  items: DailyDeliveryItemActual[];
}

export interface CloseDeliveryWithItemsRequest {
  returnTime: string;
  emptyCylindersReturned: number;
  remarks?: string;
}
