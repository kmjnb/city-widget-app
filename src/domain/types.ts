export type City = {
  name: string
  slug: string
  lat: number
  lon: number
}

export type ForecastDay = {
  date: string
  code: number
  high: number
  low: number
}

export type ForecastHour = {
  time: string
  temp: number
  code: number
  precip: number
}

export type Weather = {
  temp: number
  feels: number
  humidity: number
  wind: number
  code: number
  days: ForecastDay[]
  hours: ForecastHour[]
  isDay: boolean
}

export type Category = 'Концерт' | 'Кино' | 'Спорт' | 'Детям' | 'Другое'
export type EventFilter = 'Все' | Category

export type EventItem = {
  id: string
  title: string
  category: Category
  time: string
  venue: string
  price: number | null
  priceLabel: string
  popularity: number
  description: string
  source?: 'TimePad' | 'KudaGo'
  url?: string
}

export type ApiEvent = {
  id: number
  title?: string
  short_title?: string
  description?: string
  body_text?: string
  tagline?: string
  dates?: Array<{ start?: number; start_time?: string }>
  place?: { title?: string; address?: string }
  categories?: string[]
  tags?: string[]
  price?: string
  is_free?: boolean
  site_url?: string
  favorites_count?: number
}

export type ApiShowing = {
  id: number
  datetime?: number
  movie?: { title?: string }
  place?: { title?: string; address?: string }
  price?: string
}

export type TimepadEvent = {
  id: number
  name: string
  starts_at: string
  ends_at?: string
  description_short?: string
  description_html?: string
  url?: string
  location?: { name?: string; city?: string; address?: string }
  categories?: Array<{ name?: string }>
  price_min?: number
  price_max?: number
  ticket_types?: Array<{ price?: number }>
}

export type AppPage = 'today' | 'events' | 'plan' | 'weather' | 'weather-preview'
export type WeatherPreview = 'drizzle' | 'rain' | 'heavy-rain' | 'snow' | 'fog' | 'clear'
export type WeatherEffect = 'rain' | 'snow' | 'fog' | null
export type EventsStatus = 'loading' | 'error' | 'ready'
