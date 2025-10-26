// purchase-entry.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PurchaseEntry, PurchaseEntryItem } from '../models/purchase-entry.model';

const URL = `${environment.apiUrl}/purchases`;

@Injectable({ providedIn: 'root' })
export class PurchaseEntryService {
  private http = inject(HttpClient);

  // GET all (headers only; API returns TotalAmount)
  getAll(): Observable<PurchaseEntry[]> {
    return this.http.get<any[]>(URL).pipe(
      map(rows =>
        (rows || []).map(r => ({
          purchaseId: r.PurchaseId ?? r.purchaseId,
          vendorId: r.VendorId ?? r.vendorId,
          vendorName: r.VendorName ?? r.vendorName,
          invoiceNo: r.InvoiceNo ?? r.invoiceNo,
          purchaseDate: r.PurchaseDate ?? r.purchaseDate,
          remarks: r.Remarks ?? r.remarks,
          isActive: (r.IsActive ?? r.isActive) ?? true,
          items: [], // list call doesn't include items
          totalAmount: r.TotalAmount ?? r.totalAmount ?? 0,
          createdAt: r.CreatedAt ?? r.createdAt
        }) as PurchaseEntry)
      )
    );
  }

  // GET by Id (header + Items[])
  getById(id: number): Observable<PurchaseEntry | null> {
    return this.http.get<any[]>(`${URL}/${id}`).pipe(
      map(rows => {
        if (!rows || rows.length === 0) return null;

        const r = rows[0];
        const items: PurchaseEntryItem[] = (r.Items || []).map((it: any) => ({
          productId: it.ProductId ?? it.productId,
          categoryId: it.CategoryId ?? it.categoryId ?? 0,
          subCategoryId: it.SubCategoryId ?? it.subCategoryId ?? 0,
          productName: it.ProductName ?? it.productName,
          categoryName: it.CategoryName ?? it.categoryName,
          subCategoryName: it.SubCategoryName ?? it.subCategoryName,
          qty: it.Qty ?? it.qty ?? 0,
          unitPrice: it.UnitPrice ?? it.unitPrice ?? 0,
          lineTotal: ((it.Qty ?? it.qty ?? 0) * (it.UnitPrice ?? it.unitPrice ?? 0))
        }));

        return {
          purchaseId: r.PurchaseId ?? r.purchaseId,
          vendorId: r.VendorId ?? r.vendorId,
          vendorName: r.VendorName ?? r.vendorName,
          invoiceNo: r.InvoiceNo ?? r.invoiceNo,
          purchaseDate: (r.PurchaseDate ?? r.purchaseDate),
          remarks: r.Remarks ?? r.remarks,
          isActive: (r.IsActive ?? r.isActive) ?? true,
          items,
          totalAmount: r.TotalAmount ?? r.totalAmount
            ?? items.reduce((s: number, it: PurchaseEntryItem) => s + it.lineTotal, 0),
          createdAt: r.CreatedAt ?? r.createdAt
        } as PurchaseEntry;
      })
    );
  }

  // SAVE (create or update) — payload already built in component
  save(
    editId: number | null,
    payload: any
  ): Observable<{ success: number; message: string; purchaseId?: number }> {
    const body = { ...payload, purchaseId: editId ?? 0 };
    return this.http.post<{ success: number; message: string; purchaseId?: number }>(URL, body);
  }

  // TOGGLE active/inactive
  toggleActive(
    id: number,
    isActive: boolean
  ): Observable<{ success: number; message: string }> {
    return this.http.put<{ success: number; message: string }>(`${URL}/${id}`, { isActive });
  }
}
