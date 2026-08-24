import React, { createContext, useState, useCallback } from "react";
import type {
  User,
  Product,
  SavedProduct,
  UserRole,
  AvailabilityStatus,
} from "@/types";
import { DEMO_USERS, DEMO_PRODUCTS } from "@/data/mock-data";

interface AppContextType {
  // Auth
  isLoggedIn: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  loginAs: (userId: string) => void;
  logout: () => void;
  register: (user: Omit<User, "id" | "joinedDate" | "avatarColor">) => void;
  switchRole: (role: UserRole) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  markSoldOut: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsBySupplier: (supplierId: string) => Product[];
  getProductsByCategory: (categoryId: string) => Product[];
  getProductsByName: (name: string) => Product[];

  // Users
  allUsers: User[];
  getUserById: (id: string) => User | undefined;

  // Saved
  savedProducts: SavedProduct[];
  toggleSaved: (productId: string) => void;
  isSaved: (productId: string) => boolean;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [allUsers, setAllUsers] = useState<User[]>(DEMO_USERS);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  const login = useCallback(
    (email: string, _password: string): boolean => {
      const user = allUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    },
    [allUsers]
  );

  const loginAs = useCallback(
    (userId: string) => {
      const user = allUsers.find((u) => u.id === userId);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
    },
    [allUsers]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setSavedProducts([]);
  }, []);

  const register = useCallback(
    (userData: Omit<User, "id" | "joinedDate" | "avatarColor">) => {
      const colors = [
        "#16A34A",
        "#2563EB",
        "#7C3AED",
        "#DC2626",
        "#EA580C",
        "#0891B2",
        "#DB2777",
      ];
      const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        joinedDate: new Date().toISOString().split("T")[0],
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
      };
      setAllUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setIsLoggedIn(true);
    },
    []
  );

  const switchRole = useCallback(
    (role: UserRole) => {
      if (currentUser) {
        const updated = { ...currentUser, role };
        setCurrentUser(updated);
        setAllUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
        );
      }
    },
    [currentUser]
  );

  const addProduct = useCallback(
    (productData: Omit<Product, "id" | "createdAt">) => {
      const newProduct: Product = {
        ...productData,
        id: `p-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setProducts((prev) => [newProduct, ...prev]);
    },
    []
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const markSoldOut = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, availability: "sold_out" as AvailabilityStatus, quantity: 0 } : p
      )
    );
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getProductsBySupplier = useCallback(
    (supplierId: string) => products.filter((p) => p.supplierId === supplierId),
    [products]
  );

  const getProductsByCategory = useCallback(
    (categoryId: string) => products.filter((p) => p.categoryId === categoryId),
    [products]
  );

  const getProductsByName = useCallback(
    (name: string) =>
      products.filter((p) =>
        p.name.toLowerCase().includes(name.toLowerCase())
      ),
    [products]
  );

  const getUserById = useCallback(
    (id: string) => allUsers.find((u) => u.id === id),
    [allUsers]
  );

  const toggleSaved = useCallback((productId: string) => {
    setSavedProducts((prev) => {
      const exists = prev.find((s) => s.productId === productId);
      if (exists) {
        return prev.filter((s) => s.productId !== productId);
      }
      return [
        ...prev,
        { productId, savedAt: new Date().toISOString() },
      ];
    });
  }, []);

  const isSaved = useCallback(
    (productId: string) =>
      savedProducts.some((s) => s.productId === productId),
    [savedProducts]
  );

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        login,
        loginAs,
        logout,
        register,
        switchRole,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        markSoldOut,
        getProductById,
        getProductsBySupplier,
        getProductsByCategory,
        getProductsByName,
        allUsers,
        getUserById,
        savedProducts,
        toggleSaved,
        isSaved,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
