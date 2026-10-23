import { ArrowRight, Sun, Ticket, Wind } from 'lucide-react'
import type { EventItem, EventsStatus, Weather } from '../../domain/types'
import { WeatherIcon } from '../../utils/weather'

type Props = {
  weather: Weather | null
  outfitTip: string
  eventsStatus: EventsStatus
  featuredEvent?: EventItem
  freeCount: number
  earliestEvent?: EventItem
  onOpenEvent: (event: EventItem) => void
}

export default function CityNotes({ weather, outfitTip, eventsStatus, featuredEvent, freeCount, earliestEvent, onOpenEvent }: Props) {
  return <section className="city-notes" id="city-notes" aria-labelledby="notes-title">
    <div className="notes-heading">
      <div><span className="eyebrow">ВАШИ ОРИЕНТИРЫ НА ДЕНЬ</span><h2 id="notes-title">Из прогноза — в понятный план</h2></div>
      <p>Коротко о главном, чтобы быстрее решить, что надеть и куда пойти</p>
    </div>
    <div className="notes-grid">
      <article
        className="focus-card glass-card"
      >
        <div className="focus-copy">
          <span className="focus-label"><span />ИДЕЯ НА СЕГОДНЯ</span>
          <h3>{featuredEvent?.title || (eventsStatus === 'loading' ? 'Подбираем событие дня' : 'Планы появятся здесь')}</h3>
          <p>{featuredEvent ? `${featuredEvent.time} · ${featuredEvent.venue}` : eventsStatus === 'error' ? 'Афиша временно недоступна. Повторите загрузку в списке событий.' : 'Сохраните понравившееся событие — оно останется в вашем плане.'}</p>
          {featuredEvent && <button onClick={() => onOpenEvent(featuredEvent)}>Подробнее <ArrowRight size={15} /></button>}
        </div>
        <div className="focus-symbol" aria-hidden="true">✳</div>
      </article>
      <article className="note-card glass-card">
        <span className="note-icon weather-note-icon">{weather ? <WeatherIcon code={weather.code} size={20} /> : <Sun size={20} aria-hidden="true" />}</span>
        <span className="note-label">ЧТО НАДЕТЬ</span>
        <strong>{weather ? `${weather.feels}° по ощущениям` : 'Проверяем прогноз'}</strong>
        <p>{outfitTip}</p>
      </article>
      <article className="note-card glass-card">
        <span className="note-icon free-note-icon"><Ticket size={19} /></span>
        <span className="note-label">БЮДЖЕТ ВЕЧЕРА</span>
        <strong>{eventsStatus === 'ready' ? `${freeCount} бесплатно` : eventsStatus === 'error' ? 'Афиша недоступна' : 'Загрузка афиши'}</strong>
        <p>{eventsStatus === 'error' ? 'Попробуйте обновить список событий.' : freeCount ? 'В афише есть варианты без платы за вход.' : 'Сравните стоимость в карточках событий.'}</p>
      </article>
      <article className="note-card glass-card">
        <span className="note-icon time-note-icon"><Wind size={19} /></span>
        <span className="note-label">ПЕРВЫЙ ВАРИАНТ</span>
        <strong>{earliestEvent?.time || 'Сегодня'}</strong>
        <p>{earliestEvent ? earliestEvent.title : 'Посмотрите афишу и сохраните идеи.'}</p>
      </article>
    </div>
  </section>
}
