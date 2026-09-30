import { CatalogRepository } from './catalog.service';
import { Injectable, computed, signal, inject } from '@angular/core';
import { SAUCES, STORE } from './demo-data';
import { Line } from './models';
import { priceCart } from './pricing';
@Injectable({ providedIn: 'root' })
export class ShopService {
  readonly products = inject(CatalogRepository).products;
  readonly sauces = SAUCES;
  readonly config = STORE;
  readonly lines = signal<Line[]>(this.restore());
  readonly totals = computed(() =>
    priceCart(this.lines(), this.products, this.sauces, STORE.promotion),
  );
  readonly count = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));
  notice = signal('');
  product(id: string) {
    return this.products.find((p) => p.id === id)!;
  }
  remaining(id: string) {
    return (
      this.product(id).stock -
      this.lines()
        .filter((l) => l.productId === id)
        .reduce((n, l) => n + l.quantity, 0)
    );
  }
  unit(l: Line) {
    return this.product(l.productId).price + (SAUCES.find((s) => s.name === l.sauce)?.price ?? 0);
  }
  add(id: string, sauce: string, quantity = 1) {
    if (
      !this.sauces.some((s) => s.name === sauce) ||
      quantity < 1 ||
      !Number.isInteger(quantity) ||
      quantity > this.remaining(id)
    )
      return false;
    const lines = this.lines().map((l) => ({ ...l }));
    const existing = lines.find((l) => l.productId === id && l.sauce === sauce);
    if (existing) existing.quantity += quantity;
    else lines.push({ productId: id, sauce, quantity });
    this.save(lines);
    this.notice.set('Fatia adicionada ao seu pedido');
    setTimeout(() => this.notice.set(''), 2500);
    return true;
  }
  change(l: Line, delta: number) {
    if (delta > 0) {
      this.add(l.productId, l.sauce, delta);
      return;
    }
    this.save(
      this.lines()
        .map((x) => (x === l ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0),
    );
  }
  remove(l: Line) {
    this.save(this.lines().filter((x) => x !== l));
  }
  clear() {
    this.save([]);
  }
  private save(lines: Line[]) {
    this.lines.set(lines);
    try {
      localStorage.setItem('gf-cart-v1', JSON.stringify(lines));
    } catch {
      this.notice.set('Seu navegador não permitiu salvar o carrinho.');
    }
  }
  private restore(): Line[] {
    try {
      const raw = JSON.parse(localStorage.getItem('gf-cart-v1') || '[]');
      if (!Array.isArray(raw)) return [];
      const result: Line[] = [];
      for (const l of raw) {
        const p = this.products.find((p) => p.id === l.productId);
        if (
          !p ||
          !SAUCES.some((s) => s.name === l.sauce) ||
          !Number.isInteger(l.quantity) ||
          l.quantity < 1
        )
          continue;
        const used = result.filter((x) => x.productId === p.id).reduce((n, x) => n + x.quantity, 0);
        const quantity = Math.min(l.quantity, p.stock - used);
        if (quantity > 0) {
          const existing = result.find((x) => x.productId === p.id && x.sauce === l.sauce);
          if (existing) existing.quantity += quantity;
          else result.push({ productId: p.id, sauce: l.sauce, quantity });
        }
      }
      return result;
    } catch {
      return [];
    }
  }
}
