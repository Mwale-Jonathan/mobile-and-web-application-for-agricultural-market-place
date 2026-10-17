export type UserRole = "farmer" | "consumer";

export type AvailabilityStatus = "available" | "limited" | "sold_out" | "hidden";

export type ProductUnit = string;

export interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  location: string;
  province: string;
  joinedDate: string;
  avatarColor: string;
  profilePicture: string | null;
  latitude: number | null;
  longitude: number | null;
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
  latitude: number | null;
  longitude: number | null;
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

export interface CommodityCatalogueItem {
  commodity: string;
  units: string[];
  provinces: string[];
  last_observation: string;
}

export interface CommodityCatalogue {
  count: number;
  provinces: string[];
  commodities: CommodityCatalogueItem[];
}

export interface Forecast {
  province: string;
  commodity: string;
  unit: string;
  last_observation_date: string;
  last_observed_price: number;
  forecast_date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
  interval_nominal_coverage: number;
  currency: string;
  warning?: string | null;
}

export interface PredictionResponse {
  query: string;
  matched_commodity: string;
  match_score: number;
  forecasts: Forecast[];
}
