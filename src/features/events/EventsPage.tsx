import { ArrowRight, CalendarDays, Heart, Search } from 'lucide-react'
import { CATEGORY_NAMES, EVENT_CATEGORIES } from '../../config/events'
import type { EventFilter, EventItem, EventsStatus } from '../../domain/types'
import { formatDate } from '../../utils/dates'
import EventGrid from './EventGrid'

type Props = {
  page: 'today' | 'events'
  cityName: string
  events: EventItem[]
  visibleEvents: EventItem[]
  status: EventsStatus
  notice: string
  category: EventFilter
  favoritesOnly: boolean
  favorites: string[]
  search: string
  sort: string
  onCategoryChange: (category: EventFilter) => void
  onFavoritesOnlyChange: (enabled: boolean) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: string) => void
  onRetry: () => void
  onToggleFavorite: (id: string) => void
  onOpenEvent: (event: EventItem) => void
}

const currentDate = formatDate(new Date()).toLocaleUpperCase('ru-RU')

export default function EventsPage(props: Props) {
  const {
    page, cityName, events, visibleEvents, status, notice, category, favoritesOnly,
    favorites, search, sort, onCategoryChange, onFavoritesOnlyChange,
    onSearchChange, onSortChange, onRetry, onToggleFavorite, onOpenEvent,
  } = props
  const countFor = (filter: EventFilter) => filter === 'Все'
    ? events.length
    : events.filter(event => event.category === filter).length

  return <section className="events-column" id="events" aria-labelledby="events-title">
    <div className="events-heading">
      <div>
        <span className="eyebrow">
          {page === 'events' ? 'ГОРОДСКАЯ АФИША' : `${cityName.toLocaleUpperCase('ru-RU')} · ${currentDate}`}
        </span>
        <h1 id="events-title">{page === 'events' ? `Куда пойти сегодня в городе ${cityName}` : 'Сегодня в городе'}</h1>
        <p>{status === 'ready' ? `${events.length} событий рядом с вами` : status === 'loading' ? 'Ищем события на сегодня…' : 'Афиша на сегодня'}</p>
      </div>
      <div className="event-tools">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input placeholder="Поиск по событиям" aria-label="Поиск по событиям" value={search} onChange={event => onSearchChange(event.target.value)} />
        </label>
        <label className="sort-field">
          <span>Сортировка</span>
          <select aria-label="Сортировка событий" value={sort} onChange={event => onSortChange(event.target.value)}>
            <option value="time">по времени</option>
            <option value="price">по цене</option>
            <option value="popular">по популярности</option>
          </select>
          <span className="select-chevron" aria-hidden="true">⌄</span>
        </label>
      </div>
    </div>
    <div className="filter-row" role="group" aria-label="Фильтр событий по категории">
      {EVENT_CATEGORIES.map(filter => <button
        key={filter}
        aria-pressed={category === filter && !favoritesOnly}
        className={`filter-chip ${category === filter && !favoritesOnly ? 'filter-active' : ''}`}
        onClick={() => { onCategoryChange(filter); onFavoritesOnlyChange(false) }}
      >
        {CATEGORY_NAMES[filter]} <span>{countFor(filter)}</span>
      </button>)}
      <button
        aria-pressed={favoritesOnly}
        className={`filter-chip favorites-chip ${favoritesOnly ? 'filter-active' : ''}`}
        onClick={() => { onFavoritesOnlyChange(!favoritesOnly); onCategoryChange('Все') }}
      >
        <Heart size={14} aria-hidden="true" /> Избранное <span>{favorites.length}</span>
      </button>
    </div>
    {status === 'loading' ? <div className="event-grid event-grid-skeleton" aria-label="Загружаем афишу">
      {Array.from({ length: 4 }, (_, index) => <div className="event-skeleton glass-card" key={index}><span /><span /><i /></div>)}
    </div> : status === 'error' ? <div className="event-api-error" role="alert">
      <CalendarDays size={25} />
      <div><strong>Не удалось загрузить афишу</strong><p>{notice || 'Проверьте подключение и попробуйте ещё раз.'}</p></div>
      <button onClick={onRetry}>Повторить <ArrowRight size={15} /></button>
    </div> : <>
      {visibleEvents.length
        ? <EventGrid events={visibleEvents} favorites={favorites} onToggleFavorite={onToggleFavorite} onOpen={onOpenEvent} />
        : <div className="no-events">
          <div>{favoritesOnly ? 'Избранное пока пусто' : search ? 'Событий по этому запросу нет' : category !== 'Все' ? 'В этой категории пока нет событий' : 'Афиша на сегодня пока пуста'}</div>
          <p>{favoritesOnly ? 'Отмечайте интересные события сердцем — они останутся здесь.' : 'Попробуйте изменить фильтр или загляните позже.'}</p>
          <button onClick={() => { onCategoryChange('Все'); onFavoritesOnlyChange(false); onSearchChange('') }}>Показать всю афишу</button>
        </div>}
      <div className="results-note">
        Показываем {visibleEvents.length} из {events.length} событий
        {events.length > 0 && <> <span>·</span> Источники: <a href="https://timepad.ru/" target="_blank" rel="noreferrer">TimePad</a> и <a href="https://kudago.com/" target="_blank" rel="noreferrer">KudaGo</a></>}
      </div>
    </>}
  </section>
}
