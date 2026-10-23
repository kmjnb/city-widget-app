export const formatDate = (date: Date) => new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
}).format(date)

export const formatDayName = (date: string, index: number) => index === 0
  ? 'Сегодня'
  : new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
    .format(new Date(`${date}T12:00:00`))
    .replace('.', '')

export const formatEventTime = (timestamp?: number, fallback?: string) => {
  if (fallback && /^\d{2}:\d{2}/.test(fallback)) return fallback.slice(0, 5)
  if (!timestamp) return 'В течение дня'

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(new Date(timestamp * 1000))
}

const formatMoscowDate = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)

export const getMoscowDayBounds = () => {
  const today = formatMoscowDate(new Date())
  const tomorrowDate = new Date(`${today}T12:00:00+03:00`)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = formatMoscowDate(tomorrowDate)

  return {
    since: Math.floor(new Date(`${today}T00:00:00+03:00`).getTime() / 1000),
    until: Math.floor(new Date(`${tomorrow}T00:00:00+03:00`).getTime() / 1000),
  }
}
