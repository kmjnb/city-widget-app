import { ArrowRight, Heart, MapPin, Sun } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../../config/events'
import type { EventItem, Weather } from '../../domain/types'
import { getSectionHref } from '../../app/routes'
import { describeWeather, WeatherIcon } from '../../utils/weather'

type Props = {
  cityName: string
  weather: Weather | null
  outfitTip: string
  events: EventItem[]
  onToggleFavorite: (id: string) => void
  onOpenEvent: (event: EventItem) => void
}

export default function PlanPage({ cityName, weather, outfitTip, events, onToggleFavorite, onOpenEvent }: Props) {
  const eventsHref = getSectionHref('events', window.location.hostname, window.location.protocol)

  return <section className="plan-page" aria-labelledby="plan-title">
    <div className="page-intro">
      <div>
        <span className="eyebrow">ВАШ ГОРОДСКОЙ СПИСОК</span>
        <h1 id="plan-title">Мой план</h1>
        <p>Сохранённые события — соберите из них удобный вечер.</p>
      </div>
      <a className="primary-link" href={eventsHref}>Найти событие <ArrowRight size={16} /></a>
    </div>
    <div className="plan-weather glass-card">
      <span className="plan-weather-icon">
        {weather ? <WeatherIcon code={weather.code} size={23} /> : <Sun size={23} aria-hidden="true" />}
      </span>
      <div>
        <strong>{weather ? `${weather.feels}° · ${describeWeather(weather.code)}` : 'Погода загружается'}</strong>
        <p>{outfitTip}</p>
      </div>
      <span className="plan-city">{cityName}</span>
    </div>
    {events.length ? <>
      <div className="plan-summary"><strong>{events.length} {events.length === 1 ? 'событие' : 'событий'} в плане</strong><span>Список хранится на этом устройстве</span></div>
      <div className="event-grid plan-grid">
        {events.map(event => <article className="event-tile glass-card" key={event.id}>
          <div className="tile-meta">
            <div>
              <strong>{event.time}</strong>
              <span className={`category-dot dot-${CATEGORY_COLORS[event.category]}`} />
              <span className="tile-category">{CATEGORY_NAMES[event.category]}</span>
            </div>
            <button className="tile-heart is-favorite" aria-label={`Убрать «${event.title}» из плана`} onClick={() => onToggleFavorite(event.id)}>
              <Heart size={19} fill="currentColor" />
            </button>
          </div>
          <button className="event-open" onClick={() => onOpenEvent(event)}>
            <h2>{event.title}</h2>
            <p className="tile-venue"><MapPin size={12} aria-hidden="true" />{event.venue} <span>·</span> {event.priceLabel}</p>
          </button>
        </article>)}
      </div>
    </> : <div className="plan-empty glass-card">
      <span className="plan-empty-icon"><Heart size={23} /></span>
      <h2>Пока план пустой</h2>
      <p>Нажмите на сердечко у события, которое вам понравилось. Здесь появится расписание и место проведения.</p>
      <a className="primary-link" href={eventsHref}>Открыть афишу <ArrowRight size={16} /></a>
    </div>}
  </section>
}
