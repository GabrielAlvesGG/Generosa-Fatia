import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Order } from './models';
export interface OrderGateway {
  create(order: Order, key: string): Promise<Order>;
  get(id: string): Promise<Order>;
}
export const ORDER_GATEWAY = new InjectionToken<OrderGateway>('ORDER_GATEWAY');
@Injectable({ providedIn: 'root' })
export class DemoOrderService implements OrderGateway {
  async create(order: Order, key: string) {
    const previous = localStorage.getItem('gf-key-' + key);
    if (previous) return this.get(previous);
    localStorage.setItem('gf-order-' + order.id, JSON.stringify(order));
    localStorage.setItem('gf-key-' + key, order.id);
    localStorage.setItem('gf-last-order', order.id);
    return order;
  }
  async get(id: string) {
    const raw = localStorage.getItem('gf-order-' + id);
    if (!raw) throw new Error('Pedido não encontrado neste navegador.');
    return JSON.parse(raw) as Order;
  }
}
@Injectable({ providedIn: 'root' })
export class ApiOrderService implements OrderGateway {
  private http = inject(HttpClient);
  create(order: Order, key: string) {
    return firstValueFrom(
      this.http.post<Order>(
        '/api/orders',
        { items: order.lines, fulfillment: order.data },
        { headers: { 'Idempotency-Key': key } },
      ),
    );
  }
  get(id: string) {
    return firstValueFrom(this.http.get<Order>('/api/orders/' + encodeURIComponent(id)));
  }
}
