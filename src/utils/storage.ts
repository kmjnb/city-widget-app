import type { EventItem } from '../domain/types'

const readJson = <T,>(key: string, fallback: T, isValid: (value: unknown) => value is T): T => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || 'null')
    return isValid(value) ? value : fallback
  } catch {
    return fallback
  }
}

export const readFavorites = (key: string) => readJson<unknown[]>(key, [], Array.isArray)
  .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
  .map(String)

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isEvent = (value: unknown): value is EventItem => isObject(value)
  && typeof value.id === 'string'
  && typeof value.title === 'string'
  && ['Концерт', 'Кино', 'Спорт', 'Детям', 'Другое'].includes(String(value.category))
  && typeof value.time === 'string'
  && typeof value.venue === 'string'
  && (value.price === null || typeof value.price === 'number')
  && typeof value.priceLabel === 'string'
  && typeof value.popularity === 'number'
  && typeof value.description === 'string'
  && (value.image === undefined || typeof value.image === 'string')
  && (value.url === undefined || typeof value.url === 'string')

const isEventList = (value: unknown): value is EventItem[] => Array.isArray(value) && value.every(isEvent)

export const readSavedEvents = (key: string) => readJson<EventItem[]>(key, [], isEventList)

export const readTheme = () => localStorage.getItem('city-widget-theme') === 'dark' ? 'dark' : 'light'
