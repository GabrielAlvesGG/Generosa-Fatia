import { CatalogRepository } from './catalog.service';
import { PRODUCTS } from './demo-data';
import { TestBed } from '@angular/core/testing';
import { ShopService } from './shop.service';
describe('Carrinho', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: CatalogRepository, useValue: { products: PRODUCTS } }],
    });
  });
  it('limita estoque entre diferentes caldas', () => {
    const shop = TestBed.inject(ShopService);
    expect(shop.add('uva', 'Ninho', 4)).toBeTrue();
    expect(shop.add('uva', 'Chocolate', 3)).toBeFalse();
    expect(shop.add('uva', 'Chocolate', 2)).toBeTrue();
    expect(shop.remaining('uva')).toBe(0);
  });
});
