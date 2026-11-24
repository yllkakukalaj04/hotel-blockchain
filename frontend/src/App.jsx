import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from './supabase'

function Img({ src, alt, className }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center text-4xl`}>
        🏨
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
}

const Stars = ({ n }) => (
  <span className="text-amber-500">
    {'★'.repeat(n)}
    <span className="text-gray-300">{'★'.repeat(5 - n)}</span>
  </span>
)

const Chip = ({ children }) => (
  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{children}</span>
)

function Home() {
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('Të gjitha')
  const [minStars, setMinStars] = useState(0)
  const [maxPrice, setMaxPrice] = useState(150)

  useEffect(() => {
    supabase.from('hotels').select('*').order('id').then(({ data }) => setHotels(data || []))
    supabase.from('rooms').select('hotel_id, price').then(({ data }) => setRooms(data || []))
  }, [])

  const minPrice = useMemo(() => {
    const m = {}
    rooms.forEach((r) => {
      m[r.hotel_id] = Math.min(m[r.hotel_id] ?? Infinity, Number(r.price))
    })
    return m
  }, [rooms])

  const cities = ['Të gjitha', ...new Set(hotels.map((h) => h.city))]
  const filtered = hotels.filter(
    (h) =>
      (city === 'Të gjitha' || h.city === city) &&
      h.name.toLowerCase().includes(search.toLowerCase()) &&
      h.stars >= minStars &&
      (minPrice[h.id] ?? 0) <= maxPrice
  )

  return (
    <div>
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-8 md:p-12 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold">Gjej qëndrimin e përsosur në Kosovë</h2>
        <p className="mt-2 text-blue-100 max-w-xl">
          Shfleto hotele në gjithë vendin, zgjidh dhomën dhe rezervo në pak sekonda.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kërko hotel..."
          className="mt-6 w-full md:w-96 px-4 py-3 rounded-lg text-gray-900 bg-white outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              city === c ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Yje:</span>
          {[0, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setMinStars(n)}
              className={`px-3 py-1 rounded-full text-sm ${
                minStars === n ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {n === 0 ? 'Të gjitha' : `${n}★+`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm text-gray-600">
          Çmimi deri në <b className="text-blue-700">{maxPrice} €</b>
          <input
            type="range"
            min="30"
            max="150"
            step="5"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((h) => (
          <Link
            key={h.id}
            to={`/hotel/${h.id}`}
            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition"
          >
            <div className="relative">
              <Img src={h.image_url} alt={h.name} className="h-48 w-full object-cover" />
              <span className="absolute top-3 left-3 bg-white/90 text-sm px-3 py-1 rounded-full">
                📍 {h.city}
              </span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">{h.name}</h3>
                <Stars n={h.stars} />
              </div>
              <p className="text-gray-500 text-sm mt-1">{h.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(h.amenities || []).slice(0, 3).map((a) => (
                  <Chip key={a}>{a}</Chip>
                ))}
              </div>
              <p className="mt-4 text-right">
                <span className="text-gray-500 text-sm">nga </span>
                <span className="text-xl font-bold text-blue-700">{minPrice[h.id] ?? '-'} €</span>
                <span className="text-gray-500 text-sm"> / natë</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-500">S'u gjet asnjë hotel.</p>}

      <div className="mt-14">
        <h3 className="text-2xl font-bold mb-4">Destinacione</h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {cities
            .filter((c) => c !== 'Të gjitha')
            .map((c) => {
              const inCity = hotels.filter((h) => h.city === c)
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCity(c)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="relative rounded-2xl overflow-hidden h-32 text-left group"
                >
                  <Img src={inCity[0]?.image_url} alt={c} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3 text-white">
                    <p className="font-semibold">{c}</p>
                    <p className="text-xs">{inCity.length} {inCity.length === 1 ? 'hotel' : 'hotele'}</p>
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      <div className="mt-14 mb-4">
        <h3 className="text-2xl font-bold mb-4">Pse Konak?</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['🔒', 'Rezervim i sigurt', 'Çdo rezervim merr një numër unik dhe QR code që verifikohet në recepsion.'],
            ['🚫', 'Pa rezervime të dyfishta', 'Një dhomë nuk mund të rezervohet dy herë për të njëjtën datë.'],
            ['💶', 'Pagesa në hotel', 'Rezervo pa pagesë online dhe paguaj kur të arrish në recepsion.'],
          ].map(([icon, t, d]) => (
            <div key={t} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl">{icon}</div>
              <p className="font-semibold mt-3">{t}</p>
              <p className="text-gray-600 text-sm mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Rooms() {
  const { id } = useParams()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [date, setDate] = useState(today)
  const [taken, setTaken] = useState([])
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('hotels').select('*').eq('id', id).single().then(({ data }) => setHotel(data))
    supabase.from('rooms').select('*').eq('hotel_id', id).order('price').then(({ data }) => setRooms(data || []))
  }, [id])

  function loadTaken() {
    supabase
      .from('bookings')
      .select('room_id')
      .eq('hotel_id', id)
      .eq('check_in', date)
      .then(({ data }) => setTaken((data || []).map((b) => b.room_id)))
  }

  useEffect(() => {
    loadTaken()
  }, [id, date])

  async function confirmBooking() {
    if (!name.trim()) {
      setError('Shkruaj emrin tënd.')
      return
    }
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('bookings')
      .insert({ room_id: selected.id, hotel_id: Number(id), guest_name: name.trim(), check_in: date })
      .select()
      .single()
    setLoading(false)
    if (error) {
      setError(
        error.code === '23505'
          ? 'Kjo dhomë sapo u rezervua për këtë datë. Zgjidh një tjetër.'
          : 'Gabim: ' + error.message
      )
      loadTaken()
      return
    }
    try {
      const saved = JSON.parse(localStorage.getItem('myBookings') || '[]')
      localStorage.setItem('myBookings', JSON.stringify([...saved, data.id]))
    } catch {}
    navigate(`/booking/${data.id}`)
  }

  if (!hotel) return <p>Duke u ngarkuar...</p>

  return (
    <div>
      <Link to="/" className="text-blue-700 font-medium">← Kthehu te hotelet</Link>

      <div className="relative mt-4 rounded-2xl overflow-hidden">
        <Img src={hotel.image_url} alt={hotel.name} className="h-64 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
          <div className="text-white">
            <h2 className="text-3xl font-bold">{hotel.name}</h2>
            <p>📍 {hotel.city} · <Stars n={hotel.stars} /></p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-gray-700">{hotel.description}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {(hotel.amenities || []).map((a) => <Chip key={a}>{a}</Chip>)}
      </div>

      <div className="mt-8 mb-4 flex flex-wrap items-center gap-4">
        <h3 className="text-xl font-bold">Dhomat</h3>
        <label className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
          <span className="text-sm text-gray-600">Data e check-in:</span>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="outline-none bg-transparent"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rooms.map((r) => {
          const isTaken = taken.includes(r.id)
          return (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
              <Img src={r.image_url} alt="" className="h-40 sm:h-auto sm:w-44 object-cover" />
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <p className="text-lg font-semibold">Dhoma {r.room_number} · {r.type}</p>
                  <p className="text-gray-500 text-sm">{r.description}</p>
                  <p className="text-sm mt-1">👤 {r.capacity} {r.capacity === 1 ? 'person' : 'persona'}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p>
                    <span className="text-xl font-bold text-blue-700">{r.price} €</span>{' '}
                    <span className="text-gray-500 text-sm">/ natë</span>
                  </p>
                  {isTaken ? (
                    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
                      E zënë
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelected(r)
                        setError('')
                      }}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition"
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold">Konfirmo rezervimin</h3>
            <p className="text-gray-600 mt-2">
              {hotel.name} · Dhoma {selected.room_number} ({selected.type})
              <br />
              Data: <b>{date}</b> · {selected.price} € / natë
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emri dhe mbiemri"
              className="mt-4 w-full border rounded-lg px-4 py-3 outline-none focus:border-blue-600"
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg bg-gray-200">
                Anulo
              </button>
              <button
                onClick={confirmBooking}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white disabled:opacity-50"
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

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-8 text-center">
      <p className="text-green-600 font-semibold">✅ Rezervimi u konfirmua</p>
      <h2 className="text-2xl font-bold mt-2">Token #{b.id}</h2>
      <div className="flex justify-center my-6">
        <QRCodeSVG value={link} size={200} />
      </div>
      <p className="text-sm text-gray-500 mb-4">Paraqite këtë QR code në recepsion</p>
      <div className="text-left bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
        <p><b>Hoteli:</b> {b.hotels?.name}, {b.hotels?.city}</p>
        <p><b>Dhoma:</b> {b.rooms?.room_number} ({b.rooms?.type})</p>
        <p><b>Data:</b> {b.check_in}</p>
        <p><b>Klienti:</b> {b.guest_name}</p>
        <p><b>Çmimi:</b> {b.rooms?.price} € / natë (pagesa në recepsion)</p>
      </div>
      <Link to="/" className="inline-block mt-6 text-blue-700 font-medium">← Faqja kryesore</Link>
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
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-8">
      <h2 className="text-2xl font-bold">Recepsioni</h2>
      <p className="text-gray-500 text-sm mt-1">Fut numrin e tokenit ose skano QR code-in.</p>
      <div className="flex gap-2 mt-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="p.sh. 1"
          className="flex-1 border rounded-lg px-4 py-3 outline-none focus:border-blue-600"
        />
        <button onClick={() => verify(code)} className="bg-blue-700 text-white px-5 rounded-lg">
          Verifiko
        </button>
      </div>

      {result && result.valid && (
        <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-2xl font-bold text-green-700">✅ VALID</p>
          <p className="text-sm mt-2"><b>Klienti:</b> {result.b.guest_name}</p>
          <p className="text-sm"><b>Hoteli:</b> {result.b.hotels?.name}, {result.b.hotels?.city}</p>
          <p className="text-sm"><b>Dhoma:</b> {result.b.rooms?.room_number} ({result.b.rooms?.type})</p>
          <p className="text-sm"><b>Data:</b> {result.b.check_in}</p>
        </div>
      )}
      {result && !result.valid && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-2xl font-bold text-red-700">❌ JO VALID</p>
          <p className="text-sm mt-1">Ky rezervim nuk ekziston.</p>
        </div>
      )}
    </div>
  )
}

function MyBookings() {
  const [list, setList] = useState(null)

  useEffect(() => {
    let ids = []
    try {
      ids = JSON.parse(localStorage.getItem('myBookings') || '[]')
    } catch {}
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
        <p className="text-gray-500">
          Nuk ke asnjë rezervim ende. <Link to="/" className="text-blue-700">Gjej një hotel</Link>
        </p>
      )}
      <div className="space-y-4">
        {list.map((b) => (
          <Link
            key={b.id}
            to={`/booking/${b.id}`}
            className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{b.hotels?.name}, {b.hotels?.city}</p>
                <p className="text-sm text-gray-600">
                  Dhoma {b.rooms?.room_number} ({b.rooms?.type}) · {b.check_in}
                </p>
                <p className="text-sm text-gray-500">Klienti: {b.guest_name}</p>
              </div>
              <span className="text-blue-700 font-medium">Token #{b.id} →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-700">🏨 Konak</Link>
          <div className="flex gap-6">
            <Link to="/my-bookings" className="text-sm font-medium text-gray-700 hover:text-blue-700">
              Rezervimet e mia
            </Link>
            <Link to="/reception" className="text-sm font-medium text-gray-700 hover:text-blue-700">
              Recepsioni
            </Link>
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
      <footer className="text-center text-sm text-gray-500 py-6">
        Projekt kursi · React + Supabase + Ethereum
      </footer>
    </div>
  )
}