export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  tag?: string;
}
export interface Line {
  productId: string;
  sauce: string;
  quantity: number;
}
export type PaymentStatus = 'approved' | 'declined' | 'pending';
export interface CheckoutData {
  mode: 'pickup' | 'delivery';
  date: string;
  slot: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  extra: string;
  name: string;
  phone: string;
  method: string;
}
export interface Order {
  id: string;
  lines: Line[];
  data: CheckoutData;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  payment: PaymentStatus;
  status: 'confirmed' | 'awaiting-payment';
  createdAt: string;
}
