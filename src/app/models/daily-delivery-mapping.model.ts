// daily-delivery-mapping.model.ts
export interface DailyDeliveryItem {
  deliveryId: number;
  productId: number;
  productName: string;
  categoryName: string;
  noOfCylinders: number;
  noOfInvoices: number;
  noOfDeliveries: number;
  mappedQuantity: number;
  remainingQuantity: number;
  sellingPrice: number;
}

export interface CustomerCylinderMapping {
  mappingId: number;
  deliveryId: number;
  productId: number;
  productName: string;
  customerId: number;
  customerName: string;
  quantity: number;
  sellingPrice: number;
  totalAmount: number;
  isCreditSale: boolean;
  paymentMode: string; // 'Cash', 'Credit', 'Card', 'UPI'
  invoiceNumber: string;
  remarks: string;
  createdAt: string;
}

export interface DeliveryMappingSummary {
  deliveryId: number;
  deliveryDate: string;
  driverName: string;
  vehicleNo: string;
  totalCommercialCylinders: number;
  mappedCylinders: number;
  unmappedCylinders: number;
}

export type CustomerCylinderMappingDto = {
  deliveryId: number;
  deliveryItemId: number;
  customerId: number;
  quantity: number;
  isCreditSale: boolean;
  paymentMode: string;
  invoiceNumber: string;
  remarks: string;
};
