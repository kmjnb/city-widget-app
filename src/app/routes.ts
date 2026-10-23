import type { AppPage } from '../domain/types'

export const getCurrentPage = (pathname: string, hostname: string): AppPage => {
  if (pathname.startsWith('/weather-preview')) return 'weather-preview'
  if (pathname.startsWith('/weather')) return 'weather'
  if (pathname.startsWith('/today')) return 'today'
  if (hostname.startsWith('afisha.') || pathname.startsWith('/afisha')) return 'events'
  if (hostname.startsWith('plan.') || pathname.startsWith('/plan')) return 'plan'
  return 'today'
}

export const getSectionHref = (section: AppPage, hostname: string, protocol: string) => {
  const localHost = hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  if (localHost) return section === 'today' ? '/' : `/${section === 'events' ? 'afisha' : section}`

  const rootHost = hostname.replace(/^(www|afisha|plan)\./, '')
  const root = `${protocol}//afisha.${rootHost}`
  if (section === 'today') return `${root}/today`
  if (section === 'weather' || section === 'weather-preview') return `${root}/${section}`
  if (section === 'events') return `${root}/`
  return `${protocol}//plan.${rootHost}/`
}
