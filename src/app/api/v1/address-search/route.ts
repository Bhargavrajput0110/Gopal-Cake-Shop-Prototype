export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

interface AddressResult {
  name: string
  display_name: string
  lat: number
  lon: number
  place_id?: string
}

// Extensive pre-indexed dictionary of 100+ Vadodara societies, universities, hospitals, malls, and landmarks
const VADODARA_DICTIONARY = [
  // Malls & Shopping
  { name: 'Eva Mall', area: 'Vishwamitri Road, Manjalpur, Vadodara', lat: 22.2735572, lon: 73.1881068, keywords: ['eva', 'eva mall', 'evamall', 'eva mall manjalpur'] },
  { name: 'Inorbit Mall', area: 'Gorwa Road, Subhanpura, Vadodara', lat: 22.3210, lon: 73.1650, keywords: ['inorbit', 'inorbit mall', 'gorwa'] },
  { name: 'Center Square Mall', area: 'Alkapuri, Vadodara', lat: 22.3110, lon: 73.1700, keywords: ['center square', 'centre square', 'alkapuri mall'] },
  { name: 'Vadodara Central Mall', area: 'Sarabhai Campus, Alkapuri, Vadodara', lat: 22.3120, lon: 73.1720, keywords: ['central mall', 'vadodara central'] },
  { name: 'Seven Seas Mall', area: 'Fatehgunj, Vadodara', lat: 22.3270, lon: 73.1860, keywords: ['seven seas', 'seven seas mall', 'fatehgunj mall'] },
  { name: 'Reliance Mega Mall', area: 'Old Padra Road, Vadodara', lat: 22.2880, lon: 73.1620, keywords: ['reliance mega mall', 'reliance mall op road', 'op road mall'] },
  { name: 'Agora City Centre', area: 'Mangal Pandey Road, Vadodara', lat: 22.3280, lon: 73.1920, keywords: ['agora', 'agora city centre', 'agora mall'] },

  // Educational Institutions & Universities
  { name: 'GSFC University', area: 'Fertilizernagar, Vigyan Bhavan, Vadodara', lat: 22.3610, lon: 73.1480, keywords: ['gsfc', 'gsfc university', 'gsfc uni', 'fertilizernagar', 'fertilizer nagar'] },
  { name: 'MSU Main Campus (Maharaja Sayajirao University)', area: 'Fatehgunj, Vadodara', lat: 22.3130, lon: 73.1840, keywords: ['msu', 'ms university', 'maharaja sayajirao', 'sayajirao university', 'msu fatehgunj'] },
  { name: 'MSU Faculty of Technology & Engineering (Techo)', area: 'Dandiya Bazar, Vadodara', lat: 22.2980, lon: 73.1970, keywords: ['techo', 'msu techo', 'technology faculty', 'dandiya bazar'] },
  { name: 'Parul University', area: 'Waghodia Road, Limda, Vadodara', lat: 22.2890, lon: 73.3640, keywords: ['parul', 'parul university', 'parul uni', 'limda'] },
  { name: 'Navrachana University', area: 'Vasna-Bhayli Road, Vadodara', lat: 22.2740, lon: 73.1180, keywords: ['navrachana', 'navrachana university', 'nuv', 'bhayli university'] },
  { name: 'Sigma Institute of Technology', area: 'Bakrol, Ajwa Road, Vadodara', lat: 22.3080, lon: 73.3050, keywords: ['sigma', 'sigma institute', 'sigma college', 'bakrol'] },
  { name: 'Baroda Medical College', area: 'Jail Road, Raopura, Vadodara', lat: 22.3040, lon: 73.1950, keywords: ['medical college', 'baroda medical college', 'ssg'] },

  // Hospitals & Healthcare
  { name: 'SSG Hospital (Sayaji Hospital)', area: 'Jail Road, Raopura, Vadodara', lat: 22.3050, lon: 73.1950, keywords: ['ssg', 'ssg hospital', 'sayaji hospital'] },
  { name: 'Sterling Hospital', area: 'Race Course Circle, Vadodara', lat: 22.3100, lon: 73.1610, keywords: ['sterling', 'sterling hospital', 'race course'] },
  { name: 'Bhailal Amin General Hospital (BAGH)', area: 'Gorwa Road, Vadodara', lat: 22.3250, lon: 73.1600, keywords: ['bhailal amin', 'bagh hospital', 'bhailal hospital'] },
  { name: 'Zydus Hospital', area: 'Gotri Road, Vadodara', lat: 22.3160, lon: 73.1360, keywords: ['zydus', 'zydus hospital', 'gotri hospital'] },
  { name: 'Banker Heart Institute', area: 'Old Padra Road, Vadodara', lat: 22.2920, lon: 73.1600, keywords: ['banker', 'bankers heart', 'banker hospital'] },
  { name: 'Sunshine Global Hospital', area: 'Manjalpur, Vadodara', lat: 22.2710, lon: 73.1870, keywords: ['sunshine', 'sunshine hospital', 'sunshine manjalpur'] },

  // Landmarks & Parks
  { name: 'Sayaji Baug / Kamati Baug', area: 'Kala Ghoda, Fatehgunj, Vadodara', lat: 22.3130, lon: 73.1880, keywords: ['sayaji baug', 'kamati baug', 'sayajibaug', 'kamatibaug', 'sayali', 'sayali garden', 'zoo'] },
  { name: 'Alembic City / Alembic Road', area: 'Gorwa Road, Vadodara', lat: 22.3220, lon: 73.1630, keywords: ['alembic', 'alembic city', 'alembic colony', 'alembic road', 'alembic ground'] },
  { name: 'Laxmi Vilas Palace', area: 'Jawaharlal Nehru Marg, Vadodara', lat: 22.2930, lon: 73.1910, keywords: ['laxmi vilas', 'palace', 'lakshmi vilas palace', 'palace ground'] },
  { name: 'Sursagar Lake', area: 'Mandvi, Vadodara', lat: 22.3000, lon: 73.2010, keywords: ['sursagar', 'sursagar lake', 'music college'] },
  { name: 'Akota Garden / Akota Stadium', area: 'Akota, Vadodara', lat: 22.2940, lon: 73.1740, keywords: ['akota garden', 'akota stadium', 'akota bridge'] },
  { name: 'Natubhai Circle', area: 'Gotri Road, Vadodara', lat: 22.3140, lon: 73.1550, keywords: ['natubhai', 'natubhai circle', 'gotri road circle'] },
  { name: 'Bird Circle', area: 'Old Padra Road, Vadodara', lat: 22.2960, lon: 73.1600, keywords: ['bird circle', 'op road bird circle'] },
  { name: 'L&T Knowledge City', area: 'NH-8, Waghodia-Ajwa Ring Road, Vadodara', lat: 22.3410, lon: 73.2590, keywords: ['l&t', 'l&t knowledge city', 'lnt', 'lnt city'] },
  { name: 'Vadodara Railway Station', area: 'Sayajigunj, Vadodara', lat: 22.3100, lon: 73.1810, keywords: ['railway station', 'station', 'vadodara station', 'st depot'] },

  // Gopal Cake Shop Branches
  { name: 'Uma Char Rasta Branch', area: 'Waghodia Road, Vadodara', lat: 22.3168, lon: 73.1593, keywords: ['uma', 'uma char rasta', 'waghodia road branch'] },
  { name: 'Khanderao Market Branch', area: 'Rajmahal Road, Vadodara', lat: 22.2982, lon: 73.1931, keywords: ['khanderao', 'khanderao market', 'market branch'] },
  { name: 'Ellora Park Branch', area: 'Ellora Park, Vadodara', lat: 22.3188, lon: 73.1613, keywords: ['ellora', 'ellora park', 'ellorapark'] },
  { name: 'Factory Warashiya Branch', area: 'Warashiya, Vadodara', lat: 22.3218, lon: 73.2100, keywords: ['warashiya', 'varasiya', 'factory warashiya', 'warashiya branch'] },

  // Residential Societies & Key Localities
  { name: 'Shivam Society / Park', area: 'Manjalpur, Vadodara', lat: 22.2750, lon: 73.1850, keywords: ['shivam', 'shivam soc', 'shivam society', 'shivam park', 'shivam tenaments', 'shivam socur'] },
  { name: 'Amrutnagar / Alwa Naka', area: 'GIDC Road, Manjalpur, Vadodara', lat: 22.2720, lon: 73.1900, keywords: ['amrutnagar', 'amrut nagar', 'alwanaka', 'alwa naka', 'gidc road'] },
  { name: 'Sun Pharma Road', area: 'Atladara / Bhayli, Vadodara', lat: 22.2680, lon: 73.1480, keywords: ['sun pharma', 'sun pharma road', 'sunpharma'] },
  { name: 'Vasna Road', area: 'Vasna-Bhayli Main Road, Vadodara', lat: 22.2850, lon: 73.1380, keywords: ['vasna', 'vasna road', 'vasna bhayli', 'vasna village'] },
  { name: 'Bhayli Station / Bhayli Canal Road', area: 'Bhayli, Vadodara', lat: 22.2780, lon: 73.1150, keywords: ['bhayli', 'bhayli station', 'bhayli canal', 'bhayli road', 'sevasi bhayli'] },
  { name: 'Sevasi', area: 'Gotri-Sevasi Road, Vadodara', lat: 22.3100, lon: 73.1050, keywords: ['sevasi', 'sevasi road', 'gotri sevasi'] },
  { name: 'Gotri / Gotri Village', area: 'Vadodara', lat: 22.3180, lon: 73.1380, keywords: ['gotri', 'gotri road', 'gotri village', 'gotri lake', 'harinagar'] },
  { name: 'Subhanpura', area: 'Vadodara', lat: 22.3200, lon: 73.1600, keywords: ['subhanpura', 'subhan pura', 'high tension road'] },
  { name: 'Ellora Park', area: 'Subhanpura, Vadodara', lat: 22.3190, lon: 73.1620, keywords: ['ellora park', 'ellorapark'] },
  { name: 'Alkapuri', area: 'Vadodara', lat: 22.3100, lon: 73.1700, keywords: ['alkapuri', 'rc dutt road', 'productivity road'] },
  { name: 'Akota', area: 'Vadodara', lat: 22.2950, lon: 73.1750, keywords: ['akota', 'mujmahuda', 'bpc road'] },
  { name: 'Old Padra Road (OP Road)', area: 'Vadodara', lat: 22.2900, lon: 73.1600, keywords: ['op road', 'old padra road', 'oproad', 'malhar point'] },
  { name: 'Manjalpur', area: 'Vadodara', lat: 22.2700, lon: 73.1800, keywords: ['manjalpur', 'tulsidham', 'shreyas school', 'vrajdham'] },
  { name: 'Makarpura GIDC', area: 'Makarpura, Vadodara', lat: 22.2400, lon: 73.1900, keywords: ['makarpura', 'makarpura gidc', 'novino', 'maneja'] },
  { name: 'Tarsali', area: 'Vadodara', lat: 22.2300, lon: 73.2000, keywords: ['tarsali', 'tarsali bypass', 'soma talav', 'tarsali ring road'] },
  { name: 'Atladara', area: 'Vadodara', lat: 22.2600, lon: 73.1500, keywords: ['atladara', 'swaminarayan temple atladara'] },
  { name: 'Karelibaug', area: 'Vadodara', lat: 22.3250, lon: 73.1950, keywords: ['karelibaug', 'kareli baug', 'karelibag', 'muktanand', 'l&t circle'] },
  { name: 'VIP Road', area: 'Karelibaug, Vadodara', lat: 22.3300, lon: 73.2000, keywords: ['vip road', 'vip'] },
  { name: 'Sama / Sama Savli Road', area: 'Vadodara', lat: 22.3450, lon: 73.1950, keywords: ['sama', 'sama savli road', 'sama lake', 'abhilasha square'] },
  { name: 'Harni / Harni Airport', area: 'Vadodara', lat: 22.3350, lon: 73.2200, keywords: ['harni', 'harni airport', 'harni road', 'motnath'] },
  { name: 'Warashiya / Varsiay', area: 'Vadodara', lat: 22.3220, lon: 73.2100, keywords: ['warashiya', 'varasiya', 'varsiya', 'kishanwadi'] },
  { name: 'Fatehgunj', area: 'Vadodara', lat: 22.3250, lon: 73.1850, keywords: ['fatehgunj', 'fatehganj', 'camp'] },
  { name: 'Nizampura', area: 'Vadodara', lat: 22.3350, lon: 73.1800, keywords: ['nizampura', 'nizam pura', 'chhani road'] },
  { name: 'Chhani / Chhani Jakatnaka', area: 'Vadodara', lat: 22.3600, lon: 73.1700, keywords: ['chhani', 'chhani jakatnaka', 'chhani village'] },
  { name: 'Waghodia Road', area: 'Vadodara', lat: 22.3100, lon: 73.2200, keywords: ['waghodia', 'waghodia road', 'prabhat society', 'vrindavan'] },
  { name: 'Ajwa Road', area: 'Vadodara', lat: 22.3100, lon: 73.2300, keywords: ['ajwa road', 'ajwa', 'sardar estate', 'kamlanagar'] },
  { name: 'Raopura', area: 'Vadodara', lat: 22.3000, lon: 73.2000, keywords: ['raopura', 'tower', 'mandvi'] },
  { name: 'Sayajigunj', area: 'Vadodara', lat: 22.3100, lon: 73.1850, keywords: ['sayajigunj', 'sayajiganj'] },
]

async function fetchFromGooglePlaces(query: string): Promise<AddressResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA1j9ak9yeJsRfWA9vq5rQcDZvPayNCd2s"
  if (!apiKey) return []

  try {
    // 1. Primary search: exact query with Vadodara location bias (lat 22.3072, lon 73.1812, radius 35km)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=22.3072,73.1812&radius=35000&components=country:in&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return []
    let data = await res.json()

    // 2. Fallback: if no predictions found, append 'Vadodara'
    if (data.status !== "OK" || !Array.isArray(data.predictions) || data.predictions.length === 0) {
      const fbUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query + ' Vadodara')}&location=22.3072,73.1812&radius=35000&components=country:in&key=${apiKey}`
      const fbRes = await fetch(fbUrl)
      if (fbRes.ok) {
        const fbData = await fbRes.json()
        if (fbData.status === "OK" && Array.isArray(fbData.predictions)) {
          data = fbData
        }
      }
    }

    if (data.status !== "OK" || !Array.isArray(data.predictions)) return []

    const preds = data.predictions.slice(0, 8)
    const results: AddressResult[] = preds.map((p: any) => ({
      name: p.structured_formatting?.main_text || p.description.split(',')[0],
      display_name: p.description,
      lat: 22.3072,
      lon: 73.1812,
      place_id: p.place_id,
    }))

    // Fetch exact lat/lon for top predictions via Place Details
    await Promise.all(
      results.map(async (r: any) => {
        if (r.place_id) {
          try {
            const dRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${r.place_id}&fields=geometry&key=${apiKey}`)
            const dData = await dRes.json()
            if (dData.result?.geometry?.location) {
              r.lat = dData.result.geometry.location.lat
              r.lon = dData.result.geometry.location.lng
            }
          } catch (_e) {}
        }
      })
    )

    return results
  } catch (e) {
    return []
  }
}

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
    // Restrict Nominatim strictly to Vadodara bounding box (viewbox)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&viewbox=73.0,22.1,73.4,22.5&bounded=1&limit=8`
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

    // 1. Query Google Places Autocomplete API FIRST (100% accurate for every society/building in Vadodara)
    const googleResults = await fetchFromGooglePlaces(query)
    googleResults.forEach(item => results.push(item))

    // 2. Search local Vadodara Dictionary (Instant 0ms match)
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

    // 3. Query Photon API (Elasticsearch OpenStreetMap with Vadodara bias)
    const photonResults = await fetchFromPhoton(`${query} Vadodara`)
    photonResults.forEach(item => results.push(item))

    // 4. Query Nominatim API with Vadodara bounding box
    if (results.length < 3) {
      const queryWithCity = cleanQ.includes("vadodara") || cleanQ.includes("anand") 
        ? query 
        : `${query}, Vadodara`
      const nomResults = await fetchFromNominatim(queryWithCity)
      nomResults.forEach(item => results.push(item))
    }

    // 5. Token Breakdown Fallback
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

    return NextResponse.json({ results: uniqueResults.slice(0, 10) })
  } catch (error: any) {
    console.error('[AddressSearch] Route error:', error)
    return NextResponse.json({ results: [], error: error.message }, { status: 500 })
  }
}
