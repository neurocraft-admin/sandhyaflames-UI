import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductCategory, ProductSubCategory } from '../models/category.model';

import { environment } from '../../environments/environment';

const CATEGORIES_URL = `${environment.apiUrl}/productcategories`;
const SUBCATEGORIES_URL = `${environment.apiUrl}/api/productsubcategories`; // expects ?categoryId=ID


@Injectable({ providedIn: 'root' })
export class CategoryService {
private http = inject(HttpClient);


getCategories(): Observable<ProductCategory[]> {
return this.http.get<ProductCategory[]>(CATEGORIES_URL);
}


getSubCategories(categoryId: number): Observable<ProductSubCategory[]> {
return this.http.get<ProductSubCategory[]>(`${SUBCATEGORIES_URL}?categoryId=${categoryId}`);
}
}