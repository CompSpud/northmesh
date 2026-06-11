import { useEffect } from 'react'

const FLASHER_PATH = '/mqtt-flasher/index.html?v=20260611-guided'

export default function FlasherPage() {
  useEffect(() => {
    window.location.replace(FLASHER_PATH)
  }, [])

  return null
}
