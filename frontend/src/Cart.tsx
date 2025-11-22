import { useState, useEffect } from 'react'
import { CartItem, getCart, removeFromCart, updateQuantity, clearCart, getCartTotal } from './cart'
import { getItemImages } from './images'
import Header from './Header'

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    setLoading(true)
    try {
      const items = await getCart()
      const totalPrice = await getCartTotal()
      setCart(items)
      setTotal(totalPrice)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: number, cartItemId?: number) => {
    const updated = await removeFromCart(id, cartItemId)
    setCart(updated)
    setTotal(await getCartTotal())
  }

  const handleQuantityChange = async (id: number, quantity: number, cartItemId?: number) => {
    const updated = await updateQuantity(id, quantity, cartItemId)
    setCart(updated)
    setTotal(await getCartTotal())
  }

  const handleClearCart = async () => {
    if (confirm('Czy na pewno chcesz wyczyścić koszyk?')) {
      await clearCart()
      setCart([])
      setTotal(0)
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
        <Header />
        <h1>Koszyk</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 0' }}>
          <Spinner size={32} />
          <p style={{ fontSize: 16, color: '#6b7280' }}>Ładowanie koszyka…</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
        <Header />
        <h1>Koszyk</h1>
        <p style={{ fontSize: 16, color: '#6b7280' }}>Twój koszyk jest pusty</p>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>Wróć do sklepu</a>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <Header />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Koszyk ({cart.length} {cart.length === 1 ? 'produkt' : 'produktów'})</h1>
        <button
          onClick={handleClearCart}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #dc2626',
            background: '#fff',
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Wyczyść koszyk
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cart.map(item => {
          const imgs = getItemImages(item as any)
          const imgSrc = imgs.length > 0 ? imgs[0] : 'https://via.placeholder.com/100x100/f9fafb/9ca3af?text=Brak'
          
          return (
          <div
            key={item.cart_item_id || item.id}
            style={{
              display: 'flex',
              gap: 16,
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              background: '#fff',
              alignItems: 'center',
            }}
          >
            <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f9fafb' }}>
              <img
                src={imgSrc}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{item.name}</h3>
              <p style={{ margin: '0 0 8px', fontSize: 14, color: '#6b7280' }}>{item.brand} • {labelForCategory(item.category)}</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{item.price.toFixed(2)} zł</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.cart_item_id)}
                disabled={item.quantity <= 1}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: item.quantity <= 1 ? '#f3f4f6' : '#fff',
                  cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 18,
                }}
              >
                −
              </button>
              <span style={{ minWidth: 40, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.cart_item_id)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 18,
                }}
              >
                +
              </button>
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, minWidth: 120, textAlign: 'right' }}>
              {(item.price * item.quantity).toFixed(2)} zł
            </div>

            <button
              onClick={() => handleRemove(item.id, item.cart_item_id)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #dc2626',
                background: '#fff',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: 14,
              }}
              title="Usuń z koszyka"
            >
              🗑️
            </button>
          </div>
        )})}
      </div>

      <div style={{ marginTop: 32, padding: 24, border: '2px solid #2563eb', borderRadius: 12, background: '#eff6ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>Suma:</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{total.toFixed(2)} zł</span>
        </div>
        <button
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => alert('Funkcja płatności zostanie wkrótce dodana!')}
        >
          Przejdź do płatności
        </button>
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 14 }}>
          ← Kontynuuj zakupy
        </a>
      </div>
    </div>
  )
}

function labelForCategory(c: string) {
  switch (c) {
    case 'microphone': return 'Mikrofon'
    case 'headphones': return 'Słuchawki'
    case 'interface': return 'Interfejs'
    default: return c
  }
}

// Spinner component
function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
