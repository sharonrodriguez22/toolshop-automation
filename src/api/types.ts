export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
  is_location_offer: boolean;
  is_eco_friendly: boolean;
  co2_rating: string;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string };
  product_image: { id: string; file_name: string; title: string };
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  discount_percentage: number | null;
  discounted_price?: number;
  product: Product;
}

export interface Cart {
  id: string;
  additional_discount_percentage: number | null;
  lat: number | null;
  lng: number | null;
  cart_items: CartItem[];
}

export type PaymentMethod =
  | 'bank-transfer'
  | 'cash-on-delivery'
  | 'credit-card'
  | 'buy-now-pay-later'
  | 'gift-card';

export interface InvoicePayload {
  cart_id: string;
  payment_method: PaymentMethod;
  payment_details: Record<string, string>;
  billing_street: string;
  billing_city: string;
  billing_country: string;
  billing_state?: string;
  billing_postal_code?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  billing_street: string;
  billing_city: string;
  billing_country: string;
  total: number;
  payment_method: PaymentMethod;
}
