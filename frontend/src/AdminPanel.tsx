import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Category,
  GearItem,
  getCategories,
  getAdminGear,
  getAdminUsers,
  getMe,
  createGear,
  updateGear,
  deleteGear,
  deleteUser,
  getAuthToken,
  type GearItemCreate,
  type UserInfo,
  type AdminGearQuery,
  type AdminUsersQuery,
} from './api'
import Header from './Header'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check auth on mount and when token changes
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken()
      if (!token) {
        setIsAdmin(false)
        setAuthChecked(true)
        return
      }
      
      try {
        const me = await getMe()
        setIsAdmin(!!me.is_admin)
      } catch {
        setIsAdmin(false)
      } finally {
        setAuthChecked(true)
      }
    }
    
    checkAuth()
    
    // Poll for auth changes (e.g., logout in another component)
    const interval = setInterval(() => {
      const token = getAuthToken()
      if (!token && isAdmin) {
        // Token removed, redirect to login
        setIsAdmin(false)
        navigate('/login')
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [isAdmin, navigate])

  if (!authChecked) return (
    <div style={PageWrap}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '60px 0' }}>
        <Spinner size={32} />
        <p style={{ fontSize: 16, color: '#6b7280' }}>Sprawdzanie uprawnień…</p>
      </div>
    </div>
  )
  if (!isAdmin) return (
    <div style={PageWrap}>
      <Header />
      <p>Brak uprawnień. Zaloguj się jako administrator.</p>
      <Link to="/login" style={linkStyle}>Przejdź do logowania</Link>
    </div>
  )

  return <AdminContent />
}

function AdminContent() {
  const [activeTab, setActiveTab] = useState<'products' | 'users'>('products')

  return (
    <div style={PageWrap}>
      <Header />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Panel administratora</h1>
        <Link to="/" style={linkStyle}>← Wróć do sklepu</Link>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
        <button 
          onClick={() => setActiveTab('products')} 
          style={{
            ...tabButton,
            borderBottom: activeTab === 'products' ? '3px solid #2563eb' : 'none',
            color: activeTab === 'products' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'products' ? 600 : 400
          }}
        >
          Produkty
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{
            ...tabButton,
            borderBottom: activeTab === 'users' ? '3px solid #2563eb' : 'none',
            color: activeTab === 'users' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'users' ? 600 : 400
          }}
        >
          Użytkownicy
        </button>
      </div>

      {activeTab === 'products' ? <ProductsManagement /> : <UsersManagement />}
    </div>
  )
}

function ProductsManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState<AdminGearQuery>({ page: 1, page_size: 5, sort: 'name_asc' })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')

  const [creating, setCreating] = useState<GearItemCreate>({
    name: '', category: 'microphone', brand: '', price: 0, in_stock: true, rating: undefined, description: '', image_url: ''
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editing, setEditing] = useState<GearItemCreate | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cats, list] = await Promise.all([getCategories(), getAdminGear(query)])
      setCategories(cats)
      setItems(list.items)
      setTotal(list.total)
      setPages(list.pages)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [query])

  const handleSearch = () => {
    setQuery(prev => ({ ...prev, q: searchInput.trim() || undefined, page: 1 }))
  }

  const startEdit = (it: GearItem) => {
    setEditingId(it.id)
    setEditing({
      name: it.name,
      category: it.category,
      brand: it.brand,
      price: it.price,
      in_stock: it.in_stock,
      rating: it.rating ?? undefined,
      description: it.description ?? '',
      image_url: it.image_url ?? ''
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditing(null) }

  const submitEdit = async () => {
    if (editingId == null || !editing) return
    try {
      await updateGear(editingId, editing)
      cancelEdit()
      load()
    } catch (e: any) {
      alert(e?.message || 'Update failed')
    }
  }

  const submitCreate = async () => {
    try {
      await createGear(creating)
      setCreating({ name: '', category: 'microphone', brand: '', price: 0, in_stock: true, rating: undefined, description: '', image_url: '' })
      load()
    } catch (e: any) {
      alert(e?.message || 'Create failed')
    }
  }

  const onDelete = async (id: number) => {
    if (!confirm('Usunąć produkt?')) return
    try {
      await deleteGear(id)
      load()
    } catch (e: any) {
      alert(e?.message || 'Delete failed')
    }
  }

  return (
    <>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Dodaj nowy produkt</h2>
        <ProductForm
          categories={categories}
          value={creating}
          onChange={setCreating}
          onSubmit={submitCreate}
          submitLabel="Dodaj"
        />
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: '8px 0' }}>Wszystkie produkty ({total})</h2>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              placeholder="Szukaj produktu..." 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ ...input, flex: 1 }}
            />
            <button onClick={handleSearch} style={button}>Szukaj</button>
            {query.q && <button onClick={() => { setSearchInput(''); setQuery(prev => ({ ...prev, q: undefined, page: 1 })) }} style={{ ...button, background: '#fee2e2' }}>Wyczyść</button>}
          </div>

          <select 
            value={query.category || ''} 
            onChange={e => setQuery(prev => ({ ...prev, category: e.target.value as Category || undefined, page: 1 }))}
            style={{ ...input, width: 180 }}
          >
            <option value="">Wszystkie kategorie</option>
            <option value="microphone">microphone</option>
            <option value="headphones">headphones</option>
            <option value="interface">interface</option>
          </select>

          <select 
            value={query.sort || 'name_asc'} 
            onChange={e => setQuery(prev => ({ ...prev, sort: e.target.value as any, page: 1 }))}
            style={{ ...input, width: 200 }}
          >
            <option value="name_asc">Nazwa: A-Z</option>
            <option value="name_desc">Nazwa: Z-A</option>
            <option value="price_asc">Cena: rosnąco</option>
            <option value="price_desc">Cena: malejąco</option>
            <option value="rating_desc">Ocena: najwyższe</option>
            <option value="id_asc">ID: rosnąco</option>
            <option value="id_desc">ID: malejąco</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0' }}>
            <Spinner size={28} />
            <p style={{ fontSize: 16, color: '#6b7280' }}>Ładowanie produktów…</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={thTd}>ID</th>
                    <th style={{ ...thTd, minWidth: 260 }}>Nazwa</th>
                    <th style={thTd}>Kategoria</th>
                    <th style={thTd}>Marka</th>
                    <th style={thTd}>Cena</th>
                    <th style={thTd}>Stan</th>
                    <th style={thTd}>Ocena</th>
                    <th style={{ ...thTd, textAlign: 'right' }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id}>
                      <td style={thTd}>{it.id}</td>
                      <td style={{ ...thTd, minWidth: 260 }}>
                        {editingId === it.id ? (
                          <input value={editing?.name || ''} onChange={e => setEditing(v => ({ ...(v as any), name: e.target.value }))} style={input}/>
                        ) : it.name}
                      </td>
                      <td style={thTd}>
                        {editingId === it.id ? (
                          <select value={editing?.category || 'microphone'} onChange={e => setEditing(v => ({ ...(v as any), category: e.target.value as Category }))} style={input}>
                            {['microphone','headphones','interface'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : it.category}
                      </td>
                      <td style={thTd}>
                        {editingId === it.id ? (
                          <input value={editing?.brand || ''} onChange={e => setEditing(v => ({ ...(v as any), brand: e.target.value }))} style={input}/>
                        ) : it.brand}
                      </td>
                      <td style={thTd}>
                        {editingId === it.id ? (
                          <input type="number" step="0.01" value={editing?.price ?? 0} onChange={e => setEditing(v => ({ ...(v as any), price: parseFloat(e.target.value) }))} style={{ ...input, width: 120 }}/>
                        ) : `${it.price.toFixed(2)} zł`}
                      </td>
                      <td style={thTd}>
                        {editingId === it.id ? (
                          <select value={String(editing?.in_stock ?? true)} onChange={e => setEditing(v => ({ ...(v as any), in_stock: e.target.value === 'true' }))} style={input}>
                            <option value="true">Dostępny</option>
                            <option value="false">Brak</option>
                          </select>
                        ) : (
                          <span style={{ color: it.in_stock ? 'green' : 'crimson' }}>{it.in_stock ? 'Dostępny' : 'Brak'}</span>
                        )}
                      </td>
                      <td style={thTd}>
                        {editingId === it.id ? (
                          <input type="number" step="0.1" value={editing?.rating ?? ''} onChange={e => setEditing(v => ({ ...(v as any), rating: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} style={{ ...input, width: 100 }}/>
                        ) : (it.rating != null ? it.rating.toFixed(1) : '—')}
                      </td>
                      <td style={{ ...thTd, textAlign: 'right' }}>
                        {editingId === it.id ? (
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button onClick={submitEdit} style={{ ...button, minWidth: 84 }}>Zapisz</button>
                            <button onClick={cancelEdit} style={{ ...button, background: '#f3f4f6', minWidth: 84 }}>Anuluj</button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button onClick={() => startEdit(it)} style={{ ...button, minWidth: 84 }}>Edytuj</button>
                            <button onClick={() => onDelete(it.id)} style={{ ...button, background: '#fee2e2', borderColor: '#fecaca', minWidth: 84 }}>Usuń</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <button 
                  onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                  disabled={query.page === 1}
                  style={{ ...button, opacity: query.page === 1 ? 0.5 : 1, cursor: query.page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Poprzednia
                </button>
                <span>Strona {query.page} z {pages}</span>
                <button 
                  onClick={() => setQuery(prev => ({ ...prev, page: Math.min(pages, (prev.page || 1) + 1) }))}
                  disabled={query.page === pages}
                  style={{ ...button, opacity: query.page === pages ? 0.5 : 1, cursor: query.page === pages ? 'not-allowed' : 'pointer' }}
                >
                  Następna →
                </button>
                <label style={{ fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Pokaż:
                  <select 
                    value={query.page_size || 5} 
                    onChange={e => setQuery(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                    style={{ ...input, width: 80 }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </label>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

function UsersManagement() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState<AdminUsersQuery>({ page: 1, page_size: 5, sort: 'admin_first' })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getAdminUsers(query)
      setUsers(list.items)
      setTotal(list.total)
      setPages(list.pages)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [query])

  const handleSearch = () => {
    setQuery(prev => ({ ...prev, q: searchInput.trim() || undefined, page: 1 }))
  }

  const onDeleteUser = async (userId: number) => {
    if (!confirm('Usunąć tego użytkownika? Wszystkie jego dane (w tym koszyk) zostaną usunięte.')) return
    try {
      await deleteUser(userId)
      load()
    } catch (e: any) {
      alert(e?.message || 'Delete failed')
    }
  }

  return (
    <section>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: '8px 0' }}>Użytkownicy ({total})</h2>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            placeholder="Szukaj użytkownika..." 
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ ...input, flex: 1 }}
          />
          <button onClick={handleSearch} style={button}>Szukaj</button>
          {query.q && <button onClick={() => { setSearchInput(''); setQuery(prev => ({ ...prev, q: undefined, page: 1 })) }} style={{ ...button, background: '#fee2e2' }}>Wyczyść</button>}
        </div>

        <select 
          value={query.sort || 'admin_first'} 
          onChange={e => setQuery(prev => ({ ...prev, sort: e.target.value as any, page: 1 }))}
          style={{ ...input, width: 220 }}
        >
          <option value="admin_first">Administratorzy pierwsi</option>
          <option value="username_asc">Nazwa użytkownika: A-Z</option>
          <option value="username_desc">Nazwa użytkownika: Z-A</option>
          <option value="id_asc">ID: rosnąco (najstarsi)</option>
          <option value="id_desc">ID: malejąco (najnowsi)</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0' }}>
          <Spinner size={28} />
          <p style={{ fontSize: 16, color: '#6b7280' }}>Ładowanie użytkowników…</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={{ ...thTd, textAlign: 'center' }}>ID</th>
                  <th style={{ ...thTd, minWidth: 200, textAlign: 'center' }}>Nazwa użytkownika</th>
                  <th style={{ ...thTd, textAlign: 'center' }}>Typ konta</th>
                  <th style={{ ...thTd, textAlign: 'center' }}>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ ...thTd, textAlign: 'center' }}>{user.id}</td>
                    <td style={{ ...thTd, minWidth: 200, textAlign: 'center' }}>{user.username}</td>
                    <td style={{ ...thTd, textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: 12, 
                        fontSize: 12, 
                        fontWeight: 600,
                        background: user.is_admin ? '#dbeafe' : '#f3f4f6',
                        color: user.is_admin ? '#1e40af' : '#6b7280'
                      }}>
                        {user.is_admin ? 'Administrator' : 'Użytkownik'}
                      </span>
                    </td>
                    <td style={{ ...thTd, textAlign: 'center' }}>
                      <button 
                        onClick={() => onDeleteUser(user.id)} 
                        style={{ ...button, background: '#fee2e2', borderColor: '#fecaca', minWidth: 84 }}
                        disabled={user.username === 'admin' && user.is_admin}
                        title={user.username === 'admin' && user.is_admin ? 'Nie można usunąć domyślnego konta administratora' : ''}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              <button 
                onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={query.page === 1}
                style={{ ...button, opacity: query.page === 1 ? 0.5 : 1, cursor: query.page === 1 ? 'not-allowed' : 'pointer' }}
              >
                ← Poprzednia
              </button>
              <span>Strona {query.page} z {pages}</span>
              <button 
                onClick={() => setQuery(prev => ({ ...prev, page: Math.min(pages, (prev.page || 1) + 1) }))}
                disabled={query.page === pages}
                style={{ ...button, opacity: query.page === pages ? 0.5 : 1, cursor: query.page === pages ? 'not-allowed' : 'pointer' }}
              >
                Następna →
              </button>
              <label style={{ fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                Pokaż:
                <select 
                  value={query.page_size || 5} 
                  onChange={e => setQuery(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                  style={{ ...input, width: 80 }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function ProductForm({ value, onChange, onSubmit, submitLabel, categories }: {
  value: GearItemCreate,
  onChange: (v: GearItemCreate) => void,
  onSubmit: () => void,
  submitLabel: string,
  categories: Category[]
}) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))' }}>
      <label style={label}><span>Nazwa</span><input value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} style={input} /></label>
      <label style={label}><span>Kategoria</span>
        <select value={value.category} onChange={e => onChange({ ...value, category: e.target.value as Category })} style={input}>
          {['microphone','headphones','interface'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label style={label}><span>Marka</span><input value={value.brand} onChange={e => onChange({ ...value, brand: e.target.value })} style={input} /></label>
      <label style={label}><span>Cena</span><input type="number" step="0.01" value={value.price} onChange={e => onChange({ ...value, price: parseFloat(e.target.value || '0') })} style={input} /></label>
      <label style={label}><span>Dostępność</span>
        <select value={String(value.in_stock ?? true)} onChange={e => onChange({ ...value, in_stock: e.target.value === 'true' })} style={input}>
          <option value="true">Dostępny</option>
          <option value="false">Brak</option>
        </select>
      </label>
      <label style={label}><span>Ocena</span><input type="number" step="0.1" value={value.rating ?? ''} onChange={e => onChange({ ...value, rating: e.target.value === '' ? undefined : parseFloat(e.target.value) })} style={input} /></label>
      <label style={{ ...label, gridColumn: 'span 2' }}><span>Adres obrazka (opcjonalnie)</span><input value={value.image_url || ''} onChange={e => onChange({ ...value, image_url: e.target.value })} style={input} placeholder="https://..." /></label>
      <label style={{ ...label, gridColumn: '1 / -1' }}><span>Opis</span><textarea value={value.description || ''} onChange={e => onChange({ ...value, description: e.target.value })} style={{ ...input, height: 96, resize: 'vertical' }} /></label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onSubmit} style={button}>{submitLabel}</button>
      </div>
    </div>
  )
}

// Styles
const PageWrap: React.CSSProperties = { fontFamily: 'system-ui, Arial, sans-serif', padding: 24, maxWidth: 1200, margin: '0 auto' }
const linkStyle: React.CSSProperties = { color: '#2563eb', textDecoration: 'none' }
const card: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'separate', borderSpacing: 0 }
const thTd: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle' }
const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', height: 36, boxSizing: 'border-box' }
const label: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 12, color: '#6b7280' }
const button: React.CSSProperties = { padding: '0 14px', height: 36, lineHeight: '36px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }
const tabButton: React.CSSProperties = { padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: -2, transition: 'all 0.2s' }

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
