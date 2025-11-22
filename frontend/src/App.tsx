import { useEffect, useMemo, useState } from 'react'
import { Category, GearItem, getCategories, getGear, getSuggestions } from './api'
import { useNavigate } from 'react-router-dom'
import { getItemImages } from './images'
import type { User } from './api'
import Header from './Header'
import { addToCart } from './cart'

// Placeholder used when an item has no image
const PLACEHOLDER_IMG = 'https://via.placeholder.com/400x300/ffffff/9ca3af?text=Brak+zdj%C4%99cia'

export default function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCat, setActiveCat] = useState<Category | ''>('')
  const [items, setItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [search, setSearch] = useState('')
  const [openSug, setOpenSug] = useState(false)
  const [suggestions, setSuggestions] = useState<GearItem[]>([])
  const navigate = useNavigate()

  // Sorting state
  type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc' | 'rating_desc' | 'in_stock'
  const [sort, setSort] = useState<SortOption>('relevance')

  // Pagination state
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Reset filters/search
  const resetAll = () => {
    setActiveCat('')
    setSearch('')
    setSort('relevance')
    setPage(1)
    setOpenSug(false)
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(e => setError(String(e)))
  }, [])

  // Load items from backend with filters/search/sort/pagination
  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getGear({
          category: activeCat || undefined,
          q: search || undefined,
          sort,
          page,
          page_size: PAGE_SIZE,
        })
        setItems(data.items)
        setTotal(data.total)
        setTotalPages(data.pages)
      } catch (e: any) {
        setError(String(e?.message || e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [activeCat, search, sort, page])

  // Suggestions from backend (lightweight, first page only)
  useEffect(() => {
    const q = search.trim()
    if (!q) { setSuggestions([]); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const items = await getSuggestions(q, activeCat || undefined, 8)
        if (!cancelled) setSuggestions(items)
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }, 150)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search, activeCat])

  const title = useMemo(() => {
    if (!activeCat) return 'Wszystkie urządzenia audio'
    const map: Record<Category, string> = {
      microphone: 'Mikrofony',
      headphones: 'Słuchawki',
      interface: 'Interfejsy audio',
    }
    return map[activeCat]
  }, [activeCat])

  // Pagination derived data (page buttons window)
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  // Reset/clamp page on filters change
  useEffect(() => { setPage(1) }, [activeCat, search, sort])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [totalPages, page])

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <Header />

      {/* Search with suggestions */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpenSug(true) }}
          onFocus={() => setOpenSug(true)}
          onBlur={() => setTimeout(() => setOpenSug(false), 120)}
          placeholder="Szukaj po nazwie…"
          aria-label="Wyszukaj produkt po nazwie"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #d1d5db',
            outline: 'none',
            fontSize: 14,
          }}
        />
        {openSug && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            marginTop: 6,
            boxShadow: '0 10px 24px rgba(0,0,0,0.08)'
          }}>
            {suggestions.map(s => (
              <div
                key={s.id}
                onMouseDown={(e) => { e.preventDefault(); setOpenSug(false); setSearch(''); navigate(`/product/${s.id}`) }}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                title={s.name}
              >
                <span style={{ fontSize: 13, color: '#6b7280' }}>{s.brand}</span>
                <span style={{ fontSize: 14 }}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setActiveCat('')} style={btnStyle(activeCat === '')}>Wszystko</button>
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCat(c)} style={btnStyle(activeCat === c)}>
            {c === 'microphone' ? 'Mikrofony' : c === 'headphones' ? 'Słuchawki' : 'Interfejsy'}
          </button>
        ))}
      </div>

      {/* Title + sorting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="sort" style={{ fontSize: 13, color: '#6b7280' }}>Sortuj:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
            aria-label="Sortuj wyniki"
          >
            <option value="relevance">Domyślne</option>
            <option value="price_asc">Cena: rosnąco</option>
            <option value="price_desc">Cena: malejąco</option>
            <option value="name_asc">Nazwa A–Z</option>
            <option value="rating_desc">Ocena: najwyższa</option>
            <option value="in_stock">Dostępność</option>
          </select>
          <button onClick={resetAll} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}>
            Resetuj
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <Spinner size={32} />
          <p style={{ fontSize: 16, color: '#6b7280' }}>Ładowanie produktów…</p>
        </div>
      )}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {items.map((i) => (
              <GearCard key={i.id} item={i} />
            ))}
          </div>

          {/* Pagination controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {total === 0 ? 'Brak wyników' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} z ${total}`}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: page === 1 ? '#f3f4f6' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                aria-label="Poprzednia strona"
              >
                ‹
              </button>
              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  aria-current={n === page ? 'page' : undefined}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: n === page ? '2px solid #2563eb' : '1px solid #d1d5db',
                    background: n === page ? '#e0e7ff' : '#fff',
                    cursor: 'pointer',
                    minWidth: 40,
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || total === 0}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: (page === totalPages || total === 0) ? '#f3f4f6' : '#fff', cursor: (page === totalPages || total === 0) ? 'not-allowed' : 'pointer' }}
                aria-label="Następna strona"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GearCard({ item }: { item: GearItem }) {
  const navigate = useNavigate()
  const imgs = useMemo(() => getItemImages(item), [item])
  const [idx, setIdx] = useState(0)
  const hasImages = imgs.length > 0
  const canSlide = imgs.length > 1
  const [hovered, setHovered] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => { setIdx(0) }, [imgs.join('|')])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      brand: item.brand,
      category: item.category,
      image_url: hasImages ? imgs[0] : null,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <article
      style={{
        ...cardStyle,
        background: hovered ? '#fff' : (cardStyle.background as string),
        boxShadow: hovered ? '0 10px 24px rgba(0,0,0,0.10)' : (cardStyle.boxShadow as string),
        border: hovered ? '1px solid #ffffff' : (cardStyle.border as string),
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/product/${item.id}`)}
    >
      <div style={{
        ...imageWrapStyle,
        background: hovered ? '#ffffff' : (imageWrapStyle.background as string),
        transition: 'background .25s ease',
      }}>
        <img
          src={hasImages ? imgs[idx] : PLACEHOLDER_IMG}
          alt={item.name}
          style={{ ...imgStyle, transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform .25s ease' }}
          loading="lazy"
        />
        {canSlide && (
          <>
            <button
              aria-label="Poprzednie zdjęcie"
              onClick={(e) => { e.stopPropagation(); setIdx((v) => (v - 1 + imgs.length) % imgs.length) }}
              style={{ ...navBtnStyle, left: 8 }}
            >
              ‹
            </button>
            <button
              aria-label="Następne zdjęcie"
              onClick={(e) => { e.stopPropagation(); setIdx((v) => (v + 1) % imgs.length) }}
              style={{ ...navBtnStyle, right: 8 }}
            >
              ›
            </button>
          </>
        )}
        {canSlide && (
          <div style={dotsWrapStyle}>
            {imgs.map((_, i) => (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                style={{
                  ...dotStyle,
                  opacity: i === idx ? 1 : 0.45,
                  transform: i === idx ? 'scale(1)' : 'scale(0.9)'
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 14, color: '#666' }}>{labelForCategory(item.category)}</div>
      <h3 style={titleStyle}>{item.name}</h3>
      <div style={{ fontSize: 14, color: '#333' }}>
        Marka: <strong>{item.brand}</strong>
      </div>
      {'rating' in item && item.rating != null && <div style={{ fontSize: 14 }}>Ocena: {item.rating.toFixed(1)} / 5</div>}
      <div style={{ marginTop: 8, fontSize: 16 }}>
        <strong>{item.price.toFixed(2)} zł</strong>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: item.in_stock ? 'green' : 'crimson' }}>{item.in_stock ? 'Dostępny' : 'Brak w magazynie'}</div>
      {item.description && (
        <p style={{ ...descStyle, fontSize: 13, color: '#555', marginTop: 8, marginBottom: 8 }}>{item.description}</p>
      )}
      
      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        disabled={!item.in_stock || addedToCart}
        style={{
          marginTop: 'auto',
          padding: '10px 16px',
          borderRadius: 8,
          border: 'none',
          background: addedToCart ? '#10b981' : (item.in_stock ? '#2563eb' : '#d1d5db'),
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: item.in_stock && !addedToCart ? 'pointer' : 'not-allowed',
          transition: 'background .2s ease',
          flexShrink: 0,
        }}
      >
        {addedToCart ? '✓ Dodano do koszyka' : (item.in_stock ? 'Dodaj do koszyka' : 'Brak w magazynie')}
      </button>
    </article>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
  background: '#fff',
  boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 520,
  transition: 'background .2s ease, box-shadow .2s ease, border-color .2s ease',
}

const imageWrapStyle: React.CSSProperties = {
  width: '100%',
  height: 220,
  borderRadius: 10,
  overflow: 'hidden',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
  position: 'relative',
}

const imgStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  willChange: 'transform',
}

const navBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #d1d5db',
  width: 32,
  height: 32,
  borderRadius: 9999,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  lineHeight: 1,
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
}

const dotsWrapStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
}

const dotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 9999,
  background: '#111827',
  transition: 'all .15s ease',
  cursor: 'pointer'
}

const titleStyle: React.CSSProperties = {
  margin: '4px 0 8px',
  fontSize: 19,
  fontWeight: 700,
  display: '-webkit-box',
  WebkitLineClamp: 2 as any,
  WebkitBoxOrient: 'vertical' as any,
  overflow: 'hidden',
  minHeight: 48,
}

const descStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2 as any,
  WebkitBoxOrient: 'vertical' as any,
  overflow: 'hidden',
  flex: '0 0 auto',
}

function btnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 8,
    border: active ? '2px solid #2563eb' : '1px solid #ccc',
    background: active ? '#e0e7ff' : '#f7f7f7',
    cursor: 'pointer',
  }
}

function labelForCategory(c: Category) {
  switch (c) {
    case 'microphone': return 'Mikrofon'
    case 'headphones': return 'Słuchawki'
    case 'interface': return 'Interfejs'
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
