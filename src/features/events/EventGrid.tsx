import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, MapPin } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../../config/events'
import type { EventItem } from '../../domain/types'

type Props = {
  events: EventItem[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onOpen: (event: EventItem) => void
}

export default function EventGrid({ events, favorites, onToggleFavorite, onOpen }: Props) {
  const viewport = useRef<HTMLDivElement>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 0 })

  const updateControls = useCallback(() => {
    const element = viewport.current
    if (!element) return

    const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth)
    const firstCard = element.firstElementChild as HTMLElement | null
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0
    const cardStep = firstCard ? firstCard.getBoundingClientRect().width + gap : element.clientWidth
    const cardsPerPage = Math.max(1, Math.round(element.clientWidth / cardStep))
    const start = Math.min(events.length, Math.floor((element.scrollLeft + 2) / Math.max(1, element.clientWidth)) * cardsPerPage + 1)

    setCanGoBack(element.scrollLeft > 2)
    setCanGoForward(element.scrollLeft < maxScroll - 2)
    setVisibleRange({ start, end: Math.min(events.length, start + cardsPerPage - 1) })
  }, [events.length])

  useEffect(() => {
    const element = viewport.current
    if (!element) return

    element.scrollTo({ left: 0 })
    updateControls()
    const observer = new ResizeObserver(updateControls)
    observer.observe(element)
    return () => observer.disconnect()
  }, [events.map(event => event.id).join('|'), updateControls])

  const move = (direction: -1 | 1) => {
    const element = viewport.current
    if (element) element.scrollBy({ left: direction * element.clientWidth, behavior: 'smooth' })
  }

  return <section className="event-carousel" aria-label="События на сегодня">
    <div className="carousel-controls">
      <span className="carousel-count" aria-live="polite">
        {visibleRange.end > 0 ? `${visibleRange.start}–${visibleRange.end} из ${events.length}` : `${events.length} событий`}
      </span>
      <div className="carousel-arrows">
        <button type="button" aria-label="Предыдущие события" onClick={() => move(-1)} disabled={!canGoBack}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Следующие события" onClick={() => move(1)} disabled={!canGoForward}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
    <div className="event-grid" ref={viewport} onScroll={updateControls}>
      {events.map(event => {
        const favorite = favorites.includes(event.id)

        return <article className="event-tile glass-card" key={event.id}>
          <div className="tile-meta">
            <div>
              <strong>{event.time}</strong>
              <span className={`category-dot dot-${CATEGORY_COLORS[event.category]}`} />
              <span className="tile-category">{CATEGORY_NAMES[event.category]}</span>
            </div>
            <button
              className={`tile-heart ${favorite ? 'is-favorite' : ''}`}
              aria-label={favorite ? `Убрать «${event.title}» из избранного` : `Добавить «${event.title}» в избранное`}
              onClick={() => onToggleFavorite(event.id)}
            >
              <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          <button className="event-open" onClick={() => onOpen(event)} aria-label={`Подробнее о событии: ${event.title}`}>
            <h2>{event.title}</h2>
            <p className="tile-venue">
              <MapPin size={12} aria-hidden="true" />{event.venue} <span>·</span> {event.priceLabel}
            </p>
          </button>
        </article>
      })}
    </div>
  </section>
}
