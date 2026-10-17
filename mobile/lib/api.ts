import type { Category, Product, User } from "@/types";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

let token: string | null = null;
let onUnauthorized: (() => void | Promise<void>) | null = null;

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function configureApiAuth(nextToken: string | null, handler?: () => void | Promise<void>) {
  token = nextToken;
  if (handler !== undefined) onUnauthorized = handler;
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers(options.headers);
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.auth !== false && token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
    const raw = await response.text();
    let body: unknown = null;
    if (raw) {
      try { body = JSON.parse(raw); } catch { body = raw; }
    }
    if (!response.ok) {
      if (response.status === 401 && options.auth !== false && onUnauthorized) await onUnauthorized();
      const message = typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${response.status})`;
      throw new ApiError(message, response.status, body);
    }
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ApiError("Request timed out. Please try again.", 408);
    throw new ApiError("Unable to reach the AgriMart server.", 0, error);
  } finally {
    clearTimeout(timer);
  }
}

export interface RegisterInput {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: User["role"];
  location: string;
  province: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type ProductInput = Omit<Product, "id" | "supplierId" | "createdAt" | "imageUrl">;

export interface UploadAsset {
  uri: string;
  name: string;
  type: string;
  fileSize?: number;
  file?: Blob;
}

export function buildProductForm(input: Partial<ProductInput>, image?: UploadAsset | null) {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  if (image) {
    if (image.file) form.append("image", image.file, image.name);
    else form.append("image", { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
  }
  return form;
}

export const api = {
  categories: () => request<Category[]>("/categories", { auth: false }),
  register: (input: RegisterInput) => request<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(input), auth: false }),
  login: (usernameOrEmail: string, password: string) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ username: usernameOrEmail, password }), auth: false }),
  me: () => request<User>("/auth/me"),
  users: () => request<User[]>("/users", { auth: false }),
  products: () => request<Product[]>("/products?limit=100", { auth: false }),
  product: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`, { auth: false }),
  compare: (id: string) => request<{ reference: Product; comparable: Array<Pick<Product, "id" | "name" | "price" | "unit" | "supplierId" | "location" | "imageUrl">> }>(`/products/compare?productId=${encodeURIComponent(id)}`, { auth: false }),
  saved: () => request<Product[]>("/saved"),
  toggleSaved: (id: string) => request<{ saved: boolean }>(`/saved/${encodeURIComponent(id)}`, { method: "POST" }),
  updateProfile: (input: Partial<User>) => request<User>("/users/profile", { method: "PUT", body: JSON.stringify(input) }),
  updateLocation: (input: Pick<User, "location" | "province" | "latitude" | "longitude">) => request<User>("/users/location", { method: "PUT", body: JSON.stringify(input) }),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => request<{ success: boolean }>("/users/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) }),
  createProduct: (input: ProductInput, image?: UploadAsset | null) => request<Product>("/products", { method: "POST", body: buildProductForm(input, image) }),
  updateProduct: (id: string, input: Partial<ProductInput>, image?: UploadAsset | null) => request<Product>(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: buildProductForm(input, image) }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  markSoldOut: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}/mark-sold-out`, { method: "POST" }),
};
