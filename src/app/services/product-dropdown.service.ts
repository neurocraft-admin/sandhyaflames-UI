import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';


export interface ProductOption { productId: number; productName: string; categoryName?: string; subCategoryName?: string; }


@Injectable({ providedIn: 'root' })
export class ProductDropdownService {
private http = inject(HttpClient);
private url = `${environment.apiUrl}/products`;


getAll(): Observable<ProductOption[]> {
return this.http.get<any[]>(this.url).pipe(
map(rows => (rows || []).map(r => ({
productId: r.ProductId,
productName: r.ProductName,
categoryName: r.CategoryName,
subCategoryName: r.SubCategoryName
}) as ProductOption))
);
}
}