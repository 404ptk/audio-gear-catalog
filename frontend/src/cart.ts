// Cart functionality with localStorage persistence and backend sync for logged-in users

import { getAuthToken, getCartFromAPI, addToCartAPI, updateCartItemAPI, removeFromCartAPI, clearCartAPI } from './api'

export interface CartItem {
  id: number
  name: string
  price: number
  brand: string
  category: string
  quantity: number
  image_url?: string | null
  // For backend sync
  cart_item_id?: number
}

const CART_KEY = 'shopping_cart'

// Check if user is logged in
export function isLoggedIn(): boolean {
  return !!getAuthToken()
}

// Get cart from localStorage
function getLocalCart(): CartItem[] {
  try {
    const data = localStorage.getItem(CART_KEY)
    if (!data) return []
    return JSON.parse(data) as CartItem[]
  } catch {
    return []
  }
}

// Save cart to localStorage
function saveLocalCart(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch (e) {
    console.error('Failed to save cart:', e)
  }
}

// Sync local cart to backend when user logs in
export async function syncCartToBackend(): Promise<void> {
  if (!isLoggedIn()) return
  
  const localCart = getLocalCart()
  if (localCart.length === 0) return
  
  try {
    // Add all local items to backend
    for (const item of localCart) {
      await addToCartAPI(item.id, item.quantity)
    }
    // Clear local cart after sync
    localStorage.removeItem(CART_KEY)
  } catch (error) {
    console.error('Failed to sync cart to backend:', error)
  }
}

// Get cart (from backend if logged in, otherwise from localStorage)
export async function getCart(): Promise<CartItem[]> {
  if (isLoggedIn()) {
    try {
      const response = await getCartFromAPI()
      return response.items.map(item => ({
        id: item.gear_item.id,
        name: item.gear_item.name,
        price: item.gear_item.price,
        brand: item.gear_item.brand,
        category: item.gear_item.category,
        quantity: item.quantity,
        image_url: item.gear_item.image_url,
        cart_item_id: item.id
      }))
    } catch (error) {
      console.error('Failed to load cart from backend:', error)
      return getLocalCart()
    }
  }
  return getLocalCart()
}

// Add item to cart
export async function addToCart(item: Omit<CartItem, 'quantity' | 'cart_item_id'>, quantity = 1): Promise<CartItem[]> {
  if (isLoggedIn()) {
    try {
      const response = await addToCartAPI(item.id, quantity)
      return response.items.map(item => ({
        id: item.gear_item.id,
        name: item.gear_item.name,
        price: item.gear_item.price,
        brand: item.gear_item.brand,
        category: item.gear_item.category,
        quantity: item.quantity,
        image_url: item.gear_item.image_url,
        cart_item_id: item.id
      }))
    } catch (error) {
      console.error('Failed to add to backend cart:', error)
      // Fallback to local
    }
  }
  
  // Local cart logic
  const cart = getLocalCart()
  const existing = cart.find(c => c.id === item.id)
  
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ ...item, quantity })
  }
  
  saveLocalCart(cart)
  return cart
}

// Remove item from cart
export async function removeFromCart(itemId: number, cartItemId?: number): Promise<CartItem[]> {
  if (isLoggedIn() && cartItemId) {
    try {
      const response = await removeFromCartAPI(cartItemId)
      return response.items.map(item => ({
        id: item.gear_item.id,
        name: item.gear_item.name,
        price: item.gear_item.price,
        brand: item.gear_item.brand,
        category: item.gear_item.category,
        quantity: item.quantity,
        image_url: item.gear_item.image_url,
        cart_item_id: item.id
      }))
    } catch (error) {
      console.error('Failed to remove from backend cart:', error)
    }
  }
  
  const cart = getLocalCart().filter(c => c.id !== itemId)
  saveLocalCart(cart)
  return cart
}

// Update item quantity
export async function updateQuantity(itemId: number, quantity: number, cartItemId?: number): Promise<CartItem[]> {
  if (quantity <= 0) {
    return removeFromCart(itemId, cartItemId)
  }
  
  if (isLoggedIn() && cartItemId) {
    try {
      const response = await updateCartItemAPI(cartItemId, quantity)
      return response.items.map(item => ({
        id: item.gear_item.id,
        name: item.gear_item.name,
        price: item.gear_item.price,
        brand: item.gear_item.brand,
        category: item.gear_item.category,
        quantity: item.quantity,
        image_url: item.gear_item.image_url,
        cart_item_id: item.id
      }))
    } catch (error) {
      console.error('Failed to update backend cart:', error)
    }
  }
  
  const cart = getLocalCart()
  const item = cart.find(c => c.id === itemId)
  
  if (item) {
    item.quantity = quantity
    saveLocalCart(cart)
  }
  
  return cart
}

// Clear cart
export async function clearCart(): Promise<void> {
  if (isLoggedIn()) {
    try {
      await clearCartAPI()
    } catch (error) {
      console.error('Failed to clear backend cart:', error)
    }
  }
  localStorage.removeItem(CART_KEY)
}

// Get cart total
export async function getCartTotal(): Promise<number> {
  const cart = await getCart()
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// Get cart count
export async function getCartCount(): Promise<number> {
  const cart = await getCart()
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
