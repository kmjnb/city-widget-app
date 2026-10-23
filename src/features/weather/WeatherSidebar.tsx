import type { Weather } from '../../domain/types'
import { formatDayName } from '../../utils/dates'
import { describeWeather, WeatherIcon, formatTemperature } from '../../utils/weather'

type Props = {
  cityName: string
  weather: Weather | null
  loading: boolean
  error: boolean
  onRetry: () => void
}

export default function WeatherSidebar({ cityName, weather, loading, error, onRetry }: Props) {
  const low = weather ? Math.min(...weather.days.map(day => day.low)) : 0
  const high = weather ? Math.max(...weather.days.map(day => day.high)) : 0
  const temperatureRange = Math.max(1, high - low)

  return <aside className="weather-column" aria-label={`Погода в городе ${cityName}`}>
    <section className="current-weather glass-card">
      <div className="weather-card-city">{cityName}</div>
      {loading ? <div className="weather-wait" aria-label="Загружаем погоду"><i /><i /><i /></div>
        : error ? <div className="weather-failure" role="alert"><p>Не удалось загрузить погоду</p><button onClick={onRetry}>Повторить</button></div>
          : weather && <>
            <div className="weather-summary">
              <div>
                <div className="current-temp">{formatTemperature(weather.temp)}</div>
                <div className="weather-description">{describeWeather(weather.code)}</div>
              </div>
              <div className="hero-weather-icon" aria-hidden="true"><WeatherIcon code={weather.code} size={62} /></div>
            </div>
            <div className="day-extremes">Макс. {weather.days[0]?.high}° · Мин. {weather.days[0]?.low}°</div>
            <div className="weather-metrics">
              <div><span>ОЩУЩАЕТСЯ</span><strong>{weather.feels}°</strong></div>
              <div><span>ВЛАЖНОСТЬ</span><strong>{weather.humidity}%</strong></div>
              <div><span>ВЕТЕР</span><strong>{weather.wind} м/с</strong></div>
            </div>
          </>}
    </section>
    <section className="forecast-card glass-card" aria-label="Прогноз погоды на пять дней">
      <div className="forecast-heading">ПРОГНОЗ НА 5 ДНЕЙ</div>
      {loading ? <div className="forecast-loading" role="status">Загружаем прогноз…</div>
        : error ? <div className="forecast-loading">Нет данных о прогнозе.</div>
          : weather?.days.map((day, index) => {
            const left = (day.low - low) / temperatureRange * 100
            const width = Math.max(12, (day.high - day.low) / temperatureRange * 100)
            return <div className="forecast-row" key={day.date}>
              <span className="forecast-day-name">{formatDayName(day.date, index)}</span>
              <span className="forecast-condition" aria-label={describeWeather(day.code)}><WeatherIcon code={day.code} size={17} /></span>
              <span className="forecast-low">{day.low}°</span>
              <span className="temp-track" aria-hidden="true"><i style={{ left: `${left}%`, width: `${width}%` }} /></span>
              <strong className="forecast-high">{day.high}°</strong>
            </div>
          })}
    </section>
  </aside>
}
