import { useEffect } from 'react'

const SITE_NAME = 'NorthMesh'
const SITE_URL = 'https://northmesh.co.uk'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`

type StructuredData = Record<string, unknown> | Array<Record<string, unknown>>

interface SEOProps {
  title: string
  description: string
  path?: string
  image?: string
  structuredData?: StructuredData
}

function setMeta(selector: string, attribute: 'content' | 'href', value: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null

  if (!element) {
    element = selector.startsWith('link')
      ? document.createElement('link')
      : document.createElement('meta')

    const nameMatch = selector.match(/\[name="([^"]+)"\]/)
    const propertyMatch = selector.match(/\[property="([^"]+)"\]/)
    const relMatch = selector.match(/\[rel="([^"]+)"\]/)

    if (nameMatch) element.setAttribute('name', nameMatch[1])
    if (propertyMatch) element.setAttribute('property', propertyMatch[1])
    if (relMatch) element.setAttribute('rel', relMatch[1])

    document.head.appendChild(element)
  }

  element.setAttribute(attribute, value)
}

export default function SEO({ title, description, path = '/', image = DEFAULT_IMAGE, structuredData }: SEOProps) {
  const structuredDataJson = structuredData ? JSON.stringify(structuredData) : ''

  useEffect(() => {
    const canonical = `${SITE_URL}${path}`
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

    document.title = fullTitle
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', canonical)
    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', canonical)
    setMeta('meta[property="og:image"]', 'content', image)
    setMeta('meta[property="og:type"]', 'content', 'website')
    setMeta('meta[property="og:site_name"]', 'content', SITE_NAME)
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', image)

    const existing = document.getElementById('route-structured-data')
    existing?.remove()

    if (structuredDataJson) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'route-structured-data'
      script.textContent = structuredDataJson
      document.head.appendChild(script)
    }
  }, [title, description, path, image, structuredDataJson])

  return null
}

export { SITE_NAME, SITE_URL, DEFAULT_IMAGE }
