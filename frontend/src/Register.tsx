import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as apiRegister } from './api'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (): string | null => {
    const u = username.trim()
    if (u.length < 3 || u.length > 32) return 'Nazwa użytkownika musi mieć 3–32 znaki'
    if (/\s/.test(u)) return 'Nazwa użytkownika nie może zawierać spacji'
    if (password.length < 6 || password.length > 128) return 'Hasło musi mieć 6–128 znaków'
    if (password !== confirm) return 'Hasła muszą być takie same'
    return null
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ve = validate()
    if (ve) { setError(ve); return }
    setLoading(true)
    setError(null)
    try {
      await apiRegister(username.trim(), password)
      navigate('/login')
    } catch (e: any) {
      setError(e?.message || 'Błąd rejestracji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Rejestracja</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={label}> 
          <span>Nazwa użytkownika</span>
          <input value={username} onChange={e => setUsername(e.target.value)} required style={inputStyle} minLength={3} maxLength={32} disabled={loading} />
        </label>
        <label style={label}>
          <span>Hasło</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} minLength={6} maxLength={128} disabled={loading} />
        </label>
        <label style={label}>
          <span>Powtórz hasło</span>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inputStyle} minLength={6} maxLength={128} disabled={loading} />
        </label>
        <button disabled={loading} type="submit" style={{ ...btnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <Spinner size={16} />}
          {loading ? 'Rejestracja…' : 'Zarejestruj'}
        </button>
      </form>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Powrót</Link>
        <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>Masz już konto? Zaloguj</Link>
      </div>
    </div>
  )
}

const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const inputStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }
const btnStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 8, border: '1px solid #2563eb', background: '#e0e7ff', cursor: 'pointer' }

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
