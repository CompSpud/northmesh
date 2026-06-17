import { useEffect } from 'react'
import SEO, { SITE_URL } from '../components/SEO'

const FLASHER_PATH = '/mqtt-flasher/index.html?v=20260611-guided'

export default function FlasherPage() {
  useEffect(() => {
    window.location.replace(FLASHER_PATH)
  }, [])

  return (
    <SEO
      title="MeshCore MQTT Repeater Flasher"
      description="Flash MeshCore repeater firmware for NorthMesh-supported LoRa boards, then apply WiFi, radio, and MQTT settings from the browser."
      path="/flasher"
      structuredData={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'NorthMesh MQTT Repeater Flasher',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Chrome, Edge, Chromium browsers with Web Serial',
        url: `${SITE_URL}/flasher`,
        description: 'Browser-based MeshCore repeater flasher and NorthMesh MQTT configuration utility.'
      }}
    />
  )
}
