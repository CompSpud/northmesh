const FLASHER_PATH = '/mqtt-flasher/index.html?v=20260611-guided'

export default function FlasherPage() {
  if (typeof window !== 'undefined') {
    window.location.replace(FLASHER_PATH)
  }

  return null
}
