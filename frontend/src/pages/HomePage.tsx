import { Link } from 'react-router-dom'
import { Radio, Activity, Globe, Zap } from 'lucide-react'
import { useNodeStore } from '../hooks/useNodes'
import { useWebSocket } from '../hooks/useWebSocket'
import SEO, { SITE_URL } from '../components/SEO'
import styles from './HomePage.module.css'

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: number | string; label: string }) {
  return (
    <div className={styles.statCard}>
      <Icon size={24} className={styles.statIcon} />
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export default function HomePage() {
  useWebSocket()
  const { stats, isConnected } = useNodeStore()
  const discordUrl = 'https://discord.gg/gPfcajjhxP'

  return (
    <div className={styles.page}>
      <SEO
        title="NorthMesh - UK MeshCore LoRa Network Map"
        description="NorthMesh is a live MeshCore and LoRa mesh network map for northern England and the wider UK, showing repeaters, packet activity, RF coverage, and community infrastructure."
        path="/"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'NorthMesh',
            url: SITE_URL,
            description: 'Live MeshCore LoRa mesh network map, node directory, and firmware flasher for NorthMesh in the UK.',
            inLanguage: 'en-GB'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'NorthMesh',
            url: SITE_URL,
            sameAs: [discordUrl],
            areaServed: ['Northern England', 'United Kingdom'],
            knowsAbout: ['MeshCore', 'LoRa', 'mesh networking', 'repeaters', 'MQTT']
          }
        ]}
      />
      <section className={styles.hero}>
        <div className={styles.auroraBg} />
        <div className={styles.heroContent}>
          <div className={styles.logoLarge}>
            <svg width="80" height="80" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="4" fill="url(#aurora-grad-lg)"/>
              <circle cx="16" cy="16" r="7" stroke="url(#aurora-grad-lg)" strokeWidth="1" opacity="0.6"/>
              <circle cx="16" cy="16" r="11" stroke="url(#aurora-grad-lg)" strokeWidth="0.5" opacity="0.3"/>
              <circle cx="16" cy="16" r="14" stroke="url(#aurora-grad-lg)" strokeWidth="0.5" opacity="0.15"/>
              <defs>
                <linearGradient id="aurora-grad-lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e5cc"/>
                  <stop offset="50%" stopColor="#00d4ff"/>
                  <stop offset="100%" stopColor="#34f5a0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.title}>NorthMesh</h1>
          <p className={styles.tagline}>Connecting the North, One Node at a Time</p>
          <p className={styles.subtagline}>
            Real-time visualization of the MeshCore network across northern England.
            Track nodes, monitor packet flow, and explore RF coverage.
          </p>
          <div className={styles.heroCta}>
            <Link to="/map" className={styles.btnPrimary}>
              <Globe size={18} />
              View Live Map
            </Link>
            <Link to="/network" className={styles.btnSecondary}>
              <Activity size={18} />
              Network Stats
            </Link>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnDiscord}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </a>
          </div>
        </div>
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollWheel} />
          </div>
        </div>
      </section>

      <section className={styles.statsBar}>
        <div className={styles.statsContent}>
          <StatCard icon={Radio} value={stats.totalNodes} label="Total Nodes" />
          <StatCard icon={Zap} value={stats.onlineNodes} label="Online Now" />
          <StatCard icon={Activity} value={stats.packetsToday.toLocaleString()} label="Packets Today" />
          <StatCard icon={Globe} value={stats.activeLinks} label="Active Links" />
        </div>
        <div className={`${styles.connectionStatus} ${isConnected ? styles.live : ''}`}>
          <span className={styles.statusDot} />
          {isConnected ? 'Live Data' : 'Connecting...'}
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutContent}>
          <h2 className={styles.sectionTitle}>What is MeshCore?</h2>
          <p className={styles.aboutText}>
            MeshCore is a decentralized mesh networking protocol designed for resilient, 
            community-owned communication infrastructure. Operating on LoRa frequencies 
            (868 MHz), MeshCore nodes form a self-healing network that can operate 
            independently of traditional internet infrastructure.
          </p>
          <p className={styles.aboutText}>
            Each node acts as a router, forwarding packets across the network. 
            Whether you're in the heart of a city or in a remote rural area, 
            MeshCore enables direct device-to-device communication without 
            relying on centralized servers.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Radio size={24} />
              </div>
              <h3>Long Range</h3>
              <p>Up to 20km range in rural areas using LoRa modulation</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Activity size={24} />
              </div>
              <h3>Real-Time Tracking</h3>
              <p>Watch packets flow across the network as they happen</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <Globe size={24} />
              </div>
              <h3>Community Owned</h3>
              <p>Decentralized infrastructure run by volunteers</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2>Ready to Explore?</h2>
          <p>Jump into the live map and see the network in action.</p>
          <Link to="/map" className={styles.btnPrimary}>
            <Globe size={18} />
            Open Live Map
          </Link>
        </div>
      </section>
    </div>
  )
}
