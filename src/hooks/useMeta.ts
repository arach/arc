import { useEffect } from 'react'

interface MetaProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

const BASE_URL = 'https://arc.jdi.sh'

export function useMeta({ title, description, image, url }: MetaProps) {
  useEffect(() => {
    // Store original values to restore on unmount
    const originalTitle = document.title
    const getMetaContent = (property: string) => {
      const el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      return el?.content
    }

    const originals = {
      'og:title': getMetaContent('og:title'),
      'og:description': getMetaContent('og:description'),
      'og:image': getMetaContent('og:image'),
      'og:url': getMetaContent('og:url'),
      'twitter:title': getMetaContent('twitter:title'),
      'twitter:description': getMetaContent('twitter:description'),
      'twitter:image': getMetaContent('twitter:image'),
      'twitter:url': getMetaContent('twitter:url'),
    }

    // Update meta tags
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.content = content
    }

    if (title) {
      document.title = title
      setMeta('og:title', title)
      setMeta('twitter:title', title)
    }

    if (description) {
      setMeta('og:description', description)
      setMeta('twitter:description', description)
      // Also update the regular description meta
      const descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement
      if (descEl) descEl.content = description
    }

    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`
      setMeta('og:image', fullImageUrl)
      setMeta('twitter:image', fullImageUrl)
    }

    if (url) {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      setMeta('og:url', fullUrl)
      setMeta('twitter:url', fullUrl)
    }

    // Cleanup: restore original values on unmount
    return () => {
      document.title = originalTitle
      Object.entries(originals).forEach(([property, content]) => {
        if (content) {
          const el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
          if (el) el.content = content
        }
      })
    }
  }, [title, description, image, url])
}
