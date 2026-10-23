import { ArrowRight, CloudDrizzle, Wind } from 'lucide-react'
import type { Weather } from '../../domain/types'
import { getSectionHref } from '../../app/routes'
import { formatDayName } from '../../utils/dates'
import { describeWeather, WeatherIcon, formatTemperature, getWeatherEffect } from '../../utils/weather'

type Props = {
  cityName: string
  weather: Weather | null
  loading: boolean
  error: boolean
  onRetry: () => void
}

export default function WeatherPage({ cityName, weather, loading, error, onRetry }: Props) {
  const href = (section: 'today' | 'weather' | 'weather-preview') => getSectionHref(section, window.location.hostname, window.location.protocol)

  return <section className="weather-page" aria-labelledby="weather-page-title">
    <div className="weather-page-heading">
      <div>
        <span className="eyebrow">ПОГОДА · {cityName.toLocaleUpperCase('ru-RU')}</span>
        <h1 id="weather-page-title">День на вашей стороне</h1>
        <p>Прогноз по часам и на пять дней — чтобы выбрать время для прогулки.</p>
      </div>
      <div className="weather-page-actions">
        <a className="weather-back-link" href={href('today')}>Вернуться к планам <ArrowRight size={15} /></a>
        <a className="weather-back-link weather-preview-link" href={href('weather-preview')} target="_blank" rel="noreferrer">Проверить анимации <ArrowRight size={15} /></a>
      </div>
    </div>
    {loading ? <div className="weather-page-loading glass-card" role="status">Загружаем актуальный прогноз…</div>
      : error || !weather ? <div className="weather-page-loading glass-card" role="alert"><span>Не удалось получить прогноз для {cityName}.</span><button onClick={onRetry}>Повторить</button></div>
        : <>
          <div className={`weather-scene glass-card ${getWeatherEffect(weather.code) === 'rain' ? 'scene-rain' : weather.code >= 1 ? 'scene-clouds' : 'scene-clear'} ${weather.isDay ? 'scene-day' : 'scene-night'}`}>
            <div className="scene-atmosphere" aria-hidden="true">
              <span className="scene-orb" />
              <span className="scene-cloud scene-cloud-one" />
              <span className="scene-cloud scene-cloud-two" />
              <span className="scene-rain-lines" />
            </div>
            <div className="scene-content">
              <span className="scene-kicker">СЕЙЧАС В ГОРОДЕ</span>
              <h2>{cityName}</h2>
              <div className="scene-current"><strong>{formatTemperature(weather.temp)}</strong><span><WeatherIcon code={weather.code} size={38} /></span></div>
              <p>{describeWeather(weather.code)} <span>·</span> ощущается как {weather.feels}°</p>
              <div className="scene-stats">
                <span><Wind size={15} /> {weather.wind} м/с</span>
                <span><CloudDrizzle size={15} /> Влажность {weather.humidity}%</span>
              </div>
            </div>
            <div className="scene-side-note">Погода обновляется<br />по данным Open-Meteo</div>
          </div>
          <section className="hourly-section" aria-labelledby="hourly-title">
            <div className="weather-section-title">
              <div><span className="eyebrow">БЛИЖАЙШИЕ 12 ЧАСОВ</span><h2 id="hourly-title">Как меняется погода</h2></div>
              <span className="hourly-hint">Температура и вероятность осадков</span>
            </div>
            <div className="hourly-forecast glass-card">
              {weather.hours.map((hour, index) => <article className="hourly-item" key={hour.time}>
                <span className="hour-label">{index === 0 ? 'Сейчас' : hour.time.slice(-5)}</span>
                <span className="hour-icon"><WeatherIcon code={hour.code} size={19} /></span>
                <strong>{hour.temp}°</strong>
                <span className="precip-track" title={`Осадки: ${hour.precip}%`}><i style={{ height: `${Math.max(4, hour.precip)}%` }} /></span>
                <span className="precip-label">{hour.precip}%</span>
              </article>)}
            </div>
          </section>
          <section className="weather-week-section" aria-labelledby="weather-week-title">
            <div className="weather-section-title">
              <div><span className="eyebrow">ВПЕРЁДИ</span><h2 id="weather-week-title">Прогноз на 5 дней</h2></div>
              <span className="hourly-hint">Максимум и минимум за день</span>
            </div>
            <div className="weather-week-grid">
              {weather.days.map((day, index) => <article className="weather-week-card glass-card" key={day.date}>
                <span>{formatDayName(day.date, index)}</span>
                <div><WeatherIcon code={day.code} size={24} /></div>
                <strong>{day.high}°</strong>
                <span className="week-low">{day.low}°</span>
                <small>{describeWeather(day.code)}</small>
              </article>)}
            </div>
          </section>
        </>}
  </section>
}
