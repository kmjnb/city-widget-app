import type { ApiEvent, ApiShowing, Category, EventItem } from './types'
import { formatEventTime } from '../utils/dates'

const numberFromPrice = (price?: string, isFree?: boolean): number | null => {
  if (isFree || /бесплат|free/i.test(price || '')) return 0
  const match = (price || '').replace(/\s/g, '').match(/\d+(?:[,.]\d+)?/)
  return match ? Number(match[0].replace(',', '.')) : null
}

const formatPrice = (price: number | null, source?: string) => price === 0
  ? 'Бесплатно'
  : price === null
    ? source || 'Цена на сайте'
    : `${price.toLocaleString('ru-RU')} ₽`

const eventCategory = (event: ApiEvent): Category => {
  const words = [
    ...(event.categories || []),
    ...(event.tags || []),
    event.title || '',
    event.tagline || '',
    event.description || '',
  ].join(' ').toLowerCase()

  if (/\bconcert\b|концерт|музыкальн|джаз|выступлен/.test(words)) return 'Концерт'
  if (/\b(movie|cinema|film)\b|кино|кинопоказ|фильм|показ/.test(words)) return 'Кино'
  if (/\b(sport|sports|fitness)\b|спорт|хоккей|футбол|забег|матч|каток/.test(words)) return 'Спорт'
  if (/\b(kids?|children|family)\b|детск|для детей|семейн|юных зрител/.test(words)) return 'Детям'
  return 'Другое'
}

export const eventFromApi = (event: ApiEvent): EventItem => {
  const date = event.dates?.[0]
  const price = numberFromPrice(event.price, event.is_free)
  const image = event.images?.find(item => item.image)?.image?.replace(/^http:/, 'https:')

  return {
    id: `event-${event.id}`,
    title: event.short_title || event.title || 'Городское событие',
    category: eventCategory(event),
    time: formatEventTime(date?.start, date?.start_time),
    venue: event.place?.title || event.place?.address || 'Место уточняется',
    price,
    priceLabel: formatPrice(price, event.price),
    popularity: event.favorites_count || 0,
    description: [event.tagline, event.description, event.body_text].filter(Boolean).join('\n\n')
      || 'Подробности и расписание — на странице события.',
    image,
    url: event.site_url?.replace(/^http:/, 'https:'),
  }
}

export const showingFromApi = (showing: ApiShowing): EventItem => {
  const price = numberFromPrice(showing.price)

  return {
    id: `movie-${showing.id}`,
    title: showing.movie?.title || 'Киносеанс',
    category: 'Кино',
    time: formatEventTime(showing.datetime),
    venue: showing.place?.title || showing.place?.address || 'Кинотеатр',
    price,
    priceLabel: formatPrice(price, showing.price),
    popularity: 0,
    description: `Сегодняшний киносеанс в ${showing.place?.title || 'городе'}. Время и билеты смотрите на странице площадки.`,
    image: showing.movie?.poster?.image?.replace(/^http:/, 'https:'),
  }
}

