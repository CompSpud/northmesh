import { ExternalLink, Server, Usb } from 'lucide-react'
import styles from './FlasherPage.module.css'

const FLASHER_PATH = '/mqtt-flasher/index.html?v=20260611-serial-lock'

export default function FlasherPage() {
  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.kicker}>NorthMesh onboarding</p>
          <h1 className={styles.title}>MQTT Repeater Flasher</h1>
          <p className={styles.subtitle}>
            Flash MQTT-ready MeshCore repeater firmware, then apply WiFi and NorthMesh broker settings over serial.
          </p>
        </div>
        <a href={FLASHER_PATH} target="_blank" rel="noopener noreferrer" className={styles.openButton}>
          <Usb size={18} />
          Open Full Screen
          <ExternalLink size={14} />
        </a>
      </section>

      <section className={styles.brokerBar}>
        <div className={styles.brokerItem}>
          <Server size={16} />
          <span>Broker</span>
          <code>wss://mqtt.northmesh.co.uk:443/</code>
        </div>
        <div className={styles.brokerItem}>
          <span>Topic</span>
          <code>meshcore/uk/&lt;public-key&gt;/packets</code>
        </div>
      </section>

      <section className={styles.frameShell}>
        <iframe
          src={FLASHER_PATH}
          title="NorthMesh MQTT repeater flasher"
          className={styles.flasherFrame}
          allow="serial; usb"
        />
      </section>
    </div>
  )
}
