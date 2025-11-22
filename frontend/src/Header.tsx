import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from './api'
import { getMe, getAuthToken, clearAuthToken } from './api'
import { getCartCount } from './cart'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) { setUser(null); return }
    let cancelled = false
    const run = async () => {
      setAuthLoading(true)
      try {
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    // Update cart count on mount and periodically
    const updateCount = async () => {
      const count = await getCartCount()
      setCartCount(count)
    }
    updateCount()
    
    const interval = setInterval(updateCount, 500)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    clearAuthToken()
    setUser(null)
    // Refresh cart count after logout (will switch to local storage)
    getCartCount().then(setCartCount)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1 style={{ marginTop: 0, cursor: 'pointer' }}>Audio Gear Catalog</h1>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Cart icon */}
        <Link to="/cart" style={{ position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center', color: '#111827' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {cartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: -10,
              background: '#dc2626',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 9999,
              minWidth: 13,
              height: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
            }}>
              {cartCount}
            </span>
          )}
        </Link>

        {authLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner size={16} />
            <span style={{ color: '#6b7280', fontSize: 14 }}>Sprawdzanie sesji…</span>
          </div>
        ) : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.is_admin && (
              <Link to="/admin" style={{ color: '#2563eb', textDecoration: 'none' }}>Panel admina</Link>
            )}
            <span style={{ fontSize: 14 }}>Zalogowano jako <strong>{user.username}</strong>{user.is_admin ? ' (admin)' : ''}</span>
            <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer' }}>Wyloguj</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Zaloguj</Link>
            <span style={{ color: '#9ca3af' }}>|</span>
            <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none' }}>Zarejestruj</Link>
          </div>
        )}
      </div>
    </div>
  )
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
