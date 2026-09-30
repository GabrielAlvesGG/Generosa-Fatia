import { Component, inject, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ShopService } from './shop.service';
@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe],
  template: ` <div class="cart-heading">
      <h2>
        Seu pedido <span>({{ shop.count() }})</span>
      </h2>
      <span aria-hidden="true">♧</span>
    </div>
    @if (!shop.count()) {
      <div class="empty">
        <span class="empty-icon">♧</span>
        <h3>Um pedacinho de felicidade?</h3>
        <p>Escolha suas fatias favoritas.<br />Elas vão aparecer aqui.</p>
      </div>
    }
    @for (line of shop.lines(); track line.productId + line.sauce) {
      <div class="cart-line">
        <img
          [src]="'/images/' + shop.product(line.productId).image + '.webp'"
          [alt]="shop.product(line.productId).name"
          width="64"
          height="64"
        />
        <div class="line-content">
          <strong>{{ shop.product(line.productId).name }}</strong
          ><small>{{ line.sauce }}</small>
          <div class="line-bottom">
            <div class="stepper">
              <button
                [disabled]="readonly()"
                (click)="shop.change(line, -1)"
                aria-label="Diminuir quantidade"
              >
                −</button
              ><span>{{ line.quantity }}</span
              ><button
                [disabled]="readonly() || shop.remaining(line.productId) === 0"
                (click)="shop.change(line, 1)"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
            <b>{{ (shop.unit(line) * line.quantity) / 100 | currency: 'BRL' }}</b>
          </div>
          @if (!readonly()) {
            <button class="remove" (click)="shop.remove(line)">Remover</button>
          }
        </div>
      </div>
    }
    @if (shop.count()) {
      <div class="totals">
        <p>
          <span>Subtotal</span><span>{{ shop.totals().subtotal / 100 | currency: 'BRL' }}</span>
        </p>
        @if (shop.totals().discount) {
          <p class="saving">
            <span>Desconto da dupla</span
            ><span>− {{ shop.totals().discount / 100 | currency: 'BRL' }}</span>
          </p>
        }
        <p class="total">
          <span>Total das fatias</span
          ><strong>{{ shop.totals().total / 100 | currency: 'BRL' }}</strong>
        </p>
        <small>Entrega calculada na próxima etapa.</small>
      </div>
      @if (!readonly()) {
        <button class="primary full" (click)="checkout.emit()">
          Continuar pedido <span>→</span>
        </button>
      }
    }
    <div class="cart-note">
      <span>♡</span>
      <p>Feito à mão, com tempo<br />e muito recheio.</p>
    </div>`,
})
export class Cart {
  shop = inject(ShopService);
  readonly = input(false);
  checkout = output<void>();
}
