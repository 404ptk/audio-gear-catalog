export type Category = 'microphone' | 'headphones' | 'interface'

export interface GearItem {
  id: number
  name: string
  category: Category
  brand: string
  price: number
  in_stock: boolean
  rating?: number | null
  description?: string | null
  // Optional image URL for displaying product photos
  image_url?: string | null
}

// --- Auth types & helpers ---
export interface Token {
  access_token: string
  token_type: 'bearer' | string
}

export interface User {
  id?: number | null
  username: string
  is_admin: boolean
}

// --- User Management types ---
export interface UserInfo {
  id: number
  username: string
  is_admin: boolean
}

export interface PagedUsersResponse {
  items: UserInfo[]
  total: number
  page: number
  page_size: number
  pages: number
}

// --- Cart types ---
export interface CartItemResponse {
  id: number
  gear_item_id: number
  quantity: number
  gear_item: GearItem
}

export interface CartResponse {
  items: CartItemResponse[]
  total: number
}

const TOKEN_KEY = 'auth_token'

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Prefer backend on same origin in production; in dev (vite on 5173) fallback to localhost:8000
const API_URL = (import.meta as any).env?.VITE_API_URL || (
  typeof window !== 'undefined' && window.location && window.location.port !== '5173'
    ? window.location.origin
    : 'http://localhost:8000'
)

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`)
  if (!res.ok) throw new Error('Failed to load categories')
  return res.json()
}

// Paged API types
export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type GearQuery = {
  category?: Category
  q?: string
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'rating_desc' | 'in_stock'
  page?: number
  page_size?: number
}

export type AdminGearQuery = {
  category?: Category
  q?: string
  sort?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'id_asc' | 'id_desc'
  page?: number
  page_size?: number
}

export type AdminUsersQuery = {
  q?: string
  sort?: 'username_asc' | 'username_desc' | 'id_asc' | 'id_desc' | 'admin_first'
  page?: number
  page_size?: number
}

export async function getGear(params: GearQuery = {}): Promise<PagedResponse<GearItem>> {
  const url = new URL(`${API_URL}/api/gear`)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.q) url.searchParams.set('q', params.q)
  if (params.sort) url.searchParams.set('sort', params.sort)
  if (params.page) url.searchParams.set('page', String(params.page))
  if (params.page_size) url.searchParams.set('page_size', String(params.page_size))
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load gear')
  const json = await res.json()
  // Backward compatibility: if backend returns a plain array, wrap it
  if (Array.isArray(json)) {
    const arr = json as GearItem[]
    return { items: arr, total: arr.length, page: 1, page_size: arr.length, pages: 1 }
  }
  // Fallback guard
  if (!json || !Array.isArray(json.items)) {
    return { items: [], total: 0, page: 1, page_size: params.page_size ?? 0, pages: 1 }
  }
  return json as PagedResponse<GearItem>
}

export async function getSuggestions(q: string, category?: Category, limit = 8): Promise<GearItem[]> {
  const data = await getGear({ q, category, sort: 'relevance', page: 1, page_size: limit })
  return data.items
}

// --- Auth API ---
export async function login(username: string, password: string): Promise<Token> {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || 'Login failed')
  }
  const token: Token = await res.json()
  setAuthToken(token.access_token)
  return token
}

export async function register(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || 'Register failed')
  }
}

export async function getMe(): Promise<User> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

// --- Admin/Product CRUD ---
export type GearItemCreate = {
  name: string
  category: Category
  brand: string
  price: number
  in_stock?: boolean
  rating?: number | null
  description?: string | null
  image_url?: string | null
}
export type GearItemUpdate = Partial<GearItemCreate>

function authHeadersJSON() {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function getGearItem(id: number): Promise<GearItem> {
  const res = await fetch(`${API_URL}/api/gear/${id}`)
  if (!res.ok) throw new Error('Failed to load item')
  return res.json()
}

export async function createGear(data: GearItemCreate): Promise<GearItem> {
  const res = await fetch(`${API_URL}/api/gear`, {
    method: 'POST',
    headers: authHeadersJSON(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Create failed'))
  return res.json()
}

export async function updateGear(id: number, data: GearItemUpdate): Promise<GearItem> {
  const res = await fetch(`${API_URL}/api/gear/${id}`, {
    method: 'PATCH',
    headers: authHeadersJSON(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Update failed'))
  return res.json()
}

export async function deleteGear(id: number): Promise<void> {
  const headers: Record<string, string> = {}
  const t = getAuthToken()
  if (t) headers.Authorization = `Bearer ${t}`
  const res = await fetch(`${API_URL}/api/gear/${id}`, {
    method: 'DELETE',
    headers
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'Delete failed'))
}

// --- Cart API (for logged-in users) ---
export async function getCartFromAPI(): Promise<CartResponse> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to load cart')
  return res.json()
}

export async function addToCartAPI(gearItemId: number, quantity: number = 1): Promise<CartResponse> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_URL}/api/cart`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ gear_item_id: gearItemId, quantity })
  })
  if (!res.ok) throw new Error('Failed to add to cart')
  return res.json()
}

export async function updateCartItemAPI(cartItemId: number, quantity: number): Promise<CartResponse> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_URL}/api/cart/${cartItemId}`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ quantity })
  })
  if (!res.ok) throw new Error('Failed to update cart item')
  return res.json()
}

export async function removeFromCartAPI(cartItemId: number): Promise<CartResponse> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_URL}/api/cart/${cartItemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to remove from cart')
  return res.json()
}

export async function clearCartAPI(): Promise<CartResponse> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_URL}/api/cart`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to clear cart')
  return res.json()
}

// --- Admin: Gear Management with Pagination ---
export async function getAdminGear(params: AdminGearQuery = {}): Promise<PagedResponse<GearItem>> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  
  const url = new URL(`${API_URL}/api/admin/gear`)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.q) url.searchParams.set('q', params.q)
  if (params.sort) url.searchParams.set('sort', params.sort)
  if (params.page) url.searchParams.set('page', String(params.page))
  if (params.page_size) url.searchParams.set('page_size', String(params.page_size))
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to load admin gear list')
  return res.json()
}

// --- Admin: User Management ---
export async function getAdminUsers(params: AdminUsersQuery = {}): Promise<PagedUsersResponse> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  
  const url = new URL(`${API_URL}/api/admin/users`)
  if (params.q) url.searchParams.set('q', params.q)
  if (params.sort) url.searchParams.set('sort', params.sort)
  if (params.page) url.searchParams.set('page', String(params.page))
  if (params.page_size) url.searchParams.set('page_size', String(params.page_size))
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

export async function deleteUser(userId: number): Promise<void> {
  const token = getAuthToken()
  if (!token) throw new Error('No token')
  
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || 'Failed to delete user')
  }
}
