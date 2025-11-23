import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from './api'
import { getMe, getAuthToken, clearAuthToken } from './api'
import { getCartCount } from './cart'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [showFloatingButtons, setShowFloatingButtons] = useState(false)

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
        // If getMe fails (e.g. invalid/expired token), clear the token and set user to null
        if (!cancelled) {
          clearAuthToken()
          setUser(null)
        }
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
    
    // Reduce frequency from 500ms to 5s and only when user is present or checking local storage
    const interval = setInterval(() => {
      // Only update if we have a token or we're checking local cart
      const token = getAuthToken()
      if (token || !user) {
        updateCount()
      }
    }, 5000) // Changed from 500ms to 5000ms (5 seconds)
    return () => clearInterval(interval)
  }, [user]) // Add user dependency to restart interval when auth status changes

  const logout = () => {
    clearAuthToken()
    setUser(null)
    // Refresh cart count after logout (will switch to local storage)
    getCartCount().then(setCartCount)
  }

  const copyToken = async () => {
    const token = getAuthToken()
    if (token) {
      try {
        await navigator.clipboard.writeText(token)
        alert('Token skopiowany do schowka!')
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = token
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Token skopiowany do schowka!')
      }
    } else {
      alert('Brak tokenu do skopiowania')
    }
  }

  const resetLocalStorage = () => {
    if (confirm('Czy na pewno chcesz zresetować localStorage? To wyloguje Cię i usunie wszystkie lokalne dane.')) {
      localStorage.clear()
      setUser(null)
      setCartCount(0)
      alert('localStorage został wyczyszczony')
      // Reload page to ensure clean state
      window.location.reload()
    }
  }

  return (
    <>
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

      {/* Floating Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 1000
      }}>
        {/* Toggle button */}
        <button
          onClick={() => setShowFloatingButtons(!showFloatingButtons)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: '#2563eb',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            transition: 'all 0.2s ease',
            transform: showFloatingButtons ? 'rotate(45deg)' : 'rotate(0deg)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
        >
          ⚙️
        </button>

        {/* Action buttons */}
        {showFloatingButtons && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'fadeInUp 0.2s ease-out'
          }}>
            {/* Copy Token Button */}
            <button
              onClick={copyToken}
              title="Skopiuj token uwierzytelnienia"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                background: '#059669',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#047857'}
              onMouseOut={(e) => e.currentTarget.style.background = '#059669'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>

            {/* Reset LocalStorage Button */}
            <button
              onClick={resetLocalStorage}
              title="Zresetuj localStorage"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                background: '#dc2626',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
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
