import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, Cloud, CloudDrizzle, CloudRain, CloudSun, Heart, MapPin, Moon, Search, Sun, Ticket, Wind, X } from 'lucide-react'

type City = { name: string; slug: string; lat: number; lon: number }
type ForecastDay = { date: string; code: number; high: number; low: number }
type Weather = { temp: number; feels: number; humidity: number; wind: number; code: number; days: ForecastDay[] }
type Category = 'Концерт' | 'Кино' | 'Спорт' | 'Детям' | 'Другое'
type EventItem = { id: string; title: string; category: Category; time: string; venue: string; price: number | null; priceLabel: string; popularity: number; description: string; image?: string; url?: string }
type ApiEvent = { id: number; title?: string; short_title?: string; description?: string; body_text?: string; tagline?: string; dates?: Array<{ start?: number; start_time?: string }>; place?: { title?: string; address?: string }; categories?: string[]; tags?: string[]; price?: string; is_free?: boolean; site_url?: string; favorites_count?: number; images?: Array<{ image?: string }> }
type ApiShowing = { id: number; datetime?: number; movie?: { title?: string; poster?: { image?: string } }; place?: { title?: string; address?: string }; price?: string }

const cities: City[] = [
  { name: 'Москва', slug: 'msk', lat: 55.7558, lon: 37.6173 },
  { name: 'Петербург', slug: 'spb', lat: 59.9343, lon: 30.3351 },
  { name: 'Казань', slug: 'kzn', lat: 55.7961, lon: 49.1064 },
]
const categoryNames: Record<'Все' | Category, string> = { Все: 'Все', Концерт: 'Концерты', Кино: 'Кино', Спорт: 'Спорт', Детям: 'Детям', Другое: 'Другое' }
const categoryColors: Record<Category, string> = { Концерт: 'concert', Кино: 'cinema', Спорт: 'sport', Детям: 'kids', Другое: 'other' }
const categories: Array<'Все' | Category> = ['Все', 'Концерт', 'Кино', 'Спорт', 'Детям']
const dateText = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date())
const tempText = (n: number) => `${n}°`
const dayName = (date: string, i: number) => i === 0 ? 'Сегодня' : new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
const forecastIcon = (code: number, size = 21) => code === 0 ? <Sun size={size} /> : code <= 2 ? <CloudSun size={size} /> : code <= 3 ? <Cloud size={size} /> : code >= 51 && code <= 67 ? <CloudDrizzle size={size} /> : <CloudRain size={size} />
const weatherDescription = (code: number) => code === 0 ? 'Ясно' : code <= 2 ? 'Переменная облачность' : code <= 3 ? 'Облачно' : code >= 71 && code <= 77 ? 'Снег' : code >= 51 ? 'Небольшой дождь' : 'Пасмурно'
const numberFromPrice = (price?: string, isFree?: boolean): number | null => {
  if (isFree || /бесплат|free/i.test(price || '')) return 0
  const match = (price || '').replace(/\s/g, '').match(/\d+(?:[,.]\d+)?/)
  return match ? Number(match[0].replace(',', '.')) : null
}
const priceText = (price: number | null, source?: string) => price === 0 ? 'Бесплатно' : price === null ? source || 'Цена на сайте' : `${price.toLocaleString('ru-RU')} ₽`
const timeFromTimestamp = (timestamp?: number, fallback?: string) => {
  if (fallback && /^\d{2}:\d{2}/.test(fallback)) return fallback.slice(0, 5)
  if (!timestamp) return 'В течение дня'
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(new Date(timestamp * 1000))
}
const isoDateInMoscow = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
const dayBounds = () => {
  const today = isoDateInMoscow(new Date())
  const tomorrowDate = new Date(`${today}T12:00:00+03:00`)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = isoDateInMoscow(tomorrowDate)
  return { since: Math.floor(new Date(`${today}T00:00:00+03:00`).getTime() / 1000), until: Math.floor(new Date(`${tomorrow}T00:00:00+03:00`).getTime() / 1000) }
}
const eventCategory = (event: ApiEvent): Category => {
  const words = [...(event.categories || []), ...(event.tags || []), event.title || '', event.tagline || '', event.description || ''].join(' ').toLowerCase()
  if (/\bconcert\b|концерт|музыкальн|джаз|выступлен/.test(words)) return 'Концерт'
  if (/\b(movie|cinema|film)\b|кино|кинопоказ|фильм|показ/.test(words)) return 'Кино'
  if (/\b(sport|sports|fitness)\b|спорт|хоккей|футбол|забег|матч|каток/.test(words)) return 'Спорт'
  if (/\b(kids?|children|family)\b|детск|для детей|семейн|юных зрител/.test(words)) return 'Детям'
  return 'Другое'
}
const eventFromApi = (event: ApiEvent): EventItem => {
  const date = event.dates?.[0]
  const firstImage = event.images?.find(image => image.image)?.image?.replace(/^http:/, 'https:')
  const price = numberFromPrice(event.price, event.is_free)
  return { id: `event-${event.id}`, title: event.short_title || event.title || 'Городское событие', category: eventCategory(event), time: timeFromTimestamp(date?.start, date?.start_time), venue: event.place?.title || event.place?.address || 'Место уточняется', price, priceLabel: priceText(price, event.price), popularity: event.favorites_count || 0, description: [event.tagline, event.description, event.body_text].filter(Boolean).join('\n\n') || 'Подробности и расписание — на странице события.', image: firstImage, url: event.site_url?.replace(/^http:/, 'https:') }
}
const showingFromApi = (showing: ApiShowing): EventItem => {
  const price = numberFromPrice(showing.price)
  return { id: `movie-${showing.id}`, title: showing.movie?.title || 'Киносеанс', category: 'Кино', time: timeFromTimestamp(showing.datetime), venue: showing.place?.title || showing.place?.address || 'Кинотеатр', price, priceLabel: priceText(price, showing.price), popularity: 0, description: `Сегодняшний киносеанс в ${showing.place?.title || 'городе'}. Время и билеты смотрите на странице площадки.`, image: showing.movie?.poster?.image?.replace(/^http:/, 'https:') }
}

export default function CityWidget() {
  const [city, setCity] = useState(cities[0])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherError, setWeatherError] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventsState, setEventsState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [category, setCategory] = useState<'Все' | Category>('Все')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('time')
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('city-widget-favorites') || '[]').map(String) as string[] } catch { return [] } })
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('city-widget-theme') || 'light')
  const [selected, setSelected] = useState<EventItem | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  async function loadWeather(selectedCity: City) {
    setWeatherLoading(true); setWeatherError(false)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=ms&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`
      const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
      if (!response.ok) throw new Error('Weather API error')
      const data = await response.json()
      setWeather({ temp: Math.round(data.current.temperature_2m), feels: Math.round(data.current.apparent_temperature), humidity: data.current.relative_humidity_2m, wind: Math.round(data.current.wind_speed_10m), code: data.current.weather_code, days: data.daily.time.map((date: string, i: number) => ({ date, code: data.daily.weather_code[i], high: Math.round(data.daily.temperature_2m_max[i]), low: Math.round(data.daily.temperature_2m_min[i]) })) })
    } catch { setWeatherError(true) } finally { setWeatherLoading(false) }
  }
  async function loadEvents(selectedCity: City) {
    setEventsState('loading')
    const { since, until } = dayBounds()
    const common = new URLSearchParams({ lang: 'ru', location: selectedCity.slug, actual_since: String(since), actual_until: String(until), page_size: '100' })
    // Keep KudaGo requests same-origin during local development to avoid browser CORS failures.
    const base = import.meta.env.DEV ? '/api/kudago/v1.4' : 'https://kudago.com/public-api/v1.4'
    const eventParams = new URLSearchParams(common)
    eventParams.set('fields', 'id,title,short_title,description,body_text,dates,place,categories,tags,tagline,price,is_free,site_url,favorites_count,images')
    eventParams.set('expand', 'dates,place,images')
    eventParams.set('order_by', '-favorites_count,-id')
    const movieParams = new URLSearchParams(common)
    movieParams.set('fields', 'id,movie,place,datetime,price')
    movieParams.set('expand', 'movie,place')
    try {
      const results = await Promise.allSettled([
        fetch(`${base}/events/?${eventParams}`, { signal: AbortSignal.timeout(14000) }).then(response => { if (!response.ok) throw new Error(`Events API: ${response.status}`); return response.json() }),
        fetch(`${base}/movie-showings/?${movieParams}`, { signal: AbortSignal.timeout(14000) }).then(response => { if (!response.ok) throw new Error(`Cinema API: ${response.status}`); return response.json() }),
      ])
      const eventResponse = results[0].status === 'fulfilled' ? results[0].value : null
      const movieResponse = results[1].status === 'fulfilled' ? results[1].value : null
      if (!eventResponse && !movieResponse) {
        console.error('Both KudaGo endpoints failed', results.map(result => result.status === 'rejected' ? result.reason : null))
        throw new Error('Events API unavailable')
      }
      const liveEvents: EventItem[] = [
        ...((eventResponse?.results || []) as ApiEvent[]).map(eventFromApi),
        ...((movieResponse?.results || []) as ApiShowing[]).map(showingFromApi),
      ].filter(event => event.title && event.time !== 'В течение дня')
      const unique = [...new Map(liveEvents.map(event => [event.id, event])).values()]
      unique.sort((a, b) => a.time.localeCompare(b.time))
      setEvents(unique)
      setEventsState('ready')
    } catch (error) { console.error('KudaGo API request failed', error); setEvents([]); setEventsState('error') }
  }
  useEffect(() => { void loadWeather(city); void loadEvents(city) }, [city])
  useEffect(() => { localStorage.setItem('city-widget-favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('city-widget-theme', theme); document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    if (!selected) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelected(null); return }
      if (event.key !== 'Tab') return
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
      const focusable = dialog ? [...dialog.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')] : []
      if (!focusable.length) return
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1]?.focus() }
      else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('keydown', handleKey); previous?.focus() }
  }, [selected])

  const visibleEvents = useMemo(() => events.filter(event => (category === 'Все' || event.category === category) && `${event.title} ${event.venue} ${event.description}`.toLowerCase().includes(search.toLowerCase()) && (!favoritesOnly || favorites.includes(event.id))).sort((a, b) => sort === 'price' ? (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER) : sort === 'popular' ? b.popularity - a.popularity : a.time.localeCompare(b.time)), [events, category, search, sort, favoritesOnly, favorites])
  const setFavorite = (id: string) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const countFor = (cat: 'Все' | Category) => cat === 'Все' ? events.length : events.filter(event => event.category === cat).length
  const featuredEvent = [...events].sort((a, b) => b.popularity - a.popularity)[0]
  const freeCount = events.filter(event => event.price === 0).length
  const earliestEvent = [...events].filter(event => event.time !== 'В течение дня').sort((a, b) => a.time.localeCompare(b.time))[0]
  const cityName = city.name === 'Петербург' ? 'Санкт-Петербург' : city.name
  const outfitTip = weather ? weather.code >= 51 ? 'Возьмите зонт: по прогнозу возможен дождь.' : weather.feels <= 5 ? 'На вечер пригодится тёплый слой.' : weather.feels >= 22 ? 'Лёгкая одежда подойдёт на весь день.' : 'Погода подходит для долгой прогулки.' : 'Здесь появится короткая подсказка по погоде.'

  return <main className="widget-shell" id="top">
    <header className="widget-header">
      <a className="wordmark" href="#top"><span className="wordmark-icon">✳</span>City Widget</a>
      <nav className="main-nav" aria-label="Разделы страницы"><a href="#today">Сегодня</a><a href="#events">Афиша</a><a href="#city-notes">Планы дня</a></nav>
      <div className="header-tools"><div className="city-switch" role="group" aria-label="Выберите город">{cities.map(item => <button key={item.slug} className={item.slug === city.slug ? 'city-active' : ''} aria-pressed={item.slug === city.slug} onClick={() => setCity(item)}>{item.name}</button>)}</div><button className="theme-button" aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button></div>
    </header>

    <div className="dashboard" id="today">
      <aside className="weather-column" aria-label={`Погода в городе ${cityName}`}>
        <section className="current-weather glass-card">
          <div className="weather-card-city">{cityName}</div>
          {weatherLoading ? <div className="weather-wait" aria-label="Загружаем погоду"><i /><i /><i /></div> : weatherError ? <div className="weather-failure" role="alert"><p>Не удалось загрузить погоду</p><button onClick={() => void loadWeather(city)}>Повторить</button></div> : weather && <>
            <div className="weather-summary"><div><div className="current-temp">{tempText(weather.temp)}</div><div className="weather-description">{weatherDescription(weather.code)}</div></div><div className="hero-weather-icon" aria-hidden="true">{forecastIcon(weather.code, 62)}</div></div>
            <div className="day-extremes">Макс. {weather.days[0]?.high}° · Мин. {weather.days[0]?.low}°</div>
            <div className="weather-metrics"><div><span>ОЩУЩАЕТСЯ</span><strong>{weather.feels}°</strong></div><div><span>ВЛАЖНОСТЬ</span><strong>{weather.humidity}%</strong></div><div><span>ВЕТЕР</span><strong>{weather.wind} м/с</strong></div></div>
          </>}
        </section>
        <section className="forecast-card glass-card" aria-label="Прогноз погоды на пять дней"><div className="forecast-heading">ПРОГНОЗ НА 5 ДНЕЙ</div>{weatherLoading ? <div className="forecast-loading" role="status">Загружаем прогноз…</div> : weatherError ? <div className="forecast-loading">Нет данных о прогнозе.</div> : weather?.days.map((day, i) => { const low = Math.min(...weather.days.map(x => x.low)); const high = Math.max(...weather.days.map(x => x.high)); const left = (day.low - low) / Math.max(1, high - low) * 100; const width = Math.max(12, (day.high - day.low) / Math.max(1, high - low) * 100); return <div className="forecast-row" key={day.date}><span className="forecast-day-name">{dayName(day.date, i)}</span><span className="forecast-condition" aria-label={weatherDescription(day.code)}>{forecastIcon(day.code, 17)}</span><span className="forecast-low">{day.low}°</span><span className="temp-track" aria-hidden="true"><i style={{ left: `${left}%`, width: `${width}%` }} /></span><strong className="forecast-high">{day.high}°</strong></div> })}</section>
      </aside>

      <section className="events-column" id="events" aria-labelledby="events-title">
        <div className="events-heading"><div><span className="eyebrow">{cityName.toLocaleUpperCase('ru-RU')} · {dateText.toLocaleUpperCase('ru-RU')}</span><h1 id="events-title">Сегодня в городе</h1><p>{eventsState === 'ready' ? `${events.length} событий рядом с вами` : eventsState === 'loading' ? 'Ищем события на сегодня…' : 'Афиша на сегодня'}</p></div><div className="event-tools"><label className="search-field"><Search size={17} aria-hidden="true" /><input placeholder="Поиск по событиям" aria-label="Поиск по событиям" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="sort-field"><span>Сортировка</span><select aria-label="Сортировка событий" value={sort} onChange={e => setSort(e.target.value)}><option value="time">по времени</option><option value="price">по цене</option><option value="popular">по популярности</option></select><span className="select-chevron" aria-hidden="true">⌄</span></label></div></div>
        <div className="filter-row" role="group" aria-label="Фильтр событий по категории">{categories.map(cat => <button key={cat} aria-pressed={category === cat && !favoritesOnly} className={`filter-chip ${category === cat && !favoritesOnly ? 'filter-active' : ''}`} onClick={() => { setCategory(cat); setFavoritesOnly(false) }}>{categoryNames[cat]} <span>{countFor(cat)}</span></button>)}<button aria-pressed={favoritesOnly} className={`filter-chip favorites-chip ${favoritesOnly ? 'filter-active' : ''}`} onClick={() => { setFavoritesOnly(!favoritesOnly); setCategory('Все') }}><Heart size={14} aria-hidden="true" /> Избранное <span>{favorites.length}</span></button></div>
        {eventsState === 'loading' ? <div className="event-grid" aria-label="Загружаем афишу">{Array.from({ length: 6 }, (_, i) => <div className="event-skeleton glass-card" key={i}><span /><span /><i /></div>)}</div> : eventsState === 'error' ? <div className="event-api-error" role="alert"><CalendarDays size={25} /><div><strong>Не удалось загрузить афишу</strong><p>Попробуйте ещё раз. События предоставляет открытый API KudaGo.</p></div><button onClick={() => void loadEvents(city)}>Повторить <ArrowRight size={15} /></button></div> : visibleEvents.length ? <div className="event-grid">{visibleEvents.map(event => <article className={`event-tile glass-card ${event.image ? 'has-event-image' : ''}`} style={event.image ? { backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.91),rgba(255,255,255,.83)),url("${event.image}")` } : undefined} key={event.id}><div className="tile-meta"><div><strong>{event.time}</strong><span className={`category-dot dot-${categoryColors[event.category]}`} /><span className="tile-category">{categoryNames[event.category]}</span></div><button className={`tile-heart ${favorites.includes(event.id) ? 'is-favorite' : ''}`} aria-label={favorites.includes(event.id) ? `Убрать «${event.title}» из избранного` : `Добавить «${event.title}» в избранное`} onClick={() => setFavorite(event.id)}><Heart size={19} fill={favorites.includes(event.id) ? 'currentColor' : 'none'} /></button></div><button className="event-open" onClick={() => setSelected(event)} aria-label={`Подробнее о событии: ${event.title}`}><h2>{event.title}</h2><p className="tile-venue"><MapPin size={12} aria-hidden="true" />{event.venue} <span>·</span> {event.priceLabel}</p></button></article>)}</div> : <div className="no-events"><div>{favoritesOnly ? 'Избранное пока пусто' : 'По этому запросу событий нет'}</div><p>{favoritesOnly ? 'Отмечайте интересные события сердцем — они останутся здесь.' : 'Попробуйте выбрать другую категорию или снять часть фильтров.'}</p><button onClick={() => { setCategory('Все'); setFavoritesOnly(false); setSearch('') }}>Показать всю афишу</button></div>}
        {eventsState === 'ready' && <div className="results-note">Показываем {visibleEvents.length} из {events.length} событий <span>·</span> <a href="https://kudago.com/" target="_blank" rel="noreferrer">Афиша KudaGo</a></div>}
      </section>
    </div>

    <section className="city-notes" id="city-notes" aria-labelledby="notes-title"><div className="notes-heading"><div><span className="eyebrow">МАЛЕНЬКИЙ ПЛАН НА СЕГОДНЯ</span><h2 id="notes-title">День уже складывается</h2></div><p>Полезные ориентиры — из прогноза и афиши</p></div><div className="notes-grid"><article className="focus-card glass-card" style={featuredEvent?.image ? { backgroundImage: `linear-gradient(90deg,rgba(24,36,52,.88),rgba(24,36,52,.52) 62%,rgba(24,36,52,.12)),url("${featuredEvent.image}")` } : undefined}><div className="focus-copy"><span className="focus-label"><span />В ФОКУСЕ СЕГОДНЯ</span><h3>{featuredEvent?.title || (eventsState === 'loading' ? 'Подбираем событие дня' : 'Планы появятся здесь')}</h3><p>{featuredEvent ? `${featuredEvent.time} · ${featuredEvent.venue}` : eventsState === 'error' ? 'Обновите афишу, чтобы увидеть события вашего города.' : 'События, которые сегодня собирают больше всего внимания.'}</p>{featuredEvent && <button onClick={() => setSelected(featuredEvent)}>Подробнее <ArrowRight size={15} /></button>}</div><div className="focus-symbol" aria-hidden="true">✳</div></article><article className="note-card glass-card"><span className="note-icon weather-note-icon">{weather ? forecastIcon(weather.code, 20) : <Sun size={20} />}</span><span className="note-label">ПОГОДА И ПЛАНЫ</span><strong>{weather ? `${weather.feels}° сейчас` : 'Проверяем прогноз'}</strong><p>{outfitTip}</p></article><article className="note-card glass-card"><span className="note-icon free-note-icon"><Ticket size={19} /></span><span className="note-label">БЕЗ БИЛЕТА</span><strong>{eventsState === 'ready' ? `${freeCount} ${freeCount === 1 ? 'бесплатное событие' : 'бесплатных события'}` : 'Найдите событие'}</strong><p>{freeCount ? 'Есть повод выйти из дома без лишних трат.' : 'Проверьте афишу: цены могут обновляться.'}</p></article><article className="note-card glass-card"><span className="note-icon time-note-icon"><Wind size={19} /></span><span className="note-label">ПЕРВЫЙ ПОВОД ВЫЙТИ</span><strong>{earliestEvent?.time || 'Сегодня'}</strong><p>{earliestEvent ? earliestEvent.title : 'Подберите событие по настроению.'}</p></article></div></section>

    <footer className="widget-footer"><a className="wordmark footer-wordmark" href="#top">City Widget</a><span>Погода — <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span><span>События — <a href="https://kudago.com/" target="_blank" rel="noreferrer">KudaGo</a></span><a href="#top" className="back-top">Наверх ↑</a></footer>

    {selected && <div className="dialog-scrim" onMouseDown={e => { if (e.currentTarget === e.target) setSelected(null) }}><section className="event-dialog glass-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">{selected.image && <img className="dialog-image" src={selected.image} alt="" /> }<button ref={closeRef} className="dialog-close" aria-label="Закрыть карточку события" onClick={() => setSelected(null)}><X size={18} /></button><span className={`dialog-category cat-${categoryColors[selected.category]}`}>{categoryNames[selected.category]} · сегодня, {selected.time}</span><h2 id="dialog-title">{selected.title}</h2><p id="dialog-description">{selected.description}</p><div className="dialog-venue"><span><MapPin size={14} aria-hidden="true" />{selected.venue}</span><strong>{selected.priceLabel}</strong></div><div className="dialog-actions"><button className="dialog-favorite" onClick={() => setFavorite(selected.id)}><Heart size={17} fill={favorites.includes(selected.id) ? 'currentColor' : 'none'} />{favorites.includes(selected.id) ? 'В избранном' : 'Добавить в избранное'}</button>{selected.url && <a className="dialog-source" href={selected.url} target="_blank" rel="noreferrer">На KudaGo <ArrowRight size={15} /></a>}</div></section></div>}
  </main>
}
