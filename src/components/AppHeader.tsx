import { Moon, Sun } from 'lucide-react'
import type { AppPage, City } from '../domain/types'
import { getSectionHref } from '../app/routes'
import brandMark from '../assets/city-widget-mark.png'

type Props = {
  page: AppPage
  city: City
  cities: City[]
  theme: 'light' | 'dark'
  favoriteCount: number
  onCityChange: (city: City) => void
  onThemeChange: () => void
}

export default function AppHeader({ page, city, cities, theme, favoriteCount, onCityChange, onThemeChange }: Props) {
  const href = (section: AppPage) => getSectionHref(section, window.location.hostname, window.location.protocol)

  return <header className="widget-header">
    <a className="wordmark" href={href('today')}><img className="wordmark-logo" src={brandMark} alt="" />City Widget</a>
    <nav className="main-nav" aria-label="Разделы сайта">
      <a className={page === 'today' ? 'nav-active' : ''} href={href('today')}>Сегодня</a>
      <a className={page === 'events' ? 'nav-active' : ''} href={href('events')}>Афиша</a>
      <a className={page === 'weather' || page === 'weather-preview' ? 'nav-active' : ''} href={href('weather')}>Погода</a>
      <a className={page === 'plan' ? 'nav-active' : ''} href={href('plan')}>Мой план{favoriteCount > 0 && <span className="nav-count">{favoriteCount}</span>}</a>
    </nav>
    <div className="header-tools">
      <div className="city-switch" role="group" aria-label="Выберите город">
        {cities.map(item => <button key={item.slug} className={item.slug === city.slug ? 'city-active' : ''} aria-pressed={item.slug === city.slug} onClick={() => onCityChange(item)}>{item.name}</button>)}
      </div>
      <button className="theme-button" aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'} onClick={onThemeChange}>
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </div>
  </header>
}
