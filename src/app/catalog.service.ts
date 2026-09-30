import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product } from './models';
import { PRODUCTS } from './demo-data';
export interface CatalogGateway {
  list(): Promise<Product[]>;
}
export const CATALOG_GATEWAY = new InjectionToken<CatalogGateway>('CATALOG_GATEWAY');
@Injectable({ providedIn: 'root' })
export class DemoCatalogService implements CatalogGateway {
  async list() {
    return PRODUCTS.map((p) => ({ ...p }));
  }
}
@Injectable({ providedIn: 'root' })
export class ApiCatalogService implements CatalogGateway {
  private http = inject(HttpClient);
  list() {
    return firstValueFrom(this.http.get<Product[]>('/api/products'));
  }
}
@Injectable({ providedIn: 'root' })
export class CatalogRepository {
  private gateway = inject(CATALOG_GATEWAY);
  products: Product[] = [];
  async load() {
    this.products = await this.gateway.list();
  }
}
