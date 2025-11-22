import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from './api'
import { syncCartToBackend } from './cart'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
      // Synchronizuj lokalny koszyk z backendem po zalogowaniu
      await syncCartToBackend()
      navigate('/')
    } catch (e: any) {
      setError(e?.message || 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Logowanie</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Nazwa użytkownika</span>
          <input value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle} disabled={loading} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Hasło</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} disabled={loading} />
        </label>
        <button disabled={loading} type="submit" style={{ ...btnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <Spinner size={16} />}
          {loading ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
      <div style={{ marginTop: 12 }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Powrót</Link>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #2563eb',
  background: '#e0e7ff',
  cursor: 'pointer',
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