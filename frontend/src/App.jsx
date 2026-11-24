import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [hotels, setHotels] = useState([])

useEffect(() => {
  supabase.from('hotels').select('*').then(({ data, error }) => {
    console.log('data:', data, 'error:', error)
    setHotels(data || [])
  })
}, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Hotel Blockchain</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {hotels.map((h) => (
          <div key={h.id} className="bg-white rounded-xl shadow overflow-hidden">
            <img src={h.image_url} alt={h.name} className="h-40 w-full object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-semibold">{h.name}</h2>
              <p className="text-gray-500">{h.city}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}