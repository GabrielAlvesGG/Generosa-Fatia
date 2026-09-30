import { Line, Product } from './models';
export function priceCart(
  lines: Line[],
  products: Product[],
  sauces: { name: string; price: number }[],
  promotion: { price: number; pairDiscount: number },
) {
  let subtotal = 0,
    count = 0;
  for (const line of lines) {
    const p = products.find((p) => p.id === line.productId);
    if (!p) continue;
    subtotal += (p.price + (sauces.find((s) => s.name === line.sauce)?.price ?? 0)) * line.quantity;
    if (p.price === promotion.price) count += line.quantity;
  }
  const discount = Math.floor(count / 2) * promotion.pairDiscount;
  return { subtotal, discount, total: subtotal - discount };
}
