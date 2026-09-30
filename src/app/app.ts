import { Component, inject, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { ShopService } from './shop.service';
import { Cart } from './cart';
import { Checkout } from './checkout';
import { Product } from './models';
registerLocaleData(localePt);
@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, Cart, Checkout],
  templateUrl: './app.html',
})
export class App {
  shop = inject(ShopService);
  category = 'Todos';
  categories = ['Todos', 'Chocolate', 'Frutas', 'Cremosos'];
  selected = signal<Product | null>(null);
  sauce = 'Sem calda';
  quantity = 1;
  checkoutOpen = false;
  cartOpen = false;
  info = '';
  cartDialog = viewChild<ElementRef<HTMLDialogElement>>('cartDialog');
  modal = viewChild<ElementRef<HTMLDialogElement>>('productDialog');
  get filtered() {
    return this.shop.products.filter(
      (p) => this.category === 'Todos' || p.category === this.category,
    );
  }
  open(p: Product) {
    this.selected.set(p);
    this.sauce = 'Sem calda';
    this.quantity = 1;
    this.modal()?.nativeElement.showModal();
  }
  onBackdrop(event: MouseEvent) {
    if (event.target === this.modal()?.nativeElement) this.close();
  }
  close() {
    this.modal()?.nativeElement.close();
    this.selected.set(null);
  }
  add() {
    const p = this.selected();
    if (p && this.shop.add(p.id, this.sauce, this.quantity)) this.close();
  }
  get selectionPrice() {
    return (
      ((this.selected()?.price ?? 0) +
        (this.shop.sauces.find((s) => s.name === this.sauce)?.price ?? 0)) *
      this.quantity
    );
  }
  openCart() {
    this.cartOpen = true;
    this.cartDialog()?.nativeElement.showModal();
  }
  closeCart() {
    this.cartOpen = false;
    this.cartDialog()?.nativeElement.close();
  }
  startCheckout() {
    this.closeCart();
    this.checkoutOpen = true;
  }
}
