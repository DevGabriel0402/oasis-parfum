export type Product = {
  id: string;
  name: string;
  brand: string;
  description: string;
  image: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  category: string;
  active: boolean;
  featured: boolean;
  wholesaleMinimum: number;
  slug: string;
};
export type Order = {
  id: string;
  date: string;
  customer: string;
  phone: string;
  type: string;
  items: string;
  lines?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  quantity: number;
  total: number;
  status: string;
  notes: string;
};
