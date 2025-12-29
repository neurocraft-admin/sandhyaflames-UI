// customer.model.ts
export interface Customer {
  customerId: number;
  customerName: string;
  contactNumber: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  gstNumber: string;
  customerType: string;  // 'Retail', 'Commercial', 'Industrial'
  isActive: boolean;
  createdAt: string;
}

export type CustomerUpsertDto = {
  customerName: string;
  contactNumber: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  gstNumber: string;
  customerType: string;
  isActive: boolean;
};
