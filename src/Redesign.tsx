import { useEffect, useMemo, useState } from 'react'
import { Cloud, CloudDrizzle, CloudRain, CloudSun, Heart, Moon, Search, Sun, X } from 'lucide-react'

type City = { name: string; lat: number; lon: number }
type ForecastDay = { date: string; code: number; high: number; low: number }
type Weather = { temp: number; feels: number; humidity: number; wind: number; code: number; days: ForecastDay[] }
type Category = 'Концерт' | 'Кино' | 'Спорт' | 'Детям'
type EventItem = { id: number; title: string; category: Category; time: string; venue: string; price: number; popularity: number; description: string }

const cities: City[] = [
  { name: 'Москва', lat: 55.7558, lon: 37.6173 },
  { name: 'Петербург', lat: 59.9343, lon: 30.3351 },
  { name: 'Казань', lat: 55.7961, lon: 49.1064 },
]
const events: EventItem[] = [
  { id: 1, time: '12:00', category: 'Детям', title: 'Семейный забег «Осенняя миля»', venue: 'Парк у набережной', price: 0, popularity: 77, description: 'Неспешный семейный маршрут по осеннему парку. Подходит для детей и взрослых, регистрация на месте.' },
  { id: 2, time: '15:30', category: 'Кино', title: '«Тихий берег» — премьера', venue: 'Кинотеатр «Октябрь»', price: 450, popularity: 84, description: 'Большая премьера камерной истории о случайной встрече и новом начале. Сеанс с обсуждением после показа.' },
  { id: 3, time: '17:00', category: 'Детям', title: 'Кукольный спектакль «Лунный кит»', venue: 'Театр кукол', price: 600, popularity: 91, description: 'Музыкальная сказка о путешествии маленького кита. Для зрителей от четырёх лет и их родителей.' },
  { id: 4, time: '19:00', category: 'Спорт', title: 'Хоккей: «Северные волки» — «Звезда»', venue: 'Ледовая арена', price: 900, popularity: 89, description: 'Вечерний матч регулярного чемпионата. Билеты есть на центральные сектора.' },
  { id: 5, time: '19:30', category: 'Концерт', title: 'Джазовый вечер Blue Hour Trio', venue: 'Клуб «Синяя нота»', price: 1200, popularity: 95, description: 'Трио исполнит джазовые стандарты и авторские композиции в камерном зале.' },
  { id: 6, time: '20:00', category: 'Концерт', title: 'Инди-концерт «Северное сияние»', venue: 'Зал «Космонавт»', price: 1500, popularity: 88, description: 'Большой концерт молодой инди-сцены. Двери открываются за час до начала.' },
  { id: 7, time: '21:15', category: 'Кино', title: 'Ночной показ «Город огней»', venue: 'Кинотеатр «Пионер»', price: 550, popularity: 72, description: 'Поздний показ любимой городской классики на большом экране.' },
]
const categoryNames: Record<'Все' | Category, string> = { Все: 'Все', Концерт: 'Концерты', Кино: 'Кино', Спорт: 'Спорт', Детям: 'Детям' }
const categoryColors: Record<Category, string> = { Концерт: 'concert', Кино: 'cinema', Спорт: 'sport', Детям: 'kids' }
const dateText = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date())
const tempText = (n: number) => `${n}°`
const dayName = (date: string, i: number) => i === 0 ? 'Сегодня' : new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
const forecastIcon = (code: number, size = 21) => code === 0 ? <Sun size={size} /> : code <= 2 ? <CloudSun size={size} /> : code <= 3 ? <Cloud size={size} /> : code >= 51 && code <= 67 ? <CloudDrizzle size={size} /> : <CloudRain size={size} />
const weatherDescription = (code: number) => code === 0 ? 'Ясно' : code <= 2 ? 'Переменная облачность' : code <= 3 ? 'Облачно' : code >= 51 ? 'Небольшой дождь' : 'Пасмурно'
const priceText = (price: number) => price ? `${price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'

export default function Redesign() {
  const [city, setCity] = useState(cities[0])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherError, setWeatherError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<'Все' | Category>('Все')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('time')
  const [favorites, setFavorites] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('city-widget-favorites') || '[]') as number[] } catch { return [] } })
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('city-widget-theme') || 'light')
  const [selected, setSelected] = useState<EventItem | null>(null)

  async function loadWeather(selectedCity: City) {
    setLoading(true); setWeatherError(false)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=ms&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Weather API error')
      const data = await response.json()
      setWeather({ temp: Math.round(data.current.temperature_2m), feels: Math.round(data.current.apparent_temperature), humidity: data.current.relative_humidity_2m, wind: Math.round(data.current.wind_speed_10m), code: data.current.weather_code, days: data.daily.time.map((date: string, i: number) => ({ date, code: data.daily.weather_code[i], high: Math.round(data.daily.temperature_2m_max[i]), low: Math.round(data.daily.temperature_2m_min[i]) })) })
    } catch { setWeatherError(true) } finally { setLoading(false) }
  }
  useEffect(() => { void loadWeather(city) }, [city])
  useEffect(() => { localStorage.setItem('city-widget-favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('city-widget-theme', theme); document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])

  const visibleEvents = useMemo(() => events.filter(event => (category === 'Все' || event.category === category) && event.title.toLowerCase().includes(search.toLowerCase()) && (!favoritesOnly || favorites.includes(event.id))).sort((a, b) => sort === 'price' ? a.price - b.price : sort === 'popular' ? b.popularity - a.popularity : a.time.localeCompare(b.time)), [category, search, sort, favoritesOnly, favorites])
  const setFavorite = (id: number) => setFavorites(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  const categoryCount = (cat: 'Все' | Category) => cat === 'Все' ? events.length : events.filter(event => event.category === cat).length
  const categories: Array<'Все' | Category> = ['Все', 'Концерт', 'Кино', 'Спорт', 'Детям']

  return <main className="widget-shell">
    <header className="widget-header">
      <a className="wordmark" href="#top" id="top"><span className="wordmark-icon">✳</span>City Widget</a>
      <div className="header-tools"><div className="city-switch" role="group" aria-label="Выберите город">{cities.map(item => <button key={item.name} className={item.name === city.name ? 'city-active' : ''} onClick={() => setCity(item)}>{item.name}</button>)}</div><button className="theme-button" aria-label="Переключить тему" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button></div>
    </header>

    <div className="dashboard">
      <aside className="weather-column" aria-label={`Погода в городе ${city.name}`}>
        <section className="current-weather glass-card">
          <div className="weather-card-city">{city.name}</div>
          {loading ? <div className="weather-wait"><i /><i /><i /></div> : weatherError ? <div className="weather-failure"><p>Погоду загрузить не удалось</p><button onClick={() => void loadWeather(city)}>Повторить</button></div> : weather && <>
            <div className="weather-summary"><div><div className="current-temp">{tempText(weather.temp)}</div><div className="weather-description">{weatherDescription(weather.code)}</div></div><div className="hero-weather-icon">{forecastIcon(weather.code, 62)}</div></div>
            <div className="day-extremes">Макс. {weather.days[0]?.high}° · Мин. {weather.days[0]?.low}°</div>
            <div className="weather-metrics"><div><span>ОЩУЩАЕТСЯ</span><strong>{weather.feels}°</strong></div><div><span>ВЛАЖНОСТЬ</span><strong>{weather.humidity}%</strong></div><div><span>ВЕТЕР</span><strong>{weather.wind} м/с</strong></div></div>
          </>}
        </section>
        <section className="forecast-card glass-card"><div className="forecast-heading">ПРОГНОЗ НА 5 ДНЕЙ</div>{loading ? <div className="forecast-loading">Загружаем прогноз…</div> : weatherError ? <div className="forecast-loading">Нет данных. <button onClick={() => void loadWeather(city)}>Повторить</button></div> : weather?.days.map((day, i) => { const low = Math.min(...weather.days.map(x => x.low)); const high = Math.max(...weather.days.map(x => x.high)); const left = (day.low - low) / Math.max(1, high - low) * 100; const width = Math.max(12, (day.high - day.low) / Math.max(1, high - low) * 100); return <div className="forecast-row" key={day.date}><span className="forecast-day-name">{dayName(day.date, i)}</span><span className="forecast-condition">{forecastIcon(day.code, 17)}</span><span className="forecast-low">{day.low}°</span><span className="temp-track"><i style={{ left: `${left}%`, width: `${width}%` }} /></span><strong className="forecast-high">{day.high}°</strong></div> })}</section>
      </aside>

      <section className="events-column" aria-labelledby="events-title">
        <div className="events-heading"><div><h1 id="events-title">Сегодня в городе</h1><p>{dateText.charAt(0).toLocaleUpperCase('ru-RU') + dateText.slice(1)} · {visibleEvents.length} событий</p></div><div className="event-tools"><label className="search-field"><Search size={17} /><input placeholder="Поиск по названию" aria-label="Поиск по названию" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="sort-field"><span>Сортировка</span><select aria-label="Сортировка" value={sort} onChange={e => setSort(e.target.value)}><option value="time">по времени</option><option value="price">по цене</option><option value="popular">по популярности</option></select><span className="select-chevron">⌄</span></label></div></div>
        <div className="filter-row" role="tablist" aria-label="Категории событий">{categories.map(cat => <button key={cat} role="tab" aria-selected={category === cat} className={`filter-chip ${category === cat ? 'filter-active' : ''}`} onClick={() => { setCategory(cat); setFavoritesOnly(false) }}>{categoryNames[cat]} <span>{categoryCount(cat)}</span></button>)}<button role="tab" aria-selected={favoritesOnly} className={`filter-chip favorites-chip ${favoritesOnly ? 'filter-active' : ''}`} onClick={() => { setFavoritesOnly(!favoritesOnly); setCategory('Все') }}><Heart size={14} /> Избранное <span>{favorites.length}</span></button></div>
        {visibleEvents.length ? <div className="event-grid">{visibleEvents.map(event => <article className="event-tile glass-card" key={event.id} onClick={() => setSelected(event)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(event) }} role="button" tabIndex={0} aria-label={`Подробнее: ${event.title}`}><div className="tile-meta"><div><strong>{event.time}</strong><span className={`category-dot dot-${categoryColors[event.category]}`} /> <span className="tile-category">{categoryNames[event.category]}</span></div><button className={`tile-heart ${favorites.includes(event.id) ? 'is-favorite' : ''}`} aria-label={favorites.includes(event.id) ? 'Убрать из избранного' : 'В избранное'} onClick={e => { e.stopPropagation(); setFavorite(event.id) }}><Heart size={19} fill={favorites.includes(event.id) ? 'currentColor' : 'none'} /></button></div><h2>{event.title}</h2><p className="tile-venue">{event.venue} · {priceText(event.price)}</p></article>)}</div> : <div className="no-events"><div>Ничего не нашлось</div><p>Попробуйте изменить фильтр или запрос.</p><button onClick={() => { setCategory('Все'); setFavoritesOnly(false); setSearch('') }}>Показать все события</button></div>}
        <div className="results-note">Афиша на сегодня <span>·</span> Демо-данные</div>
      </section>
    </div>

    {selected && <div className="dialog-scrim" onMouseDown={e => { if (e.currentTarget === e.target) setSelected(null) }}><section className="event-dialog glass-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" aria-label="Закрыть" onClick={() => setSelected(null)}><X size={18} /></button><span className={`dialog-category cat-${categoryColors[selected.category]}`}>{categoryNames[selected.category]} · сегодня, {selected.time}</span><h2 id="dialog-title">{selected.title}</h2><p>{selected.description}</p><div className="dialog-venue">{selected.venue}<strong>{priceText(selected.price)}</strong></div><button className="dialog-favorite" onClick={() => setFavorite(selected.id)}><Heart size={17} fill={favorites.includes(selected.id) ? 'currentColor' : 'none'} />{favorites.includes(selected.id) ? 'В избранном' : 'Добавить в избранное'}</button></section></div>}
  </main>
}
