import { useCallback, useEffect, useMemo, useState } from 'react'
import { CITIES } from '../config/cities'
import { EVENT_STORAGE_KEYS } from '../config/events'
import type { AppPage, City, EventFilter, EventItem, WeatherPreview } from '../domain/types'
import { useCityData } from '../hooks/useCityData'
import { readFavorites, readSavedEvents, readTheme } from '../utils/storage'
import { getWeatherEffect } from '../utils/weather'
import AppHeader from '../components/AppHeader'
import WeatherEffects from '../components/WeatherEffects'
import EventsPage from '../features/events/EventsPage'
import EventDialog from '../features/events/EventDialog'
import PlanPage from '../features/plan/PlanPage'
import CityNotes from '../features/today/CityNotes'
import WeatherPage from '../features/weather/WeatherPage'
import WeatherPreviewPage from '../features/weather/WeatherPreviewPage'
import WeatherSidebar from '../features/weather/WeatherSidebar'
import { getCurrentPage } from './routes'
import '../styles/base.css'
import '../styles/events.css'
import '../styles/screens.css'

const page: AppPage = getCurrentPage(window.location.pathname, window.location.hostname)

const getInitialCity = (): City => CITIES.find(city => city.slug === localStorage.getItem('city-widget-city')) || CITIES[0]

export default function App() {
  const [city, setCity] = useState(getInitialCity)
  const [weatherPreview, setWeatherPreview] = useState<WeatherPreview>('rain')
  const [category, setCategory] = useState<EventFilter>('Все')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('time')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState(() => readFavorites(EVENT_STORAGE_KEYS.favorites))
  const [savedEvents, setSavedEvents] = useState(() => readSavedEvents(EVENT_STORAGE_KEYS.savedEvents))
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const data = useCityData(city, page !== 'weather-preview')

  useEffect(() => { localStorage.setItem('city-widget-city', city.slug) }, [city])
  useEffect(() => { localStorage.setItem(EVENT_STORAGE_KEYS.favorites, JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem(EVENT_STORAGE_KEYS.savedEvents, JSON.stringify(savedEvents)) }, [savedEvents])
  useEffect(() => {
    localStorage.setItem('city-widget-theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    const missingDetails = data.events.filter(event => favorites.includes(event.id) && !savedEvents.some(saved => saved.id === event.id))
    if (missingDetails.length) setSavedEvents(current => [...current, ...missingDetails])
  }, [data.events, favorites, savedEvents])

  const cityName = city.name === 'Петербург' ? 'Санкт-Петербург' : city.name
  const favoriteSet = useMemo(() => new Set(favorites), [favorites])
  const visibleEvents = useMemo(() => data.events
    .filter(event => (category === 'Все' || event.category === category)
      && `${event.title} ${event.venue} ${event.description}`.toLocaleLowerCase('ru-RU').includes(search.toLocaleLowerCase('ru-RU'))
      && (!favoritesOnly || favoriteSet.has(event.id)))
    .sort((left, right) => sort === 'price'
      ? (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER)
      : sort === 'popular'
        ? right.popularity - left.popularity
        : left.time.localeCompare(right.time)),
  [data.events, category, search, sort, favoritesOnly, favoriteSet])
  const plannedEvents = useMemo(() => savedEvents
    .filter(event => favoriteSet.has(event.id))
    .sort((left, right) => left.time.localeCompare(right.time)), [savedEvents, favoriteSet])
  const featuredEvent = useMemo(() => [...data.events].sort((left, right) => right.popularity - left.popularity)[0], [data.events])
  const freeCount = data.events.filter(event => event.price === 0).length
  const earliestEvent = useMemo(() => [...data.events]
    .filter(event => event.time !== 'В течение дня')
    .sort((left, right) => left.time.localeCompare(right.time))[0], [data.events])
  const currentWeatherEffect = page === 'weather-preview'
    ? weatherPreview === 'snow' ? 'snow' : weatherPreview === 'fog' ? 'fog' : weatherPreview === 'clear' ? null : 'rain'
    : data.weather ? getWeatherEffect(data.weather.code) : null
  const rainIntensity = page === 'weather-preview'
    ? weatherPreview === 'drizzle' ? 'light' : weatherPreview === 'heavy-rain' ? 'heavy' : 'medium'
    : data.weather && (data.weather.code === 65 || data.weather.code === 67 || data.weather.code === 82 || data.weather.code >= 95)
      ? 'heavy'
      : data.weather && data.weather.code >= 51 && data.weather.code <= 57 ? 'light' : 'medium'
  const outfitTip = data.weather
    ? currentWeatherEffect === 'rain'
      ? 'Возьмите зонт: по прогнозу возможны осадки.'
      : currentWeatherEffect === 'snow' || data.weather.feels <= 5
        ? 'На вечер пригодится тёплый слой.'
        : data.weather.feels >= 22
          ? 'Лёгкая одежда подойдёт на весь день.'
          : 'Погода подходит для долгой прогулки.'
    : 'Здесь появится короткая подсказка по погоде.'

  const closeEvent = useCallback(() => setSelectedEvent(null), [])
  const toggleFavorite = useCallback((id: string) => {
    if (favoriteSet.has(id)) {
      setFavorites(current => current.filter(item => item !== id))
      setSavedEvents(current => current.filter(item => item.id !== id))
      return
    }

    setFavorites(current => [...current, id])
    const event = data.events.find(item => item.id === id) || (selectedEvent?.id === id ? selectedEvent : null)
    if (event) setSavedEvents(current => [...current.filter(item => item.id !== id), event])
  }, [data.events, favoriteSet, selectedEvent])

  const eventsProps = {
    page: page === 'events' ? 'events' as const : 'today' as const,
    cityName,
    events: data.events,
    visibleEvents,
    status: data.eventsStatus,
    notice: data.eventsNotice,
    category,
    favoritesOnly,
    favorites,
    search,
    sort,
    onCategoryChange: setCategory,
    onFavoritesOnlyChange: setFavoritesOnly,
    onSearchChange: setSearch,
    onSortChange: setSort,
    onRetry: data.reloadEvents,
    onToggleFavorite: toggleFavorite,
    onOpenEvent: setSelectedEvent,
  }

  return <main className={`widget-shell page-${page}`} id="top">
    <WeatherEffects effect={currentWeatherEffect} intensity={rainIntensity} />
    <AppHeader page={page} city={city} cities={CITIES} theme={theme} favoriteCount={favorites.length} onCityChange={setCity} onThemeChange={() => setTheme(current => current === 'light' ? 'dark' : 'light')} />

    {(page === 'today' || page === 'events') && <div className="dashboard" id="today">
      <WeatherSidebar cityName={cityName} weather={data.weather} loading={data.weatherLoading} error={data.weatherError} onRetry={() => void data.reloadWeather()} />
      <EventsPage {...eventsProps} />
    </div>}

    {page === 'today' && <CityNotes weather={data.weather} outfitTip={outfitTip} eventsStatus={data.eventsStatus} featuredEvent={featuredEvent} freeCount={freeCount} earliestEvent={earliestEvent} onOpenEvent={setSelectedEvent} />}
    {page === 'weather' && <WeatherPage cityName={cityName} weather={data.weather} loading={data.weatherLoading} error={data.weatherError} onRetry={() => void data.reloadWeather()} />}
    {page === 'weather-preview' && <WeatherPreviewPage cityName={cityName} selected={weatherPreview} onSelect={setWeatherPreview} />}
    {page === 'plan' && <PlanPage cityName={cityName} weather={data.weather} outfitTip={outfitTip} events={plannedEvents} onToggleFavorite={toggleFavorite} onOpenEvent={setSelectedEvent} />}

    <div className="footer-rule" aria-hidden="true" />
    {selectedEvent && <EventDialog event={selectedEvent} favorite={favoriteSet.has(selectedEvent.id)} onClose={closeEvent} onToggleFavorite={() => toggleFavorite(selectedEvent.id)} />}
  </main>
}
