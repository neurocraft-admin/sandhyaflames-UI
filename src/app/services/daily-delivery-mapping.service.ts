// daily-delivery-mapping.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  DailyDeliveryItem, 
  CustomerCylinderMapping, 
  DeliveryMappingSummary 
} from '../models/daily-delivery-mapping.model';
import { environment } from '../../environments/environment';

const MAPPING_URL = `${environment.apiUrl}/delivery-mapping`;

@Injectable({ providedIn: 'root' })
export class DailyDeliveryMappingService {
  private http = inject(HttpClient);

  // GET commercial items for a delivery
  getCommercialItems(deliveryId: number): Observable<DailyDeliveryItem[]> {
    return this.http.get<any[]>(`${MAPPING_URL}/commercial-items/${deliveryId}`).pipe(
      map(rows => (rows || []).map(item => ({
        deliveryId: item.DeliveryId ?? item.deliveryId,
        productId: item.ProductId ?? item.productId,
        productName: item.ProductName ?? item.productName,
        categoryName: item.CategoryName ?? item.categoryName,
        noOfCylinders: item.NoOfCylinders ?? item.noOfCylinders ?? 0,
        noOfInvoices: item.NoOfInvoices ?? item.noOfInvoices ?? 0,
        noOfDeliveries: item.NoOfDeliveries ?? item.noOfDeliveries ?? 0,
        mappedQuantity: item.MappedQuantity ?? item.mappedQuantity ?? 0,
        remainingQuantity: item.RemainingQuantity ?? item.remainingQuantity ?? 0,
        sellingPrice: item.SellingPrice ?? item.sellingPrice ?? 0
      } as DailyDeliveryItem)))
    );
  }

  // GET mappings for a delivery
  getMappingsByDelivery(deliveryId: number): Observable<CustomerCylinderMapping[]> {
    return this.http.get<any[]>(`${MAPPING_URL}/delivery/${deliveryId}`).pipe(
      map(rows => (rows || []).map(m => ({
        mappingId: m.MappingId ?? m.mappingId,
        deliveryId: m.DeliveryId ?? m.deliveryId,
        productId: m.ProductId ?? m.productId,
        productName: m.ProductName ?? m.productName,
        customerId: m.CustomerId ?? m.customerId,
        customerName: m.CustomerName ?? m.customerName,
        quantity: m.Quantity ?? m.quantity ?? 0,
        sellingPrice: m.SellingPrice ?? m.sellingPrice ?? 0,
        totalAmount: m.TotalAmount ?? m.totalAmount ?? 0,
        isCreditSale: m.IsCreditSale ?? m.isCreditSale ?? false,
        paymentMode: m.PaymentMode ?? m.paymentMode ?? 'Cash',
        invoiceNumber: m.InvoiceNumber ?? m.invoiceNumber ?? '',
        remarks: m.Remarks ?? m.remarks ?? '',
        createdAt: m.CreatedAt ?? m.createdAt
      } as CustomerCylinderMapping)))
    );
  }

  // GET delivery summary
  getDeliverySummary(deliveryId: number): Observable<DeliveryMappingSummary> {
    return this.http.get<any>(`${MAPPING_URL}/summary/${deliveryId}`).pipe(
      map(s => ({
        deliveryId: s.DeliveryId ?? s.deliveryId,
        deliveryDate: s.DeliveryDate ?? s.deliveryDate,
        driverName: s.DriverName ?? s.driverName,
        vehicleNo: s.VehicleNo ?? s.vehicleNo,
        totalCommercialCylinders: s.TotalCommercialCylinders ?? s.totalCommercialCylinders ?? 0,
        mappedCylinders: s.MappedCylinders ?? s.mappedCylinders ?? 0,
        unmappedCylinders: s.UnmappedCylinders ?? s.unmappedCylinders ?? 0
      } as DeliveryMappingSummary))
    );
  }

  // POST create mapping
  createMapping(dto: any): Observable<any> {
    const payload = {
      DeliveryId: dto.deliveryId,
      ProductId: dto.productId,
      CustomerId: dto.customerId,
      Quantity: dto.quantity,
      IsCreditSale: dto.isCreditSale,
      PaymentMode: dto.paymentMode,
      InvoiceNumber: dto.invoiceNumber,
      Remarks: dto.remarks
    };
    return this.http.post(MAPPING_URL, payload);
  }

  // DELETE mapping
  deleteMapping(mappingId: number): Observable<any> {
    return this.http.delete(`${MAPPING_URL}/${mappingId}`);
  }
}
