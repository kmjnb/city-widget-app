import { Cloud, CloudDrizzle, CloudRain, CloudSun, Sun } from 'lucide-react'
import type { WeatherEffect } from '../domain/types'

export const formatTemperature = (temperature: number) => `${temperature}°`

export const WeatherIcon = ({ code, size = 21 }: { code: number; size?: number }) => {
  if (code === 0) return <Sun size={size} />
  if (code <= 2) return <CloudSun size={size} />
  if (code <= 3) return <Cloud size={size} />
  if (code >= 51 && code <= 67) return <CloudDrizzle size={size} />
  return <CloudRain size={size} />
}

export const getWeatherEffect = (code: number): WeatherEffect => {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code === 45 || code === 48) return 'fog'
  return null
}

export const describeWeather = (code: number) => {
  if (code === 0) return 'Ясно'
  if (code === 1) return 'Преимущественно ясно'
  if (code === 2) return 'Переменная облачность'
  if (code === 3) return 'Облачно'
  if (code === 45 || code === 48) return 'Туман'
  if (code >= 51 && code <= 57) return 'Морось'
  if (code >= 61 && code <= 67) return 'Дождь'
  if (code >= 71 && code <= 77) return 'Снег'
  if (code >= 80 && code <= 82) return 'Ливень'
  if (code === 85 || code === 86) return 'Снегопад'
  if (code >= 95) return 'Гроза'
  return 'Пасмурно'
}
