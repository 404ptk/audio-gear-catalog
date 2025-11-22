import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Category, GearItem, getGearItem } from './api'
import { getItemImages } from './images'
import Header from './Header'

const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x450/ffffff/9ca3af?text=Brak+zdj%C4%99cia'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<GearItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const pid = parseInt(id || '', 10)
      if (!pid) { setError('Nieprawidłowy identyfikator'); setLoading(false); return }
      try {
        const data = await getGearItem(pid)
        setItem(data)
      } catch (e: any) {
        setError(String(e?.message || e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) return (
    <div style={pageWrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: 12 }}>
        <Spinner size={32} />
        <p style={{ fontSize: 16, color: '#6b7280' }}>Ładowanie szczegółów produktu…</p>
      </div>
    </div>
  )
  if (error) return <div style={pageWrap}><p style={{ color: 'crimson' }}>{error}</p></div>
  if (!item) return (
    <div style={pageWrap}>
      <Header />
      <p>Nie znaleziono produktu.</p>
      <button onClick={() => navigate(-1)} style={backBtn}>Wróć</button>
    </div>
  )

  const ext = getExtendedContent(item)

  return (
    <div style={pageWrap}>
      <Header />
      <nav style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Wróć</button>
        <span style={{ color: '#9ca3af' }}>|</span>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Strona główna</Link>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24 }}>
        <DetailGallery item={item} />
        <section>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>{item.name}</h1>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>{labelForCategory(item.category)} · {item.brand}</div>
          {'rating' in item && item.rating != null && (
            <div style={{ fontSize: 14, marginBottom: 8 }}>Ocena: <strong>{item.rating.toFixed(1)}</strong> / 5</div>
          )}
          <div style={{ fontSize: 22, margin: '8px 0' }}><strong>{item.price.toFixed(2)} zł</strong></div>
          <div style={{ fontSize: 13, color: item.in_stock ? 'green' : 'crimson', marginBottom: 16 }}>
            {item.in_stock ? 'Dostępny' : 'Brak w magazynie'}
          </div>
          {item.description && (
            <p style={{ fontSize: 15, lineHeight: 1.55 }}>{item.description}</p>
          )}

          {ext && (
            <div style={{ marginTop: 16 }}>
              {ext.long && <p style={{ fontSize: 15, lineHeight: 1.6 }}>{ext.long}</p>}
              {ext.specs && ext.specs.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ margin: '12px 0 6px' }}>Specyfikacja</h3>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {ext.specs.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function DetailGallery({ item }: { item: GearItem }) {
  const imgs = useMemo(() => getItemImages(item), [item])
  const [idx, setIdx] = useState(0)
  const hasImages = imgs.length > 0
  const canSlide = imgs.length > 1

  useEffect(() => { setIdx(0) }, [imgs.join('|')])

  return (
    <section>
      <div style={galleryMainWrap}>
        <img
          src={hasImages ? imgs[idx] : PLACEHOLDER_IMG}
          alt={item.name}
          style={galleryMainImg}
        />
        {canSlide && (
          <>
            <button aria-label="Poprzednie zdjęcie" onClick={() => setIdx((v) => (v - 1 + imgs.length) % imgs.length)} style={{ ...galleryNavBtn, left: 10 }}>‹</button>
            <button aria-label="Następne zdjęcie" onClick={() => setIdx((v) => (v + 1) % imgs.length)} style={{ ...galleryNavBtn, right: 10 }}>›</button>
          </>
        )}
      </div>
      {canSlide && (
        <div style={thumbsWrap}>
          {imgs.map((u, i) => (
            <button key={u} onClick={() => setIdx(i)} style={{ ...thumbBtn, outline: i === idx ? '2px solid #2563eb' : '1px solid #e5e7eb' }}>
              <img src={u} alt={`miniatura ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function labelForCategory(c: Category) {
  switch (c) {
    case 'microphone': return 'Mikrofon'
    case 'headphones': return 'Słuchawki'
    case 'interface': return 'Interfejs'
  }
}

// Pure white page background
const pageWrap: React.CSSProperties = {
  fontFamily: 'system-ui, Arial, sans-serif',
  padding: '24px',
  maxWidth: 1100,
  margin: '0 auto',
  background: '#fff',
}

const backBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#f9fafb',
  cursor: 'pointer',
}

const galleryMainWrap: React.CSSProperties = {
  width: '100%',
  height: 420,
  borderRadius: 12,
  overflow: 'hidden',
  background: '#ffffff',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const galleryMainImg: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  background: '#ffffff',
}

const galleryNavBtn: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #d1d5db',
  width: 36,
  height: 36,
  borderRadius: 9999,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  lineHeight: 1,
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
}

const thumbsWrap: React.CSSProperties = {
  marginTop: 10,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
  gap: 8,
}

const thumbBtn: React.CSSProperties = {
  height: 72,
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
  border: '1px solid #e5e7eb',
  padding: 0,
  cursor: 'pointer',
}

function getExtendedContent(item: GearItem): { long?: string, specs?: string[] } | null {
  const name = item.name.toLowerCase()
  if (name.includes('sm58')) {
    return {
      long: 'Shure SM58 to klasyczny mikrofon dynamiczny do wokalu i mowy. Kardioidalna charakterystyka kierunkowa pomaga odizolować głos od dźwięków otoczenia, a legendarna, wytrzymała konstrukcja sprawia, że SM58 od dekad jest standardem scenicznym i studyjnym.',
      specs: [
        'Typ: dynamiczny, kardioidalny',
        'Pasmo przenoszenia: ok. 50 Hz – 15 kHz',
        'Czułość: ok. −54,5 dBV/Pa (1,85 mV)',
        'Impedancja nominalna: ~150 Ω',
        'Złącze: XLR 3‑pin',
        'Wbudowany filtr przeciwpodmuchowy i kosz antywstrząsowy',
      ],
    }
  }
  if (name.includes('ath-m50x') || name.includes('ath m50x')) {
    return {
      long: 'Audio‑Technica ATH‑M50x to zamknięte słuchawki studyjne cenione za neutralny, kontrolowany bas i bardzo dobrą izolację. Składana konstrukcja i odłączane przewody ułatwiają transport i pracę w terenie.',
      specs: [
        'Konstrukcja: wokółuszne, zamknięte; składane muszle',
        'Przetworniki: dynamiczne 45 mm',
        'Pasmo przenoszenia: ok. 15 Hz – 28 kHz',
        'Impedancja: ~38 Ω',
        'Czułość: ~99 dB SPL',
        'Okablowanie: odłączane przewody (prosty i skręcany) + adapter 6,3 mm',
        'Masa: ok. 285 g (bez przewodu)',
      ],
    }
  }
  if (name.includes('scarlett 2i2') || name.includes('2i2 3rd')) {
    return {
      long: 'Focusrite Scarlett 2i2 3rd Gen to popularny interfejs 2‑in/2‑out z przedwzmacniaczami Scarlett i trybem Air, zapewniający czyste nagrania wokali i instrumentów przy niskich opóźnieniach.',
      specs: [
        'Wejścia: 2 × combo XLR/TRS z zasilaniem +48 V',
        'Wyjścia: 2 × TRS (line out) + wyjście słuchawkowe',
        'Przetwarzanie: do 24‑bit / 192 kHz',
        'Funkcje: Direct Monitor, wskaźniki poziomu „Halo”, tryb Air',
        'Zasilanie i łączność: USB‑C (bus‑powered)',
        'Zgodność: Windows / macOS',
      ],
    }
  }
  if (name.includes('umc22')) {
    return {
      long: 'Behringer UMC22 to przystępny cenowo, prosty interfejs audio 2×2 z przedwzmacniaczem MIDAS i zasilaniem phantom, odpowiedni do podstawowych nagrań w domu i podcastów.',
      specs: [
        'Wejścia: 1 × XLR/TRS (MIDAS) + 1 × instrument (Hi‑Z)',
        'Wyjścia: para wyjść liniowych L/R + słuchawkowe',
        'Przetwarzanie: do 48 kHz',
        'Zasilanie i łączność: USB, funkcja Direct Monitor',
        'Zasilanie phantom: +48 V na wejściu mikrofonowym',
      ],
    }
  }
  // Nowe przedmioty — rozszerzone opisy i specyfikacje
  if (name.includes('at2020') || name.includes('audio-technica at2020') || name.includes('audio technica at2020')) {
    return {
      long: 'Audio‑Technica AT2020 to pojemnościowy mikrofon studyjny z charakterystyką kardioidalną, ceniony za naturalne brzmienie i niski poziom szumów w przystępnej cenie. Idealny do wokalu, podcastów i nagrań instrumentów w domowym studiu.',
      specs: [
        'Typ: pojemnościowy (kardioidalny), duża membrana',
        'Pasmo przenoszenia: 20 Hz – 20 kHz',
        'Czułość: ok. −37 dBV/Pa (14,1 mV)',
        'Impedancja wyjściowa: ~100 Ω',
        'Maks. SPL: ok. 144 dB (1% THD)',
        'Zasilanie: +48 V phantom',
        'Złącze: XLR 3‑pin',
      ],
    }
  }
  if (name.includes('dt 770') || name.includes('dt-770') || name.includes('dt770')) {
    return {
      long: 'beyerdynamic DT 770 Pro 80 Ω to zamknięte słuchawki referencyjne do zastosowań studyjnych i realizacyjnych, znane z świetnej izolacji oraz rozciągniętego pasma z kontrolowanym dołem.',
      specs: [
        'Konstrukcja: wokółuszne, zamknięte',
        'Impedancja: 80 Ω',
        'Pasmo przenoszenia: ok. 5 Hz – 35 kHz',
        'Czułość/Nomin. SPL: ~96 dB',
        'Przewód: stały, prosty 3 m; wtyk 3,5 mm + adapter 6,3 mm',
        'Masa: ~270 g (bez przewodu)',
      ],
    }
  }
  if ((name.includes('motu') && name.includes('m2')) || name === 'm2') {
    return {
      long: 'MOTU M2 to szybki interfejs 2×2 USB‑C z wysokiej klasy przetwornikami ESS Sabre i kolorowymi miernikami poziomu na panelu, zapewniający profesjonalne nagrania i monitoring o niskich opóźnieniach.',
      specs: [
        'Wejścia: 2 × combo XLR/TRS z +48 V',
        'Wyjścia: 2 × TRS (balansowane) + słuchawkowe',
        'Przetwarzanie: do 24‑bit / 192 kHz',
        'Wyświetlacze: kolorowe mierniki poziomu',
        'Łączność: USB‑C (bus‑powered), MIDI In/Out',
        'Funkcje: hardware direct monitoring, loopback',
      ],
    }
  }
  if (name.includes('audiobox usb 96') || name.includes('audiobox 96') || name.includes('presonus audiobox')) {
    return {
      long: 'PreSonus AudioBox USB 96 to kompaktowy interfejs 2×2 do nagrań wokali i instrumentów w jakości do 96 kHz. Solidna obudowa, zasilanie z USB i prosta obsługa czynią go świetnym wyborem do domowego studia.',
      specs: [
        'Wejścia: 2 × combo XLR/TRS z +48 V',
        'Wyjścia: para TRS (line out) + słuchawkowe',
        'Przetwarzanie: do 24‑bit / 96 kHz',
        'Łączność: USB, zasilanie z magistrali',
        'Dodatkowo: MIDI In/Out',
      ],
    }
  }
  if (name.includes('nt1 5') || name.includes('nt1 5th') || name.includes('nt1 (5th') || name.includes('nt1 5-gen') || (name.includes('rode') && name.includes('nt1'))) {
    return {
      long: 'RØDE NT1 5th Gen to nowoczesny, wielozłączowy mikrofon pojemnościowy z kardioidalną charakterystyką. Oferuje zarówno wyjście XLR, jak i USB‑C z dźwiękiem 32‑bit float, ekstremalnie niski poziom szumów własnych i wbudowane przetwarzanie DSP.',
      specs: [
        'Typ: pojemnościowy, kardioidalny',
        'Wyjścia: XLR + USB‑C (32‑bit float przez USB)',
        'Pasmo przenoszenia: 20 Hz – 20 kHz',
        'Szum własny: ~4 dBA',
        'Zasilanie: +48 V (XLR) / zasilanie przez USB',
        'Wbudowane DSP i oprogramowanie RØDE Connect',
      ],
    }
  }
  if (name.includes('e835')) {
    return {
      long: 'Sennheiser e835 to dynamiczny mikrofon wokalowy o kardioidalnej charakterystyce, oferujący wyrazistą górę i odporność na sprzężenia. Solidna konstrukcja sprawdza się na scenie i w mowie.',
      specs: [
        'Typ: dynamiczny, kardioidalny',
        'Pasmo przenoszenia: ~40 Hz – 16 kHz',
        'Czułość: ok. 2,7 mV/Pa (−51 dBV/Pa)',
        'Impedancja: ~350 Ω',
        'Złącze: XLR 3‑pin',
      ],
    }
  }
  if (name.includes('sm7b')) {
    return {
      long: 'Shure SM7B to profesjonalny mikrofon dynamiczny do lektorki, podcastów i wokalu. Ma doskonałe tłumienie dźwięków z otoczenia, wbudowaną osłonę przeciwpodmuchową i przełączane filtry (low‑cut i presence boost).',
      specs: [
        'Typ: dynamiczny, kardioidalny',
        'Pasmo przenoszenia: ~50 Hz – 20 kHz',
        'Przełączniki: low‑cut, presence boost',
        'Impedancja: ~150 Ω',
        'Złącze: XLR 3‑pin; wymaga przedwzmacniacza o wysokim wzmocnieniu',
        'Mocowanie jarzmowe w zestawie',
      ],
    }
  }
  if (name.includes('mdr-7506') || name.includes('mdr 7506') || name.includes('7506')) {
    return {
      long: 'Sony MDR‑7506 to lekkie, zamknięte słuchawki studyjne, cenione za czytelną średnicę i szczegółową górę. Popularne w broadcastingu i montażu wideo.',
      specs: [
        'Konstrukcja: wokółuszne, zamknięte',
        'Przetworniki: 40 mm',
        'Pasmo przenoszenia: ~10 Hz – 20 kHz',
        'Impedancja: 63 Ω',
        'Czułość: ~106 dB/mW',
        'Przewód: skręcany ~3 m; wtyk 3,5 mm + adapter 6,3 mm',
      ],
    }
  }
  if (name.includes('ur22c')) {
    return {
      long: 'Steinberg UR22C to interfejs 2×2 z przedwzmacniaczami D‑PRE, obsługą do 32‑bit/192 kHz i łącznością USB‑C. Oferuje stabilne sterowniki, monitorowanie bez opóźnień i wejścia/wyjścia MIDI.',
      specs: [
        'Wejścia: 2 × combo XLR/TRS z +48 V',
        'Wyjścia: 2 × TRS (balansowane) + słuchawkowe',
        'Przetwarzanie: do 32‑bit / 192 kHz',
        'Łączność: USB 3.0/USB‑C, MIDI In/Out',
        'Funkcje: dspMixFx, direct monitoring, loopback',
      ],
    }
  }
  if (name.includes('volt 2') || (name.includes('universal audio') && name.includes('volt'))) {
    return {
      long: 'Universal Audio Volt 2 to kompaktowy interfejs 2×2 z charakterystycznym trybem Vintage Mic Preamp, który dodaje lampowego charakteru nagraniom. Świetny do wokali, gitar i podcastów.',
      specs: [
        'Wejścia: 2 × combo XLR/TRS z +48 V',
        'Wyjścia: 2 × TRS (line out) + słuchawkowe',
        'Przetwarzanie: do 24‑bit / 192 kHz',
        'Tryb: Vintage Mic Preamp (UA)',
        'Łączność: USB‑C (bus‑powered), MIDI In/Out',
        'Funkcje: direct monitoring',
      ],
    }
  }
  return null
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
