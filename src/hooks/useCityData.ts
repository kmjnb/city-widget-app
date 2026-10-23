import { useEffect, useState } from 'react'
import type { City, EventItem, EventsStatus, Weather } from '../domain/types'
import { fetchEvents } from '../services/eventsApi'
import { fetchWeather } from '../services/weatherApi'

const getErrorMessage = (error: unknown) => error instanceof Error
  ? error.message
  : 'Не удалось загрузить афишу. Попробуйте ещё раз.'

export const useCityData = (city: City, enabled: boolean) => {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherError, setWeatherError] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventsStatus, setEventsStatus] = useState<EventsStatus>('loading')
  const [eventsNotice, setEventsNotice] = useState('')

  useEffect(() => {
    if (!enabled) return

    let active = true
    const controller = new AbortController()
    const loadWeather = async (background = false) => {
      if (!background) {
        setWeather(null)
        setWeatherLoading(true)
        setWeatherError(false)
      }

      try {
        const result = await fetchWeather(city, controller.signal)
        if (active) setWeather(result)
      } catch {
        if (active && !background) setWeatherError(true)
      } finally {
        if (active && !background) setWeatherLoading(false)
      }
    }

    const loadEvents = async () => {
      setEventsStatus('loading')
      setEventsNotice('')
      try {
        const result = await fetchEvents(city)
        if (!active) return
        setEvents(result.items)
        setEventsStatus(result.status)
        setEventsNotice(result.notice)
      } catch (error) {
        if (!active) return
        setEvents([])
        setEventsStatus('error')
        setEventsNotice(getErrorMessage(error))
      }
    }

    void loadWeather()
    void loadEvents()
    const refreshTimer = window.setInterval(() => void loadWeather(true), 20 * 60 * 1000)

    return () => {
      active = false
      controller.abort()
      window.clearInterval(refreshTimer)
    }
  }, [city, enabled])

  const reloadEvents = async () => {
    setEventsStatus('loading')
    setEventsNotice('')
    try {
      const result = await fetchEvents(city)
      setEvents(result.items)
      setEventsStatus(result.status)
      setEventsNotice(result.notice)
    } catch (error) {
      setEvents([])
      setEventsStatus('error')
      setEventsNotice(getErrorMessage(error))
    }
  }

  const reloadWeather = async () => {
    setWeatherLoading(true)
    setWeatherError(false)
    try {
      setWeather(await fetchWeather(city))
    } catch {
      setWeatherError(true)
    } finally {
      setWeatherLoading(false)
    }
  }

  return {
    weather,
    weatherError,
    weatherLoading,
    events,
    eventsStatus,
    eventsNotice,
    reloadEvents,
    reloadWeather,
  }
}
