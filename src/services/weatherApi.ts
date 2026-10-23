import type { City, Weather } from '../domain/types'

type OpenMeteoResponse = {
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    precipitation_probability: Array<number | null>
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
const isNumberArray = (value: unknown): value is number[] => Array.isArray(value) && value.every(item => typeof item === 'number')
const isOptionalNumberArray = (value: unknown): value is Array<number | null> => Array.isArray(value)
  && value.every(item => item === null || typeof item === 'number')

const isOpenMeteoResponse = (value: unknown): value is OpenMeteoResponse => {
  if (!isObject(value) || !isObject(value.current) || !isObject(value.hourly) || !isObject(value.daily)) return false
  const current = value.current
  const hourly = value.hourly
  const daily = value.daily

  return typeof current.time === 'string'
    && typeof current.temperature_2m === 'number'
    && typeof current.apparent_temperature === 'number'
    && typeof current.relative_humidity_2m === 'number'
    && typeof current.wind_speed_10m === 'number'
    && typeof current.weather_code === 'number'
    && typeof current.is_day === 'number'
    && isStringArray(hourly.time)
    && isNumberArray(hourly.temperature_2m)
    && isNumberArray(hourly.weather_code)
    && isOptionalNumberArray(hourly.precipitation_probability)
    && isStringArray(daily.time)
    && isNumberArray(daily.weather_code)
    && isNumberArray(daily.temperature_2m_max)
    && isNumberArray(daily.temperature_2m_min)
}

export const fetchWeather = async (city: City, signal?: AbortSignal): Promise<Weather> => {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    wind_speed_unit: 'ms',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto',
  })
  const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000)
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: requestSignal })
  if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`)

  const payload: unknown = await response.json()
  if (!isOpenMeteoResponse(payload)) throw new Error('Open-Meteo returned an invalid forecast')
  const data = payload
  const current = data.current
  const startIndex = Math.max(0, data.hourly.time.findIndex(time => time >= current.time))
  const hours = data.hourly.time.slice(startIndex, startIndex + 12).map((time, offset) => {
    const index = startIndex + offset
    return {
      time,
      temp: Math.round(data.hourly.temperature_2m[index]),
      code: data.hourly.weather_code[index],
      precip: data.hourly.precipitation_probability[index] ?? 0,
    }
  })
  const days = data.daily.time.map((date, index) => ({
    date,
    code: data.daily.weather_code[index],
    high: Math.round(data.daily.temperature_2m_max[index]),
    low: Math.round(data.daily.temperature_2m_min[index]),
  }))

  return {
    temp: Math.round(current.temperature_2m),
    feels: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    wind: Math.round(current.wind_speed_10m),
    code: current.weather_code,
    isDay: current.is_day === 1,
    hours,
    days,
  }
}
