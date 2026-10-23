import type { CSSProperties } from 'react'
import type { WeatherEffect } from '../domain/types'

const rainParticles = Array.from({ length: 60 }, (_, index) => ({
  left: (index * 37 + 9) % 100,
  delay: ((index * 13) % 31) / 10,
  duration: 0.55 + ((index * 17) % 85) / 100,
  size: 11 + ((index * 7) % 17),
  opacity: 0.19 + ((index * 11) % 30) / 100,
}))

const snowParticles = Array.from({ length: 26 }, (_, index) => ({
  left: (index * 43 + 13) % 100,
  delay: ((index * 19) % 150) / 10,
  duration: 7 + ((index * 23) % 100) / 10,
  size: 3 + ((index * 7) % 6),
  opacity: 0.25 + ((index * 13) % 55) / 100,
}))

type Props = {
  effect: WeatherEffect
  intensity: 'light' | 'medium' | 'heavy'
}

export default function WeatherEffects({ effect, intensity }: Props) {
  if (!effect) return null

  const dropCount = intensity === 'heavy' ? 60 : intensity === 'light' ? 25 : 42

  return <div className={`weather-effects effects-${effect} ${effect === 'rain' ? `rain-${intensity}` : ''}`} aria-hidden="true">
    {effect === 'rain' && rainParticles.slice(0, dropCount).map((drop, index) => {
      const style: CSSProperties = {
        left: `${drop.left}%`,
        animationDelay: `-${drop.delay}s`,
        animationDuration: `${drop.duration}s`,
        height: `${drop.size}px`,
        opacity: Math.min(0.72, drop.opacity * (intensity === 'light' ? 0.65 : intensity === 'heavy' ? 1.2 : 1)),
      }
      return <i key={`rain-${index}`} className="weather-drop" style={style} />
    })}
    {effect === 'snow' && snowParticles.map((flake, index) => {
      const style: CSSProperties = {
        left: `${flake.left}%`,
        animationDelay: `-${flake.delay}s`,
        animationDuration: `${flake.duration}s`,
        width: `${flake.size}px`,
        height: `${flake.size}px`,
        opacity: flake.opacity,
      }
      return <i key={`snow-${index}`} className="weather-flake" style={style} />
    })}
    {effect === 'fog' && <>
      <i className="weather-fog-wisp fog-wisp-one" />
      <i className="weather-fog-wisp fog-wisp-two" />
      <i className="weather-fog-wisp fog-wisp-three" />
    </>}
  </div>
}
