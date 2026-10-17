import { api, configureApiAuth, type ProductInput, type RegisterInput, type UploadAsset } from "@/lib/api";
import { readStoredToken, writeStoredToken } from "@/lib/token-storage";
import type { Category, Product, SavedProduct, User } from "@/types";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

interface AppContextType {
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  currentUser: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<User>;
  updatePassword: (currentPassword: string, newPassword: string, confirmPassword?: string) => Promise<boolean>;
  products: Product[];
  categories: Category[];
  addProduct: (product: ProductInput, image?: UploadAsset | null) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<ProductInput>, image?: UploadAsset | null) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  markSoldOut: (id: string) => Promise<Product>;
  getProductById: (id: string) => Product | undefined;
  getProductsBySupplier: (supplierId: string) => Product[];
  getProductsByCategory: (categoryId: string) => Product[];
  getProductsByName: (name: string) => Product[];
  allUsers: User[];
  getUserById: (id: string) => User | undefined;
  savedProducts: SavedProduct[];
  toggleSaved: (productId: string) => Promise<boolean>;
  isSaved: (productId: string) => boolean;
  refreshMarketplace: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  const clearSession = useCallback(async () => {
    configureApiAuth(null);
    await writeStoredToken(null);
    setCurrentUser(null);
    setProducts([]);
    setCategories([]);
    setAllUsers([]);
    setSavedProducts([]);
  }, []);

  const refreshMarketplace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextCategories, nextProducts, nextUsers, saved] = await Promise.all([
        api.categories(),
        api.products(),
        api.users(),
        api.saved(),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
      setAllUsers(nextUsers);
      const now = new Date().toISOString();
      setSavedProducts(saved.map((product) => ({ productId: product.id, savedAt: now })));
    } catch (nextError) {
      setError(messageFrom(nextError));
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const storedToken = await readStoredToken();
        if (!storedToken || !active) return;
        configureApiAuth(storedToken, clearSession);
        const user = await api.me();
        if (!active) return;
        setCurrentUser(user);
        try {
          await refreshMarketplace();
        } catch {
          // Keep a valid restored session and let marketplace screens retry.
        }
      } catch {
        if (active) await clearSession();
      } finally {
        if (active) setIsInitializing(false);
      }
    }
    configureApiAuth(null, clearSession);
    restoreSession();
    return () => { active = false; };
  }, [clearSession, refreshMarketplace]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    setError(null);
    const result = await api.login(usernameOrEmail, password);
    configureApiAuth(result.token, clearSession);
    await writeStoredToken(result.token);
    setCurrentUser(result.user);
    try {
      await refreshMarketplace();
    } catch {
      // Keep the valid session; marketplace screens expose the retry state.
    }
    return result.user;
  }, [clearSession, refreshMarketplace]);

  const register = useCallback(async (input: RegisterInput) => {
    await api.register(input);
    return login(input.username, input.password);
  }, [login]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    const locationKeys = ["location", "province", "latitude", "longitude"];
    const onlyLocation = Object.keys(updates).every((key) => locationKeys.includes(key));
    const updated = onlyLocation
      ? await api.updateLocation({
          location: updates.location ?? currentUser?.location ?? "",
          province: updates.province ?? currentUser?.province ?? "",
          latitude: updates.latitude ?? currentUser?.latitude ?? null,
          longitude: updates.longitude ?? currentUser?.longitude ?? null,
        })
      : await api.updateProfile(updates);
    setCurrentUser(updated);
    setAllUsers((previous) => previous.map((user) => user.id === updated.id ? updated : user));
    return updated;
  }, [currentUser]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword = newPassword) => {
    const result = await api.changePassword(currentPassword, newPassword, confirmPassword);
    return result.success;
  }, []);

  const addProduct = useCallback(async (input: ProductInput, image?: UploadAsset | null) => {
    const product = await api.createProduct(input, image);
    setProducts((previous) => [product, ...previous]);
    return product;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<ProductInput>, image?: UploadAsset | null) => {
    const product = await api.updateProduct(id, updates, image);
    setProducts((previous) => previous.map((item) => item.id === id ? product : item));
    return product;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await api.deleteProduct(id);
    setProducts((previous) => previous.filter((product) => product.id !== id));
    setSavedProducts((previous) => previous.filter((saved) => saved.productId !== id));
  }, []);

  const markSoldOut = useCallback(async (id: string) => {
    const product = await api.markSoldOut(id);
    setProducts((previous) => previous.map((item) => item.id === id ? product : item));
    return product;
  }, []);

  const toggleSaved = useCallback(async (productId: string) => {
    const result = await api.toggleSaved(productId);
    setSavedProducts((previous) => result.saved
      ? [...previous.filter((saved) => saved.productId !== productId), { productId, savedAt: new Date().toISOString() }]
      : previous.filter((saved) => saved.productId !== productId));
    return result.saved;
  }, []);

  const value = useMemo<AppContextType>(() => ({
    isInitializing,
    isLoading,
    error,
    isLoggedIn: Boolean(currentUser),
    currentUser,
    login,
    logout: clearSession,
    register,
    updateUser,
    updatePassword,
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    markSoldOut,
    getProductById: (id) => products.find((product) => product.id === id),
    getProductsBySupplier: (supplierId) => products.filter((product) => product.supplierId === supplierId),
    getProductsByCategory: (categoryId) => products.filter((product) => product.categoryId === categoryId),
    getProductsByName: (name) => products.filter((product) => product.name.toLowerCase().includes(name.toLowerCase())),
    allUsers,
    getUserById: (id) => allUsers.find((user) => user.id === id),
    savedProducts,
    toggleSaved,
    isSaved: (productId) => savedProducts.some((saved) => saved.productId === productId),
    refreshMarketplace,
  }), [
    isInitializing, isLoading, error, currentUser, login, clearSession, register, updateUser,
    updatePassword, products, categories, addProduct, updateProduct, deleteProduct, markSoldOut, allUsers,
    savedProducts, toggleSaved, refreshMarketplace,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
