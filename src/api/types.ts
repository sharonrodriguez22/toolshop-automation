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