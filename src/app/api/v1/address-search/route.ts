export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

interface AddressResult {
  name: string
  display_name: string
  lat: number
  lon: number
}

// Pre-indexed Vadodara local landmarks, malls, societies, and areas for instant 0ms responses
const VADODARA_DICTIONARY = [
  { name: 'Eva Mall', area: 'Vishwamitri Road, Manjalpur, Vadodara', lat: 22.2735572, lon: 73.1881068, keywords: ['eva', 'eva mall', 'evamall', 'eva mall manjalpur'] },
  { name: 'Shivam Society / Park', area: 'Manjalpur, Vadodara', lat: 22.2750, lon: 73.1850, keywords: ['shivam', 'shivam soc', 'shivam society', 'shivam park', 'shivam tenaments', 'shivam socur'] },
  { name: 'Amrutnagar / Alwa Naka', area: 'GIDC Road, Manjalpur, Vadodara', lat: 22.2720, lon: 73.1900, keywords: ['amrutnagar', 'amrut nagar', 'alwanaka', 'alwa naka', 'gidc road'] },
  { name: 'Inorbit Mall', area: 'Gorwa Road, Subhanpura, Vadodara', lat: 22.3210, lon: 73.1650, keywords: ['inorbit', 'inorbit mall', 'gorwa'] },
  { name: 'Center Square Mall', area: 'Alkapuri, Vadodara', lat: 22.3110, lon: 73.1700, keywords: ['center square', 'centre square', 'alkapuri mall'] },
  { name: 'Vadodara Central Mall', area: 'Sarabhai Campus, Alkapuri, Vadodara', lat: 22.3120, lon: 73.1720, keywords: ['central mall', 'vadodara central'] },
  { name: 'Uma Char Rasta Branch', area: 'Waghodia Road, Vadodara', lat: 22.3168, lon: 73.1593, keywords: ['uma', 'uma char rasta', 'waghodia road'] },
  { name: 'Khanderao Market Branch', area: 'Rajmahal Road, Vadodara', lat: 22.2982, lon: 73.1931, keywords: ['khanderao', 'khanderao market', 'market'] },
  { name: 'Ellora Park Branch', area: 'Ellora Park, Vadodara', lat: 22.3188, lon: 73.1613, keywords: ['ellora', 'ellora park', 'ellorapark'] },
  { name: 'Factory Warashiya Branch', area: 'Warashiya, Vadodara', lat: 22.3218, lon: 73.2100, keywords: ['warashiya', 'varasiya', 'factory warashiya'] },
  { name: 'Alkapuri', area: 'Vadodara', lat: 22.3100, lon: 73.1700, keywords: ['alkapuri'] },
  { name: 'Manjalpur', area: 'Vadodara', lat: 22.2700, lon: 73.1800, keywords: ['manjalpur'] },
  { name: 'Gotri', area: 'Vadodara', lat: 22.3200, lon: 73.1400, keywords: ['gotri', 'gotri road'] },
  { name: 'Karelibaug', area: 'Vadodara', lat: 22.3250, lon: 73.1950, keywords: ['karelibaug', 'kareli baug', 'karelibag'] },
  { name: 'Akota', area: 'Vadodara', lat: 22.2950, lon: 73.1750, keywords: ['akota', 'akota stadium'] },
  { name: 'Subhanpura', area: 'Vadodara', lat: 22.3200, lon: 73.1600, keywords: ['subhanpura', 'subhan pura'] },
  { name: 'VIP Road', area: 'Karelibaug, Vadodara', lat: 22.3300, lon: 73.2000, keywords: ['vip road', 'vip'] },
  { name: 'Fatehgunj', area: 'Vadodara', lat: 22.3250, lon: 73.1850, keywords: ['fatehgunj', 'fatehganj', 'msu'] },
  { name: 'Atladara', area: 'Vadodara', lat: 22.2600, lon: 73.1500, keywords: ['atladara', 'sun pharma road'] },
  { name: 'Bhayli', area: 'Vadodara', lat: 22.2800, lon: 73.1200, keywords: ['bhayli', 'bhayli station'] },
  { name: 'Vasna Road', area: 'Vadodara', lat: 22.2900, lon: 73.1400, keywords: ['vasna', 'vasna road', 'vasna bhayli'] },
  { name: 'Nizampura', area: 'Vadodara', lat: 22.3350, lon: 73.1800, keywords: ['nizampura', 'nizam pura'] },
  { name: 'Makarpura', area: 'Vadodara', lat: 22.2400, lon: 73.1900, keywords: ['makarpura', 'makarpura gidc'] },
  { name: 'Tarsali', area: 'Vadodara', lat: 22.2300, lon: 73.2000, keywords: ['tarsali', 'tarsali bypass'] },
  { name: 'Chhani', area: 'Vadodara', lat: 22.3600, lon: 73.1700, keywords: ['chhani', 'chhani jakatnaka'] },
  { name: 'Waghodia Road', area: 'Vadodara', lat: 22.3100, lon: 73.2200, keywords: ['waghodia', 'waghodia road', 'parul'] },
  { name: 'Sayajigunj', area: 'Vadodara', lat: 22.3100, lon: 73.1850, keywords: ['sayajigunj', 'sayajiganj', 'railway station'] },
  { name: 'Old Padra Road', area: 'Vadodara', lat: 22.2900, lon: 73.1600, keywords: ['op road', 'old padra road', 'oproad'] },
  { name: 'Raopura', area: 'Vadodara', lat: 22.3000, lon: 73.2000, keywords: ['raopura', 'tower'] },
  { name: 'Ajwa Road', area: 'Vadodara', lat: 22.3100, lon: 73.2300, keywords: ['ajwa road', 'ajwa'] },
]

async function fetchFromPhoton(query: string): Promise<AddressResult[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=22.3072&lon=73.1812&limit=8`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    if (!data || !Array.isArray(data.features)) return []
    
    return data.features.map((f: any) => {
      const p = f.properties
      const name = p.name || p.street || p.district || p.city || 'Location'
      const parts = [p.name, p.street, p.district || p.city, 'Vadodara'].filter(Boolean)
      return {
        name,
        display_name: Array.from(new Set(parts)).join(', '),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      }
    })
  } catch (e) {
    return []
  }
}

async function fetchFromNominatim(query: string): Promise<AddressResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=8`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GopalCakeShop/1.0 (contact@gopalcakeshop.com)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 60 }
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((item: any) => ({
      name: item.name || (item.display_name ? item.display_name.split(',')[0] : 'Location'),
      display_name: item.display_name || '',
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))
  } catch (e) {
    return []
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawQuery = searchParams.get('q') || ''
    const query = rawQuery.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const cleanQ = query.toLowerCase()
    const results: AddressResult[] = []

    // 1. Search local Vadodara Dictionary first (Instant 0ms match)
    const dictMatches = VADODARA_DICTIONARY.filter(item =>
      item.keywords.some(k => k.includes(cleanQ) || cleanQ.includes(k)) ||
      item.name.toLowerCase().includes(cleanQ) ||
      item.area.toLowerCase().includes(cleanQ)
    )

    dictMatches.forEach(item => {
      results.push({
        name: item.name,
        display_name: `${item.name}, ${item.area}`,
        lat: item.lat,
        lon: item.lon,
      })
    })

    // 2. Query Photon API (Elasticsearch OpenStreetMap with Vadodara bias)
    const photonResults = await fetchFromPhoton(`${query} Vadodara`)
    photonResults.forEach(item => results.push(item))

    // 3. Query Nominatim API with Vadodara suffix if needed
    if (results.length < 3) {
      const queryWithCity = cleanQ.includes("vadodara") || cleanQ.includes("anand") 
        ? query 
        : `${query}, Vadodara`
      const nomResults = await fetchFromNominatim(queryWithCity)
      nomResults.forEach(item => results.push(item))
    }

    // 4. Token Breakdown Fallback (e.g. for 'shivam socur' -> search 'shivam Vadodara')
    if (results.length < 2) {
      const ignoreWords = ['society', 'soc', 'socur', 'road', 'street', 'nagar', 'flat', 'house', 'block', 'opp', 'near', 'gidc', 'vadodara', 'gujarat', 'india', 'flats', 'tenament', 'tenements']
      const words = query.split(/[\s,.-]+/).filter(w => w.length >= 3 && !ignoreWords.includes(w.toLowerCase()))
      
      for (const word of words) {
        const tokenRes = await fetchFromPhoton(`${word} Vadodara`)
        tokenRes.forEach(item => results.push(item))
        if (results.length >= 3) break
      }
    }

    // Deduplicate by display_name
    const seen = new Set<string>()
    const uniqueResults = results.filter(r => {
      const key = r.display_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ results: uniqueResults.slice(0, 8) })
  } catch (error: any) {
    console.error('[AddressSearch] Route error:', error)
    return NextResponse.json({ results: [], error: error.message }, { status: 500 })
  }
}
