import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => { success: boolean; message: string };
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'jaga_cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    // Check available stock
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock <= 0) {
      return { success: false, message: 'Sorry, this product or selected option is currently out of stock.' };
    }

    const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
    const existingIndex = cart.findIndex((item) => item.id === cartItemId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > availableStock) {
        return {
          success: false,
          message: `Cannot add more. Only ${availableStock} units available in stock.`
        };
      }

      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
      return { success: true, message: `Updated quantity in your cart (${updated[existingIndex].quantity} total).` };
    } else {
      if (quantity > availableStock) {
        return {
          success: false,
          message: `Cannot add ${quantity} units. Only ${availableStock} available in stock.`
        };
      }

      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        product,
        selectedVariant: variant,
        quantity
      };
      setCart([...cart, newItem]);
      return { success: true, message: 'Added to your cart!' };
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return { success: true };
    }

    const item = cart.find((i) => i.id === cartItemId);
    if (!item) return { success: false, message: 'Item not in cart' };

    const maxStock = item.selectedVariant ? item.selectedVariant.stock : item.product.stock;
    if (quantity > maxStock) {
      return {
        success: false,
        message: `Maximum available stock is ${maxStock} units.`
      };
    }

    setCart(
      cart.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
    );
    return { success: true };
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce((sum, item) => {
    let unitPrice = item.product.price;
    if (item.selectedVariant?.priceDelta) {
      unitPrice += item.selectedVariant.priceDelta;
    }
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
