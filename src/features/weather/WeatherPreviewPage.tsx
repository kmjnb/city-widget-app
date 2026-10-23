import { ArrowRight, Cloud, CloudDrizzle, CloudRain, Sun } from 'lucide-react'
import type { WeatherPreview } from '../../domain/types'
import { getSectionHref } from '../../app/routes'

const previewOptions = [
  { value: 'drizzle', label: 'Морось', icon: CloudDrizzle },
  { value: 'rain', label: 'Дождь', icon: CloudRain },
  { value: 'heavy-rain', label: 'Ливень', icon: CloudRain },
  { value: 'snow', label: 'Снег', icon: Cloud },
  { value: 'fog', label: 'Туман', icon: Cloud },
  { value: 'clear', label: 'Ясно', icon: Sun },
] as const

const previewLabels: Record<WeatherPreview, string> = {
  drizzle: 'Морось',
  rain: 'Дождь',
  'heavy-rain': 'Ливень',
  snow: 'Снегопад',
  fog: 'Туман',
  clear: 'Ясная погода',
}

type Props = {
  cityName: string
  selected: WeatherPreview
  onSelect: (weather: WeatherPreview) => void
}

export default function WeatherPreviewPage({ cityName, selected, onSelect }: Props) {
  const href = getSectionHref('weather', window.location.hostname, window.location.protocol)
  const displayName = selected === 'clear' ? 'Ясно и спокойно' : `${previewLabels[selected]} · ${cityName}`

  return <section className="weather-preview-page" aria-labelledby="weather-preview-title">
    <div className="weather-page-heading"><div><span className="eyebrow">ЛАБОРАТОРИЯ ПОГОДЫ · {cityName.toLocaleUpperCase('ru-RU')}</span><h1 id="weather-preview-title">Проверьте погодные эффекты</h1><p>Выберите состояние — анимация на экране сменится сразу.</p></div><a className="weather-back-link" href={href}>К прогнозу <ArrowRight size={15} /></a></div>
    <div className="weather-preview-layout">
      <div className="weather-test-controls glass-card" role="group" aria-label="Выбор эффекта погоды">
        {previewOptions.map(({ value, label, icon: Icon }) => <button key={value} type="button" className={`weather-test-button ${selected === value ? 'is-active' : ''}`} aria-pressed={selected === value} onClick={() => onSelect(value)}><Icon size={19} aria-hidden="true" />{label}</button>)}
      </div>
      <aside className="weather-preview-note glass-card"><span className="eyebrow">ПРЕДПРОСМОТР</span><strong>{selected === 'heavy-rain' ? 'Сильный ливень' : previewLabels[selected]}</strong><p>Это тестовая анимация. Она не меняет город, прогноз или реальные погодные данные.</p><span className="weather-preview-city">Город в шапке: {cityName}</span></aside>
    </div>
    <div className="weather-preview-stage glass-card" aria-label="Область предпросмотра эффекта погоды"><span>{displayName}</span><i className="preview-stage-orb" aria-hidden="true" /></div>
    <p className="weather-preview-motion-hint">Анимация автоматически отключается, если в системе включено уменьшение движения.</p>
  </section>
}
