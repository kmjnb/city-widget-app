import type { Category, EventFilter } from '../domain/types'

export const CATEGORY_NAMES: Record<EventFilter, string> = {
  Все: 'Все',
  Концерт: 'Концерты',
  Кино: 'Кино',
  Спорт: 'Спорт',
  Детям: 'Детям',
  Другое: 'Другое',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Концерт: 'concert',
  Кино: 'cinema',
  Спорт: 'sport',
  Детям: 'kids',
  Другое: 'other',
}

export const EVENT_CATEGORIES: EventFilter[] = ['Все', 'Концерт', 'Кино', 'Спорт', 'Детям']

export const EVENT_STORAGE_KEYS = {
  favorites: 'city-widget-favorites',
  savedEvents: 'city-widget-saved-events',
} as const
