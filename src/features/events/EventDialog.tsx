import { useEffect, useRef } from 'react'
import { ArrowRight, Heart, MapPin, X } from 'lucide-react'
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../../config/events'
import type { EventItem } from '../../domain/types'

type Props = {
  event: EventItem
  favorite: boolean
  onClose: () => void
  onToggleFavorite: () => void
}

export default function EventDialog({ event, favorite, onClose, onToggleFavorite }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose()
      if (keyboardEvent.key !== 'Tab') return

      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
      const focusable = dialog ? [...dialog.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')] : []
      if (!focusable.length) return
      if (keyboardEvent.shiftKey && document.activeElement === focusable[0]) {
        keyboardEvent.preventDefault()
        focusable[focusable.length - 1]?.focus()
      } else if (!keyboardEvent.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        keyboardEvent.preventDefault()
        focusable[0]?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  return <div className="dialog-scrim" onMouseDown={event => { if (event.currentTarget === event.target) onClose() }}>
    <section className="event-dialog glass-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description">
      <button ref={closeButton} className="dialog-close" aria-label="Закрыть карточку события" onClick={onClose}><X size={18} /></button>
      <span className={`dialog-category cat-${CATEGORY_COLORS[event.category]}`}>{CATEGORY_NAMES[event.category]} · сегодня, {event.time}</span>
      <h2 id="dialog-title">{event.title}</h2><p id="dialog-description">{event.description}</p>
      <div className="dialog-venue"><span><MapPin size={14} aria-hidden="true" />{event.venue}</span><strong>{event.priceLabel}</strong></div>
      <div className="dialog-actions"><button className="dialog-favorite" onClick={onToggleFavorite}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'В избранном' : 'Добавить в избранное'}</button>{event.url && <a className="dialog-source" href={event.url} target="_blank" rel="noreferrer">На KudaGo <ArrowRight size={15} /></a>}</div>
    </section>
  </div>
}
