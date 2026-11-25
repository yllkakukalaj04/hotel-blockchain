import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from './supabase'

const THEMES = [
  ['light', 'Dritë', '#1d4ed8'],
  ['dark', 'Natë', '#0f172a'],
  ['ocean', 'Oqean', '#0891b2'],
  ['forest', 'Pyll', '#047857'],
]

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function Img({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <div className={`${className} bg-gradient-to-br from-brand-soft to-line flex items-center justify-center text-4xl`}>
        🏨
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
}

const Stars = ({ n }) => (
  <span className="text-amber-500">
    {'★'.repeat(n)}
    <span className="text-muted opacity-40">{'★'.repeat(5 - n)}</span>
  </span>
)

const ICONS = {
  WiFi: '📶',
  Mëngjes: '🍳',
  Parking: '🅿️',
  Spa: '💆',
  Restorant: '🍽️',
  Terrasë: '🌇',
  Kuzhinë: '👨‍🍳',
  Oxhak: '🔥',
  Sallë: '🏛️',
  Pishinë: '🏊',
  Fitnes: '🏋️',
  Bar: '🍸',
  Klimë: '❄️',
}

const Chip = ({ children }) => (
  <span className="text-xs bg-brand-soft text-brand px-2 py-1 rounded-full">
    {ICONS[children] || '✔️'} {children}
  </span>
)
function ThemeMenu() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-medium bg-brand-soft text-brand px-3 py-2 rounded-lg"
      >
        🎨 Fonti
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-card border border-line rounded-xl shadow-lg p-2 z-50">
            {THEMES.map(([key, label, color]) => (
              <button
                key={key}
                onClick={() => {
                  setTheme(key)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-brand-soft ${
                  theme === key ? 'font-bold text-brand' : 'text-ink'
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-line" style={{ background: color }} />
                {label}
                {theme === key && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Home() {
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('Të gjitha')
  const [minStars, setMinStars] = useState(0)
  const [maxPrice, setMaxPrice] = useState(300)
  const [sort, setSort] = useState('default')
  const [favs, setFavs] = useState(() => readList('favHotels'))
  const [onlyFavs, setOnlyFavs] = useState(false)

  useEffect(() => {
    supabase.from('hotels').select('*').order('id').then(({ data }) => setHotels(data || []))
    supabase.from('rooms').select('hotel_id, price').then(({ data }) => setRooms(data || []))
  }, [])

  function toggleFav(e, id) {
    e.preventDefault()
    e.stopPropagation()
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]
    setFavs(next)
    try {
      localStorage.setItem('favHotels', JSON.stringify(next))
    } catch {}
  }

  const minPrice = useMemo(() => {
    const m = {}
    rooms.forEach((r) => {
      m[r.hotel_id] = Math.min(m[r.hotel_id] ?? Infinity, Number(r.price))
    })
    return m
  }, [rooms])

  const cities = ['Të gjitha', ...new Set(hotels.map((h) => h.city))]

  const filtered = hotels
    .filter(
      (h) =>
        (city === 'Të gjitha' || h.city === city) &&
        h.name.toLowerCase().includes(search.toLowerCase()) &&
        h.stars >= minStars &&
        (minPrice[h.id] ?? 0) <= maxPrice &&
        (!onlyFavs || favs.includes(h.id))
    )
    .sort((a, b) => {
      if (sort === 'price') return (minPrice[a.id] ?? 0) - (minPrice[b.id] ?? 0)
      if (sort === 'stars') return b.stars - a.stars
      return a.id - b.id
    })

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-2" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, white 0, transparent 40%), radial-gradient(circle at 85% 85%, white 0, transparent 35%)',
          }}
        />
        <div className="relative px-6 py-12 md:px-14 md:py-20 text-white">
          <p className="uppercase tracking-widest text-xs text-white/70">Hotele në Kosovë</p>
          <h2 className="text-3xl md:text-5xl font-bold mt-2 max-w-2xl">
            Gjej qëndrimin e përsosur për udhëtimin tënd
          </h2>
          <p className="mt-3 text-white/80 max-w-xl">
            Krahaso hotele në gjithë vendin, zgjidh datat dhe rezervo në pak sekonda.
          </p>

          <div className="mt-8 bg-card text-ink rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-3xl shadow-xl">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Kërko hotel..."
              className="flex-1 px-4 py-3 rounded-xl bg-transparent outline-none"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-4 py-3 rounded-xl bg-brand-soft text-ink outline-none"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'Të gjitha' ? '📍 Të gjitha qytetet' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Yje:</span>
          {[0, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMinStars(n)}
              className={`px-3 py-1 rounded-full text-sm ${
                minStars === n ? 'bg-amber-500 text-white' : 'bg-brand-soft text-ink'
              }`}
            >
              {n === 0 ? 'Të gjitha' : `${n}★+`}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 text-sm text-muted">
          Çmimi deri në <b className="text-brand">{maxPrice} €</b>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 rounded-lg bg-brand-soft text-ink text-sm outline-none"
        >
          <option value="default">Renditja: Standarde</option>
          <option value="price">Çmimi: ma i ulëti</option>
          <option value="stars">Yjet: ma të lartat</option>
        </select>

        <button
          onClick={() => setOnlyFavs(!onlyFavs)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            onlyFavs ? 'bg-rose-500 text-white' : 'bg-brand-soft text-ink'
          }`}
        >
          ❤️ Të preferuarat ({favs.length})
        </button>
      </div>

      <p className="text-sm text-muted mb-4">
        {filtered.length} {filtered.length === 1 ? 'hotel u gjet' : 'hotele u gjetën'}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((h) => (
          <Link
            key={h.id}
            to={`/hotel/${h.id}`}
            className="bg-card rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition"
          >
            <div className="relative">
              <Img src={h.image_url} alt={h.name} className="h-48 w-full object-cover" />
              <span className="absolute top-3 left-3 bg-card/90 text-ink text-sm px-3 py-1 rounded-full">
                📍 {h.city}
              </span>
              <button
                onClick={(e) => toggleFav(e, h.id)}
                className="absolute top-3 right-3 bg-card/90 w-9 h-9 rounded-full text-lg"
                aria-label="Preferuar"
              >
                {favs.includes(h.id) ? '❤️' : '🤍'}
              </button>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{h.name}</h3>
                <Stars n={h.stars} />
              </div>
              <p className="text-muted text-sm mt-1">{h.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(h.amenities || []).slice(0, 3).map((a) => (
                  <Chip key={a}>{a}</Chip>
                ))}
              </div>
              <p className="mt-4 text-right">
                <span className="text-muted text-sm">nga </span>
                <span className="text-xl font-bold text-brand">{minPrice[h.id] ?? '-'} €</span>
                <span className="text-muted text-sm"> / natë</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-muted">S'u gjet asnjë hotel.</p>}

      <div className="mt-14">
        <h3 className="text-2xl font-bold mb-4">Pse Konak?</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['🔒', 'Rezervim i sigurt', 'Çdo rezervim merr një numër unik dhe QR code që verifikohet në recepsion.'],
            ['🚫', 'Pa rezervime të dyfishta', 'Një dhomë nuk mund të rezervohet dy herë për të njëjtat data.'],
            ['💶', 'Pagesa në hotel', 'Rezervo pa pagesë online dhe paguaj kur të arrish në recepsion.'],
          ].map(([icon, t, d]) => (
            <div key={t} className="bg-card rounded-xl p-6 shadow-sm">
              <div className="text-3xl">{icon}</div>
              <p className="font-semibold mt-3">{t}</p>
              <p className="text-muted text-sm mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 mb-4 max-w-3xl">
        <h3 className="text-2xl font-bold mb-4">Pyetje të shpeshta</h3>
        <div className="space-y-3">
          {[
            ['Si rezervoj një dhomë?', 'Zgjidh hotelin, datat dhe dhomën, shkruaj emrin dhe konfirmo. Menjëherë merr një QR code.'],
            ['A paguaj online?', 'Jo. Rezervimi është pa pagesë online, pagesa bëhet në recepsion kur arrin.'],
            ['Çfarë paraqes në recepsion?', 'QR code-in ose numrin e tokenit. Recepsionisti e verifikon dhe sheh nëse është VALID.'],
          ].map(([q, a]) => (
            <details key={q} className="bg-card rounded-xl shadow-sm p-4">
              <summary className="font-medium cursor-pointer">{q}</summary>
              <p className="text-muted text-sm mt-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
function addDays(str, n) {
  const d = new Date(str + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}

function nightsBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
}

function Rooms() {
  const { id } = useParams()
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('sv-SE')

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(addDays(today, 1))
  const [taken, setTaken] = useState([])
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const nights = nightsBetween(checkIn, checkOut)

  useEffect(() => {
    supabase.from('hotels').select('*').eq('id', id).single().then(({ data }) => setHotel(data))
    supabase.from('rooms').select('*').eq('hotel_id', id).order('price').then(({ data }) => setRooms(data || []))
  }, [id])

  function loadTaken() {
    if (nights < 1) return
    supabase
      .from('bookings')
      .select('room_id')
      .eq('hotel_id', id)
      .lt('check_in', checkOut)
      .gt('check_out', checkIn)
      .then(({ data }) => setTaken((data || []).map((b) => b.room_id)))
  }

  useEffect(() => {
    loadTaken()
  }, [id, checkIn, checkOut])

  async function confirmBooking() {
    if (!name.trim()) {
      setError('Shkruaj emrin tënd.')
      return
    }
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        room_id: selected.id,
        hotel_id: Number(id),
        guest_name: name.trim(),
        check_in: checkIn,
        check_out: checkOut,
        total_price: nights * Number(selected.price),
      })
      .select()
      .single()
    setLoading(false)
    if (error) {
      setError(
        error.code === '23P01'
          ? 'Kjo dhomë është e zënë për një pjesë të këtyre datave. Zgjidh data ose dhomë tjetër.'
          : 'Gabim: ' + error.message
      )
      loadTaken()
      return
    }
    try {
      localStorage.setItem('myBookings', JSON.stringify([...readList('myBookings'), data.id]))
    } catch {}
    navigate(`/booking/${data.id}`)
  }

  if (!hotel) return <p>Duke u ngarkuar...</p>

  return (
    <div>
      <Link to="/" className="text-brand font-medium">← Kthehu te hotelet</Link>

      <div className="relative mt-4 rounded-2xl overflow-hidden">
        <Img src={hotel.image_url} alt={hotel.name} className="h-64 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
          <div className="text-white">
            <h2 className="text-3xl font-bold">{hotel.name}</h2>
            <p>📍 {hotel.city} · <Stars n={hotel.stars} /></p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-muted">{hotel.description}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {(hotel.amenities || []).map((a) => <Chip key={a}>{a}</Chip>)}
      </div>

      <div className="mt-8 mb-4 flex flex-wrap items-center gap-4">
        <h3 className="text-xl font-bold">Dhomat</h3>
        <label className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-sm">
          <span className="text-sm text-muted">Nga:</span>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value)
              if (checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1))
            }}
            className="outline-none bg-transparent"
          />
        </label>
        <label className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-sm">
          <span className="text-sm text-muted">Deri:</span>
          <input
            type="date"
            min={addDays(checkIn, 1)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="outline-none bg-transparent"
          />
        </label>
        <span className="text-sm font-medium text-brand">
          {nights} {nights === 1 ? 'natë' : 'netë'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((r) => {
          const isTaken = taken.includes(r.id)
          return (
            <div key={r.id} className="bg-card rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
              <Img src={r.image_url} alt="" className="h-40 sm:h-auto sm:w-44 object-cover" />
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <p className="text-lg font-semibold">Dhoma {r.room_number} · {r.type}</p>
                  <p className="text-muted text-sm">{r.description}</p>
                  <p className="text-sm mt-1">👤 {r.capacity} {r.capacity === 1 ? 'person' : 'persona'}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xl font-bold text-brand">
                      {nights * Number(r.price)} €
                    </p>
                    <p className="text-muted text-xs">
                      {r.price} € × {nights} {nights === 1 ? 'natë' : 'netë'}
                    </p>
                  </div>
                  {isTaken ? (
                    <span className="bg-red-500/15 text-red-500 px-4 py-2 rounded-lg text-sm font-medium">
                      E zënë
                    </span>
                  ) : (
                    <button
                      disabled={nights < 1}
                      onClick={() => {
                        setSelected(r)
                        setError('')
                      }}
                      className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Rezervo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold">Konfirmo rezervimin</h3>
            <div className="text-muted mt-2 text-sm space-y-1">
              <p>{hotel.name} · Dhoma {selected.room_number} ({selected.type})</p>
              <p>
                <b className="text-ink">{checkIn}</b> → <b className="text-ink">{checkOut}</b> ({nights}{' '}
                {nights === 1 ? 'natë' : 'netë'})
              </p>
              <p>
                {selected.price} € × {nights} = <b className="text-brand text-base">{nights * Number(selected.price)} €</b>
              </p>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emri dhe mbiemri"
              className="mt-4 w-full border border-line bg-card text-ink rounded-lg px-4 py-3 outline-none focus:border-brand"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg bg-line text-ink">
                Anulo
              </button>
              <button
                onClick={confirmBooking}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-brand text-white disabled:opacity-50"
              >
                {loading ? 'Duke rezervuar...' : 'Konfirmo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Booking() {
  const { id } = useParams()
  const [b, setB] = useState(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    supabase
      .from('bookings')
      .select('*, rooms(room_number, type, price), hotels(name, city)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => (error ? setMissing(true) : setB(data)))
  }, [id])

  if (missing) return <p>Rezervimi nuk u gjet.</p>
  if (!b) return <p>Duke u ngarkuar...</p>

  const link = `${window.location.origin}/reception?code=${b.id}`
  const n = nightsBetween(b.check_in, b.check_out)

  return (
    <div className="max-w-md mx-auto bg-card rounded-2xl shadow p-8 text-center">
      <p className="text-green-500 font-semibold">✅ Rezervimi u konfirmua</p>
      <h2 className="text-2xl font-bold mt-2">Token #{b.id}</h2>
      <div className="flex justify-center my-6">
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={link} size={200} />
        </div>
      </div>
      <p className="text-sm text-muted mb-4">Paraqite këtë QR code në recepsion</p>
      <div className="text-left bg-page rounded-xl p-4 space-y-1 text-sm">
        <p><b>Hoteli:</b> {b.hotels?.name}, {b.hotels?.city}</p>
        <p><b>Dhoma:</b> {b.rooms?.room_number} ({b.rooms?.type})</p>
        <p><b>Data:</b> {b.check_in} → {b.check_out} ({n} {n === 1 ? 'natë' : 'netë'})</p>
        <p><b>Klienti:</b> {b.guest_name}</p>
        <p><b>Totali:</b> {b.total_price} € (pagesa në recepsion)</p>
      </div>
      <Link to="/" className="inline-block mt-6 text-brand font-medium">← Faqja kryesore</Link>
    </div>
  )
}

function Reception() {
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('code') || '')
  const [result, setResult] = useState(null)

  async function verify(c) {
    const n = Number(c)
    if (!n) {
      setResult({ valid: false })
      return
    }
    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(room_number, type), hotels(name, city)')
      .eq('id', n)
      .maybeSingle()
    setResult(data ? { valid: true, b: data } : { valid: false })
  }

  useEffect(() => {
    if (params.get('code')) verify(params.get('code'))
  }, [])

  return (
    <div className="max-w-md mx-auto bg-card rounded-2xl shadow p-8">
      <h2 className="text-2xl font-bold">Recepsioni</h2>
      <p className="text-muted text-sm mt-1">Fut numrin e tokenit ose skano QR code-in.</p>
      <div className="flex gap-2 mt-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="p.sh. 1"
          className="flex-1 border border-line bg-card text-ink rounded-lg px-4 py-3 outline-none focus:border-brand"
        />
        <button onClick={() => verify(code)} className="bg-brand text-white px-5 rounded-lg">
          Verifiko
        </button>
      </div>

      {result && result.valid && (
        <div className="mt-6 rounded-xl bg-green-500/10 border border-green-500/30 p-4">
          <p className="text-2xl font-bold text-green-500">✅ VALID</p>
          <p className="text-sm mt-2"><b>Klienti:</b> {result.b.guest_name}</p>
          <p className="text-sm"><b>Hoteli:</b> {result.b.hotels?.name}, {result.b.hotels?.city}</p>
          <p className="text-sm"><b>Dhoma:</b> {result.b.rooms?.room_number} ({result.b.rooms?.type})</p>
          <p className="text-sm"><b>Data:</b> {result.b.check_in} → {result.b.check_out}</p>
        </div>
      )}
      {result && !result.valid && (
        <div className="mt-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <p className="text-2xl font-bold text-red-500">❌ JO VALID</p>
          <p className="text-sm mt-1">Ky rezervim nuk ekziston.</p>
        </div>
      )}
    </div>
  )
}

function MyBookings() {
  const [list, setList] = useState(null)

  useEffect(() => {
    const ids = readList('myBookings')
    if (ids.length === 0) {
      setList([])
      return
    }
    supabase
      .from('bookings')
      .select('*, rooms(room_number, type, price), hotels(name, city)')
      .in('id', ids)
      .order('check_in')
      .then(({ data }) => setList(data || []))
  }, [])

  if (!list) return <p>Duke u ngarkuar...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Rezervimet e mia</h2>
      {list.length === 0 && (
        <p className="text-muted">
          Nuk ke asnjë rezervim ende. <Link to="/" className="text-brand">Gjej një hotel</Link>
        </p>
      )}
      <div className="space-y-4">
        {list.map((b) => (
          <Link
            key={b.id}
            to={`/booking/${b.id}`}
            className="block bg-card rounded-xl shadow-sm p-5 hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{b.hotels?.name}, {b.hotels?.city}</p>
                <p className="text-sm text-muted">
                  Dhoma {b.rooms?.room_number} ({b.rooms?.type}) · {b.check_in} → {b.check_out}
                </p>
                <p className="text-sm text-muted">Klienti: {b.guest_name}</p>
              </div>
              <span className="text-brand font-medium">Token #{b.id} →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-brand">🏨 Konak</Link>
          <div className="flex items-center gap-5">
            <Link to="/my-bookings" className="text-sm font-medium hover:text-brand">
              Rezervimet e mia
            </Link>
            <Link to="/reception" className="text-sm font-medium hover:text-brand">
              Recepsioni
            </Link>
            <ThemeMenu />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotel/:id" element={<Rooms />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/reception" element={<Reception />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </main>
      <footer className="text-center text-sm text-muted py-6">
        Projekt kursi · React + Supabase + Ethereum
      </footer>
    </div>
  )
}