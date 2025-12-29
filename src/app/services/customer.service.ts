// customer.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../models/customer.model';
import { environment } from '../../environments/environment';

const CUSTOMERS_URL = `${environment.apiUrl}/customers`;

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);

  // GET all customers
  getCustomers(): Observable<Customer[]> {
    return this.http.get<any[]>(CUSTOMERS_URL).pipe(
      map(rows => (rows || []).map(c => ({
        customerId: c.CustomerId ?? c.customerId,
        customerName: c.CustomerName ?? c.customerName,
        contactNumber: c.ContactNumber ?? c.contactNumber ?? '',
        email: c.Email ?? c.email,
        address: c.Address ?? c.address,
        city: c.City ?? c.city,
        pincode: c.Pincode ?? c.pincode,
        gstNumber: c.GSTNumber ?? c.gstNumber,
        customerType: c.CustomerType ?? c.customerType,
        isActive: c.IsActive ?? c.isActive ?? true,
        createdAt: c.CreatedAt ?? c.createdAt ?? new Date().toISOString()
      } as Customer)))
    );
  }

  // SAVE (create or update)
  saveCustomer(editId: number | null, dto: Partial<Customer>): Observable<any> {
    const payload = {
      CustomerId: editId ?? 0,
      CustomerName: dto.customerName,
      ContactNumber: dto.contactNumber,
      Email: dto.email,
      Address: dto.address,
      City: dto.city,
      Pincode: dto.pincode,
      GSTNumber: dto.gstNumber,
      CustomerType: dto.customerType,
      IsActive: dto.isActive ?? true
    };
    console.log('Payload to API:', payload);
    return this.http.post(CUSTOMERS_URL, payload);
  }

  // Soft delete (toggle inactive)
  softDeleteCustomer(id: number): Observable<any> {
    return this.http.put(`${CUSTOMERS_URL}/${id}`, { isActive: false });
  }
}
