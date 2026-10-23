import { eventFromApi, showingFromApi } from '../domain/events'
import type { ApiEvent, ApiShowing, City, EventItem, TimepadEvent } from '../domain/types'
import { getMoscowDayBounds } from '../utils/dates'

export type EventsResult = {
  items: EventItem[]
  status: 'ready'
  notice: string
}

const REQUEST_TIMEOUT = 14_000
const KUDAGO_BASE = '/api/kudago/v1.4'
const TIMEPAD_BASE = '/api/timepad/v1/events.json'

type ApiCollection<T> = { results?: T[] }
type TimepadCollection = { values: TimepadEvent[] }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isOptionalString = (value: unknown) => value === undefined || typeof value === 'string'
const isOptionalNumber = (value: unknown) => value === undefined || typeof value === 'number'
const isStringArray = (value: unknown) => value === undefined || (Array.isArray(value) && value.every(item => typeof item === 'string'))
const isOptionalObject = (value: unknown, validate: (item: Record<string, unknown>) => boolean) => value === undefined
  || (isObject(value) && validate(value))

const isApiEvent = (value: unknown): value is ApiEvent => {
  if (!isObject(value) || typeof value.id !== 'number') return false
  const placeIsValid = isOptionalObject(value.place, place => isOptionalString(place.title) && isOptionalString(place.address))
  const datesAreValid = value.dates === undefined || (Array.isArray(value.dates) && value.dates.every(date =>
    isObject(date) && isOptionalNumber(date.start) && isOptionalString(date.start_time)))
  const imagesAreValid = value.images === undefined || (Array.isArray(value.images) && value.images.every(image =>
    isObject(image) && isOptionalString(image.image)))

  return placeIsValid
    && datesAreValid
    && imagesAreValid
    && isOptionalString(value.title)
    && isOptionalString(value.short_title)
    && isOptionalString(value.description)
    && isOptionalString(value.body_text)
    && isOptionalString(value.tagline)
    && isStringArray(value.categories)
    && isStringArray(value.tags)
    && isOptionalString(value.price)
    && (value.is_free === undefined || typeof value.is_free === 'boolean')
    && isOptionalString(value.site_url)
    && isOptionalNumber(value.favorites_count)
}

const isApiShowing = (value: unknown): value is ApiShowing => {
  if (!isObject(value) || typeof value.id !== 'number') return false
  const placeIsValid = isOptionalObject(value.place, place => isOptionalString(place.title) && isOptionalString(place.address))
  const movieIsValid = isOptionalObject(value.movie, movie => isOptionalString(movie.title)
    && isOptionalObject(movie.poster, poster => isOptionalString(poster.image)))

  return placeIsValid && movieIsValid && isOptionalNumber(value.datetime) && isOptionalString(value.price)
}

const isCollection = <T,>(isItem: (value: unknown) => value is T) => (value: unknown): value is ApiCollection<T> =>
  isObject(value) && (value.results === undefined || (Array.isArray(value.results) && value.results.every(isItem)))

const isTimepadEvent = (value: unknown): value is TimepadEvent => isObject(value)
  && typeof value.id === 'number'
  && typeof value.name === 'string'
  && typeof value.starts_at === 'string'
  && isOptionalString(value.description_short)
  && isOptionalString(value.description_html)
  && isOptionalString(value.url)
  && isOptionalNumber(value.price_min)
  && isOptionalNumber(value.price_max)
  && isOptionalObject(value.location, location => isOptionalString(location.name)
    && isOptionalString(location.city)
    && isOptionalString(location.address))
  && isOptionalObject(value.poster_image, image => isOptionalString(image.default_url))
  && (value.categories === undefined || (Array.isArray(value.categories) && value.categories.every(category =>
    isObject(category) && isOptionalString(category.name))))
  && (value.ticket_types === undefined || (Array.isArray(value.ticket_types) && value.ticket_types.every(ticket =>
    isObject(ticket) && isOptionalNumber(ticket.price))))

const isTimepadCollection = (value: unknown): value is TimepadCollection => isObject(value)
  && Array.isArray(value.values)
  && value.values.every(isTimepadEvent)

const fetchJson = async <T,>(url: string, validate: (value: unknown) => value is T): Promise<T> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message = isObject(payload) && isObject(payload.response_status) && typeof payload.response_status.message === 'string'
      ? payload.response_status.message
      : `HTTP ${response.status}`
    throw new Error(message)
  }

  const payload: unknown = await response.json()
  if (!validate(payload)) throw new Error('Источник событий вернул данные в неизвестном формате')
  return payload
}

const kudagoParams = (city: City, fields: string, expand: string) => {
  const { since, until } = getMoscowDayBounds()
  return new URLSearchParams({
    lang: 'ru',
    location: city.slug,
    actual_since: String(since),
    actual_until: String(until),
    page_size: '100',
    fields,
    expand,
  })
}

const timepadCityName = (city: City) => city.slug === 'spb' ? 'Санкт-Петербург' : city.name

const getTimepadParams = (city: City) => {
  const { since, until } = getMoscowDayBounds()
  return new URLSearchParams({
    limit: '100',
    skip: '0',
    cities: timepadCityName(city),
    starts_at_min: new Date(since * 1000).toISOString(),
    starts_at_max: new Date((until - 1) * 1000).toISOString(),
    sort: '+starts_at',
    fields: 'location,categories,ticket_types,description_short,description_html,price_min,price_max,poster_image',
  })
}

const cleanDescription = (description?: string) => (description || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const eventCategory = (event: TimepadEvent): EventItem['category'] => {
  const words = `${event.categories?.map(category => category.name || '').join(' ')} ${event.name} ${event.description_short || ''}`.toLocaleLowerCase('ru-RU')
  if (/кино|кинопоказ|фильм|cinema|movie/.test(words)) return 'Кино'
  if (/спорт|футбол|хоккей|забег|матч|трениров|турнир|йог[аи]/.test(words)) return 'Спорт'
  if (/дет|реб[её]н|семейн|для всей семьи/.test(words)) return 'Детям'
  if (/концерт|музык|джаз|выступлен/.test(words)) return 'Концерт'
  return 'Другое'
}

const eventFromTimepad = (event: TimepadEvent): EventItem => {
  const date = new Date(event.starts_at)
  const time = Number.isNaN(date.getTime())
    ? 'В течение дня'
    : new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(date)
  const prices = [event.price_min, ...(event.ticket_types || []).map(ticket => ticket.price)]
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price))
  const price = prices.length ? Math.min(...prices) : null

  return {
    id: `timepad-${event.id}`,
    title: event.name,
    category: eventCategory(event),
    time,
    venue: event.location?.name || event.location?.address || event.location?.city || 'Место уточняется',
    price,
    priceLabel: price === 0 ? 'Бесплатно' : price === null ? 'Цена на сайте' : `${price.toLocaleString('ru-RU')} ₽`,
    popularity: 0,
    description: cleanDescription(event.description_short || event.description_html)
      || 'Подробности и билеты — на странице события.',
    image: event.poster_image?.default_url?.replace(/^http:/, 'https:'),
    url: event.url?.replace(/^http:/, 'https:'),
  }
}

const getTimepadEvents = async (city: City) => {
  const params = getTimepadParams(city)
  const payload = await fetchJson(`${TIMEPAD_BASE}?${params}`, isTimepadCollection)
  return payload.values.map(eventFromTimepad).filter(event => event.time !== 'В течение дня')
}

const getKudagoEvents = async (city: City) => {
  const eventParams = kudagoParams(city, 'id,title,short_title,description,body_text,dates,place,categories,tags,tagline,price,is_free,site_url,favorites_count,images', 'dates,place,images')
  eventParams.set('order_by', '-favorites_count,-id')
  const movieParams = kudagoParams(city, 'id,movie,place,datetime,price', 'movie,place')
  const [eventPayload, moviePayload] = await Promise.all([
    fetchJson(`${KUDAGO_BASE}/events/?${eventParams}`, isCollection(isApiEvent)),
    fetchJson(`${KUDAGO_BASE}/movie-showings/?${movieParams}`, isCollection(isApiShowing)),
  ])
  return [
    ...(eventPayload.results || []).map(eventFromApi),
    ...(moviePayload.results || []).map(showingFromApi),
  ].filter(event => event.title && event.time !== 'В течение дня')
}

export const fetchEvents = async (city: City): Promise<EventsResult> => {
  const [timepadResult, kudagoResult] = await Promise.allSettled([
    getTimepadEvents(city),
    getKudagoEvents(city),
  ])
  const timepadEvents = timepadResult.status === 'fulfilled' ? timepadResult.value : []
  const kudagoEvents = kudagoResult.status === 'fulfilled' ? kudagoResult.value : []

  if (timepadResult.status === 'rejected' && kudagoResult.status === 'rejected') {
    throw new Error(`TimePad: ${String(timepadResult.reason)}. KudaGo: ${String(kudagoResult.reason)}`)
  }

  const items = [...timepadEvents, ...kudagoEvents]
  const uniqueItems = [...new Map(items.map(event => [event.id, event])).values()]
    .sort((left, right) => left.time.localeCompare(right.time))

  return { items: uniqueItems, status: 'ready', notice: '' }
}
