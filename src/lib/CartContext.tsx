import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: string;
  sku?: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  customization?: any;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, customization?: any) => void;
  updateQuantity: (id: string, quantity: number, customization?: any) => void;
  clearCart: () => void;
  total: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => 
        i.id === item.id && JSON.stringify(i.customization) === JSON.stringify(item.customization)
      );
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && JSON.stringify(i.customization) === JSON.stringify(item.customization)
            ? { ...i, quantity: i.quantity + item.quantity } 
            : i
        );
      }
      return [...prev, item];
    });
    setIsSidebarOpen(true);
  };

  const updateQuantity = (id: string, quantity: number, customization?: any) => {
    setItems((prev) => prev.map((i) => 
      (i.id === id && JSON.stringify(i.customization) === JSON.stringify(customization))
        ? { ...i, quantity: Math.max(1, quantity) }
        : i
    ));
  };

  const removeItem = (id: string, customization?: any) => {
    setItems((prev) => prev.filter((i) => 
      !(i.id === id && JSON.stringify(i.customization) === JSON.stringify(customization))
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
