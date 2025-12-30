import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductOption {
  productId: number;
  productName: string;
  categoryId: number;
  subCategoryId: number;
  categoryName?: string;
  subCategoryName?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductDropdownService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/products`;

  getAll(): Observable<ProductOption[]> {
    return this.http.get<any[]>(this.url).pipe(
      map(rows => (rows || []).map(r => ({
        productId: r.ProductId ?? r.productId,
        productName: r.ProductName ?? r.productName,
        categoryId: r.CategoryId ?? r.categoryId ?? 0,
        subCategoryId: r.SubCategoryId ?? r.subCategoryId ?? 0,
        categoryName: r.CategoryName ?? r.categoryName,
        subCategoryName: r.SubCategoryName ?? r.subCategoryName
      }) as ProductOption))
    );
  }
}
