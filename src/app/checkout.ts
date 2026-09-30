import {
  Component,
  inject,
  output,
  OnDestroy,
  AfterViewInit,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cart } from './cart';
import { ShopService } from './shop.service';
import { ORDER_GATEWAY } from './order.service';
import { CheckoutData, Order, PaymentStatus } from './models';
import { localDate, slotsFor, deliveryAllowed } from './scheduling';
@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, Cart],
  templateUrl: './checkout.html',
})
export class Checkout implements AfterViewInit, OnDestroy {
  closed = output<void>();
  dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  shop = inject(ShopService);
  gateway = inject(ORDER_GATEWAY);
  step = 1;
  error = '';
  busy = false;
  order: Order | null = null;
  lookup = '';
  payment: PaymentStatus = 'approved';
  key = crypto.randomUUID();
  today = localDate();
  maxDate = localDate(new Date(Date.now() + 14 * 86400000));
  now = Date.now();
  data: CheckoutData = {
    mode: 'pickup',
    date: this.today,
    slot: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    extra: '',
    name: '',
    phone: '',
    method: 'Pix',
  };
  timer = setInterval(() => (this.now = Date.now()), 15000);
  ngAfterViewInit() {
    this.dialog()?.nativeElement.showModal();
    if (!this.shop.count()) this.lookup = localStorage.getItem('gf-last-order') || '';
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  get slots() {
    return slotsFor(this.data.date, this.now);
  }
  get delivery() {
    return this.data.mode === 'delivery' ? this.shop.config.deliveryFee : 0;
  }
  get total() {
    return this.shop.totals().total + this.delivery;
  }
  get address() {
    return this.data.mode === 'pickup'
      ? this.shop.config.address
      : this.data.street +
          ', ' +
          this.data.number +
          ' — ' +
          this.data.neighborhood +
          ', ' +
          this.data.city +
          ' · ' +
          this.data.cep +
          (this.data.extra ? ' · ' + this.data.extra : '');
  }
  fulfillmentValid() {
    if (
      this.data.date < this.today ||
      this.data.date > this.maxDate ||
      !this.slots.some((s) => s.time === this.data.slot && !s.disabled)
    ) {
      this.error = 'Escolha uma data e um horário disponível.';
      return false;
    }
    if (this.data.mode === 'delivery') {
      if (
        !this.data.street.trim() ||
        !this.data.number.trim() ||
        !this.data.neighborhood.trim() ||
        !this.data.city.trim()
      ) {
        this.error = 'Preencha todos os campos obrigatórios do endereço.';
        return false;
      }
      if (!deliveryAllowed(this.data.cep, this.data.city)) {
        this.error = 'A entrega demonstrativa atende São Paulo, CEPs de 01000-000 a 05999-999.';
        return false;
      }
    }
    return true;
  }
  next() {
    this.error = '';
    if (this.step === 1 && !this.shop.count()) return;
    if (this.step === 2 && !this.fulfillmentValid()) return;
    this.step++;
  }
  async pay() {
    if (this.busy) return;
    this.error = '';
    if (!this.fulfillmentValid()) {
      this.step = 2;
      return;
    }
    if (
      this.data.name.trim().split(/\s+/).length < 2 ||
      this.data.name.trim().length < 5 ||
      !/^\d{10,11}$/.test(this.data.phone.replace(/\D/g, ''))
    ) {
      this.error = 'Informe nome e sobrenome e telefone com DDD (10 ou 11 dígitos).';
      return;
    }
    if (!this.shop.count()) {
      this.error = 'Seu carrinho está vazio.';
      return;
    }
    this.busy = true;
    try {
      const t = this.shop.totals();
      const order: Order = {
        id: 'GF-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
        lines: structuredClone(this.shop.lines()),
        data: { ...this.data },
        ...t,
        delivery: this.delivery,
        total: this.total,
        payment: this.payment,
        status: this.payment === 'approved' ? 'confirmed' : 'awaiting-payment',
        createdAt: new Date().toISOString(),
      };
      this.order = await this.gateway.create(order, this.key);
      if (this.order.payment === 'approved') this.shop.clear();
      this.step = 4;
    } catch {
      this.error =
        'Não foi possível salvar o pedido. Verifique o armazenamento do navegador e tente novamente.';
    } finally {
      this.busy = false;
    }
  }
  async consult(id = this.lookup) {
    this.error = '';
    this.busy = true;
    try {
      this.order = await this.gateway.get(id.trim());
      this.step = 4;
    } catch {
      this.error = 'Pedido não encontrado neste navegador.';
    } finally {
      this.busy = false;
    }
  }
  restart() {
    this.order = null;
    this.key = crypto.randomUUID();
    this.step = 1;
    this.error = '';
  }
}
