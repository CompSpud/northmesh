import { useMemo, useState } from 'react'
import { Check, Copy, Cpu, ExternalLink, Radio, Search, Server, Usb } from 'lucide-react'
import styles from './FlasherPage.module.css'

type Board = {
  name: string
  family: string
  chipset: string
  flash: 'USB' | 'UF2' | 'SWD'
}

const MQTT_ADDRESS = 'mqtt.meshcore.uk'
const MQTT_PORT = '8883'
const MQTT_WS_ADDRESS = 'wss://mqtt.meshcore.uk:9001'
const FLASHER_URL = 'https://meshcore.io/flasher'
const FIRMWARE_URL = 'https://github.com/meshcore-dev/MeshCore/releases'

const BOARDS: Board[] = [
  { name: 'Heltec V4', family: 'Heltec', chipset: 'ESP32-S3 / SX1262', flash: 'USB' },
  { name: 'Heltec T114', family: 'Heltec', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Heltec T190', family: 'Heltec', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Heltec Mesh Pocket', family: 'Heltec', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Heltec Mesh Solar', family: 'Heltec', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'LilyGO T-Beam 1W', family: 'LilyGO', chipset: 'ESP32 / SX1262', flash: 'USB' },
  { name: 'LilyGO T-Beam Supreme', family: 'LilyGO', chipset: 'ESP32-S3 / SX1262', flash: 'USB' },
  { name: 'LilyGO T-Deck', family: 'LilyGO', chipset: 'ESP32-S3 / SX1262', flash: 'USB' },
  { name: 'LilyGO T-Echo', family: 'LilyGO', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'LilyGO T3S3', family: 'LilyGO', chipset: 'ESP32-S3 / SX1262', flash: 'USB' },
  { name: 'RAK4631', family: 'RAKwireless', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'RAK3401', family: 'RAKwireless', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Station G2', family: 'Station', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Station G3 ESP32', family: 'Station', chipset: 'ESP32-S3 / SX1262', flash: 'USB' },
  { name: 'Seeed Wio Tracker L1', family: 'Seeed', chipset: 'STM32WLE5', flash: 'USB' },
  { name: 'Seeed SenseCAP Solar', family: 'Seeed', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Tracker T1000-E', family: 'Seeed', chipset: 'nRF52840 / LR1110', flash: 'UF2' },
  { name: 'Nano G2 Ultra', family: 'Nano', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'ThinkNode M1', family: 'ThinkNode', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'ThinkNode M3', family: 'ThinkNode', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'ThinkNode M6', family: 'ThinkNode', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Ebyte EoRa-S3', family: 'Ebyte', chipset: 'ESP32-S3 / SX1262', flash: 'USB' },
  { name: 'MeshTiny', family: 'MeshTiny', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
  { name: 'Tiny Relay', family: 'Community', chipset: 'nRF52840 / SX1262', flash: 'UF2' },
]

function buildConfig(boardName: string) {
  return [
    `Board: ${boardName}`,
    `MQTT host: ${MQTT_ADDRESS}`,
    `MQTT port: ${MQTT_PORT}`,
    'MQTT TLS: enabled',
    `MQTT WebSocket: ${MQTT_WS_ADDRESS}`,
    'MQTT username: as issued by NorthMesh',
    'MQTT password: as issued by NorthMesh',
  ].join('\n')
}

export default function FlasherPage() {
  const [query, setQuery] = useState('')
  const [selectedBoard, setSelectedBoard] = useState(BOARDS[0])
  const [copied, setCopied] = useState(false)

  const filteredBoards = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return BOARDS

    return BOARDS.filter((board) =>
      [board.name, board.family, board.chipset].some((value) => value.toLowerCase().includes(needle)),
    )
  }, [query])

  async function copyMqttDetails() {
    await navigator.clipboard.writeText(buildConfig(selectedBoard.name))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.kicker}>MeshCore onboarding</p>
          <h1 className={styles.title}>LoRa Board Flasher</h1>
          <p className={styles.subtitle}>
            Pick a common MeshCore board, flash the correct firmware, then point it at the NorthMesh MQTT broker.
          </p>
        </div>
        <div className={styles.headerActions}>
          <a href={FLASHER_URL} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
            <Usb size={18} />
            Open Flasher
            <ExternalLink size={14} />
          </a>
          <a href={FIRMWARE_URL} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>
            Firmware
            <ExternalLink size={14} />
          </a>
        </div>
      </section>

      <section className={styles.mqttPanel}>
        <div className={styles.panelTitle}>
          <Server size={20} />
          <h2>NorthMesh MQTT</h2>
        </div>
        <div className={styles.mqttGrid}>
          <div>
            <span className={styles.label}>Host</span>
            <code>{MQTT_ADDRESS}</code>
          </div>
          <div>
            <span className={styles.label}>TLS Port</span>
            <code>{MQTT_PORT}</code>
          </div>
          <div>
            <span className={styles.label}>WebSocket</span>
            <code>{MQTT_WS_ADDRESS}</code>
          </div>
        </div>
        <button type="button" className={styles.copyButton} onClick={copyMqttDetails}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy MQTT Details'}
        </button>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.boardPanel}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search board, maker, or chipset"
            />
          </div>

          <div className={styles.boardList}>
            {filteredBoards.map((board) => (
              <button
                key={board.name}
                type="button"
                className={`${styles.boardItem} ${selectedBoard.name === board.name ? styles.selected : ''}`}
                onClick={() => setSelectedBoard(board)}
              >
                <span className={styles.boardName}>{board.name}</span>
                <span className={styles.boardMeta}>{board.family} / {board.flash}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.detailPanel}>
          <div className={styles.boardHeader}>
            <Radio size={24} />
            <div>
              <h2>{selectedBoard.name}</h2>
              <p>{selectedBoard.family}</p>
            </div>
          </div>

          <div className={styles.specGrid}>
            <div>
              <Cpu size={18} />
              <span>Chipset</span>
              <strong>{selectedBoard.chipset}</strong>
            </div>
            <div>
              <Usb size={18} />
              <span>Flash method</span>
              <strong>{selectedBoard.flash}</strong>
            </div>
          </div>

          <ol className={styles.steps}>
            <li>Open the MeshCore flasher and choose the firmware matching this board.</li>
            <li>Connect the board by USB, enter bootloader mode if needed, then flash.</li>
            <li>Set MQTT to the NorthMesh broker details above and use issued credentials.</li>
            <li>Restart the device and check the Network page for the MQTT Connected tag.</li>
          </ol>

          <pre className={styles.configPreview}>{buildConfig(selectedBoard.name)}</pre>
        </div>
      </section>
    </div>
  )
}
