import { useState, useMemo } from 'react'
import { Radio, Wifi, Activity, Clock, Filter } from 'lucide-react'
import { useNodeStore } from '../hooks/useNodes'
import { useWebSocket } from '../hooks/useWebSocket'
import SEO from '../components/SEO'
import styles from './NetworkPage.module.css'

const ROLE_LABELS: Record<number, string> = {
  1: 'ChatNode',
  2: 'Repeater',
  3: 'RoomServer',
  4: 'Sensor',
}

const ROLE_COLORS: Record<number, string> = {
  1: '#fbbf24',
  2: '#00d4ff',
  3: '#a78bfa',
  4: '#34f5a0',
}

function formatLastSeen(ts: number): string {
  if (!ts || ts <= 0) return 'Manual entry'
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function formatCoordinates(lat?: number, lon?: number): string | null {
  if (lat === undefined || lon === undefined) return null
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

function getSourceLabel(node: { is_manual?: boolean; is_mqtt_node?: boolean }): string | null {
  if (node.is_mqtt_node) return 'MQTT Connected'
  if (node.is_manual) return 'Manually Added'
  return null
}

function getSourceClassName(node: { is_manual?: boolean; is_mqtt_node?: boolean }): string {
  return node.is_mqtt_node ? styles.mqttTag : styles.manualTag
}

export default function NetworkPage() {
  useWebSocket()
  const { nodes, stats } = useNodeStore()
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'lastSeen' | 'role'>('name')

  const filteredNodes = useMemo(() => {
    let result = Array.from(nodes.values())

    if (filter === 'online') result = result.filter((n) => n.is_online)
    if (filter === 'offline') result = result.filter((n) => !n.is_online)
    if (roleFilter !== 'all') result = result.filter((n) => n.role === roleFilter)

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'lastSeen') return b.last_seen - a.last_seen
      if (sortBy === 'role') return (a.role ?? 0) - (b.role ?? 0)
      return 0
    })

    return result
  }, [nodes, filter, roleFilter, sortBy])

  return (
    <div className={styles.page}>
      <SEO
        title="MeshCore Network Stats"
        description="View NorthMesh MeshCore network statistics, repeater status, active nodes, packet counts, roles, hardware models, and last-seen data for the UK LoRa mesh."
        path="/network"
      />
      <div className={styles.header}>
        <h1 className={styles.title}>Network Overview</h1>
        <p className={styles.subtitle}>Detailed statistics and node management</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Radio size={24} className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.totalNodes}</span>
            <span className={styles.statLabel}>Total Nodes</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Wifi size={24} className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.onlineNodes}</span>
            <span className={styles.statLabel}>Online Now</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Activity size={24} className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.packetsToday.toLocaleString()}</span>
            <span className={styles.statLabel}>Packets Today</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Clock size={24} className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.activeLinks}</span>
            <span className={styles.statLabel}>Active Links</span>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <Filter size={16} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className={styles.select}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className={styles.select}
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>{label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={styles.select}
          >
            <option value="name">Sort by Name</option>
            <option value="lastSeen">Sort by Last Seen</option>
            <option value="role">Sort by Role</option>
          </select>
        </div>
        <span className={styles.resultCount}>
          {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.nodeList}>
        {filteredNodes.map((node) => {
          const coordinates = formatCoordinates(node.lat, node.lon)
          const sourceLabel = getSourceLabel(node)

          return (
          <div key={node.node_id} className={styles.nodeCard}>
            <div className={styles.nodeMain}>
              <div className={styles.nodeHeader}>
                <span
                  className={styles.roleBadge}
                  style={{ background: ROLE_COLORS[node.role ?? 0] || '#6b7280' }}
                >
                  {ROLE_LABELS[node.role ?? 0] || 'Unknown'}
                </span>
                <span className={styles.nodeName}>{node.name}</span>
                <span className={`${styles.statusDot} ${node.is_online ? styles.online : ''}`} />
              </div>
              <div className={styles.nodeMeta}>
                {sourceLabel && (
                  <span className={`${styles.metaItem} ${styles.sourceTag} ${getSourceClassName(node)}`}>
                    {sourceLabel}
                  </span>
                )}
                <span className={styles.metaItem}>
                  <Clock size={12} />
                  {formatLastSeen(node.last_seen)}
                </span>
                {coordinates && (
                  <span className={`${styles.metaItem} ${styles.locationTag}`}>
                    {coordinates}
                  </span>
                )}
                {node.model && (
                  <span className={styles.metaItem}>{node.model}</span>
                )}
              </div>
            </div>
            <div className={styles.nodeStats}>
              {node.stats?.uptime_secs && (
                <div className={styles.nodeStat}>
                  <span className={styles.nodeStatValue}>
                    {Math.floor(node.stats.uptime_secs / 3600)}h
                  </span>
                  <span className={styles.nodeStatLabel}>Uptime</span>
                </div>
              )}
            </div>
            <div className={styles.nodeKey}>
              <code>{node.node_id.slice(0, 16)}...</code>
            </div>
          </div>
          )
        })}

        {filteredNodes.length === 0 && (
          <div className={styles.emptyState}>
            <Radio size={48} />
            <h3>No nodes found</h3>
            <p>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
