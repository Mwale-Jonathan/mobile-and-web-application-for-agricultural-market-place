export type UserRole = "farmer" | "consumer";

export type AvailabilityStatus = "available" | "limited" | "sold_out" | "hidden";

export type ProductUnit = "kg" | "25kg bag" | "50kg bag" | "crate" | "bunch" | "tonne" | "litre" | "piece";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location: string;
  province: string;
  joinedDate: string;
  avatarColor: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  unit: ProductUnit;
  quantity: number;
  description: string;
  imageUrl: string;
  supplierId: string;
  location: string;
  province: string;
  latitude: number;
  longitude: number;
  availability: AvailabilityStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface SavedProduct {
  productId: string;
  savedAt: string;
}
