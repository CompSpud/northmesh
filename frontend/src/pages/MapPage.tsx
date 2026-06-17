import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useNodeStore, Node } from '../hooks/useNodes'
import { useWebSocket } from '../hooks/useWebSocket'
import { Layers, Info, X, Maximize2 } from 'lucide-react'
import SEO from '../components/SEO'
import styles from './MapPage.module.css'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const DEFAULT_CENTER: [number, number] = [-2.0, 54.5]
const DEFAULT_ZOOM = 6

const ROLE_COLORS: Record<number, string> = {
  1: '#fbbf24',
  2: '#00d4ff',
  3: '#a78bfa',
  4: '#34f5a0',
}

const SOURCE_COLORS = {
  mqtt: '#00d4ff',
  manual: '#f59e0b',
} as const

const ROLE_LABELS: Record<number, string> = {
  1: 'ChatNode',
  2: 'Repeater',
  3: 'RoomServer',
  4: 'Sensor',
}

function formatLastSeen(timestamp: number): string {
  if (!timestamp || timestamp <= 0) return 'Manual entry'
  const diff = Date.now() - timestamp
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function formatCoordinates(lat?: number, lon?: number): string | null {
  if (lat === undefined || lon === undefined) return null
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

function hasSourceMetadata(node: Node): boolean {
  return node.is_manual !== undefined || node.is_mqtt_node !== undefined
}

function isDisplayableNode(node: Node, useSourceFilter: boolean): boolean {
  if (node.lat === undefined || node.lon === undefined) return false
  if (!useSourceFilter) return true
  return Boolean(node.is_manual || node.is_mqtt_node)
}

function getSourceLabel(node: Node): string {
  if (node.is_mqtt_node) return 'MQTT Connected'
  if (node.is_manual) return 'Manually Added'
  return 'Unknown'
}

export default function MapPage() {
  useWebSocket()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showLegend, setShowLegend] = useState(true)

  const { nodes, packets } = useNodeStore()
  const selectedCoordinates = selectedNode ? formatCoordinates(selectedNode.lat, selectedNode.lon) : null
  const hasAnySourceMetadata = Array.from(nodes.values()).some(hasSourceMetadata)
  const mappableNodeCount = Array.from(nodes.values()).filter(
    (node) => isDisplayableNode(node, hasAnySourceMetadata)
  ).length

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.current.on('load', () => {
      map.current!.addSource('nodes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.current!.addLayer({
        id: 'node-dots',
        type: 'circle',
        source: 'nodes',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 3, 9, 4, 11, 5, 13, 7, 16, 10
          ],
          'circle-color': [
            'case',
            ['get', 'is_mqtt_node'], SOURCE_COLORS.mqtt,
            ['get', 'is_manual'], SOURCE_COLORS.manual,
            '#6b7280'
          ],
          'circle-opacity': [
            'case',
            ['!', ['get', 'is_online']], 0.4,
            1
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.6,
        },
      })

      map.current!.on('click', 'node-dots', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties
          const nodeId = props?.node_id
          if (nodeId) {
            const node = useNodeStore.getState().nodes.get(nodeId)
            setSelectedNode(node || null)
          }
        }
      })

      map.current!.on('mouseenter', 'node-dots', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer'
      })

      map.current!.on('mouseleave', 'node-dots', () => {
        if (map.current) map.current.getCanvas().style.cursor = ''
      })

      // Populate nodes that arrived before the style finished loading
      const currentNodes = useNodeStore.getState().nodes
      const source = map.current!.getSource('nodes') as maplibregl.GeoJSONSource
      source.setData({
        type: 'FeatureCollection',
        features: Array.from(currentNodes.values())
          .filter((n) => isDisplayableNode(n, hasAnySourceMetadata))
          .map((n) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [n.lon!, n.lat!] },
            properties: {
              node_id: n.node_id,
              name: n.name,
              role: n.role ?? 0,
              is_online: n.is_online,
              is_manual: n.is_manual ?? false,
              is_mqtt_node: n.is_mqtt_node ?? false,
            },
          })),
      })
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    const features = Array.from(nodes.values())
      .filter((node) => isDisplayableNode(node, hasAnySourceMetadata))
      .map((node) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [node.lon!, node.lat!],
        },
        properties: {
          node_id: node.node_id,
          name: node.name,
          role: node.role ?? 0,
          is_online: node.is_online,
          is_manual: node.is_manual ?? false,
          is_mqtt_node: node.is_mqtt_node ?? false,
        },
      }))

    const source = map.current.getSource('nodes') as maplibregl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      })
    }
  }, [nodes])

  const handleFullscreen = useCallback(() => {
    if (mapContainer.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        mapContainer.current.requestFullscreen()
      }
    }
  }, [])

  return (
    <div className={styles.page}>
      <SEO
        title="Live MeshCore Map"
        description="Explore the live NorthMesh map of MeshCore LoRa repeaters and nodes across northern England, including online status, mapped positions, and packet activity."
        path="/map"
      />
      <div ref={mapContainer} className={styles.mapContainer} />

      <div className={styles.overlay}>
        <div className={styles.topLeft}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>NorthMesh Live</h3>
            <div className={styles.networkInfo}>
              <span className={styles.nodeCount}>
                {mappableNodeCount} mapped nodes
              </span>
              <span className={styles.packetCount}>{packets.length} packets tracked</span>
            </div>
          </div>
        </div>

        <div className={styles.topRight}>
          <button
            className={styles.iconBtn}
            onClick={handleFullscreen}
            title="Toggle fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className={`${styles.bottomLeft} ${showLegend ? '' : styles.hidden}`}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <Layers size={16} />
                Legend
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowLegend(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.legend}>
              {hasAnySourceMetadata ? (
                <>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: SOURCE_COLORS.mqtt }} />
                    <span>MQTT Connected</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: SOURCE_COLORS.manual }} />
                    <span>Manually Added</span>
                  </div>
                </>
              ) : (
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: SOURCE_COLORS.mqtt }} />
                  <span>Located Node</span>
                </div>
              )}
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.offline}`} />
                <span>Offline</span>
              </div>
            </div>
          </div>
        </div>

        <button
          className={`${styles.legendToggle}`}
          onClick={() => setShowLegend(!showLegend)}
          style={{ display: showLegend ? 'none' : 'flex' }}
        >
          <Layers size={18} />
        </button>

        {selectedNode && (
          <div className={styles.bottomRight}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  <Info size={16} />
                  Node Details
                </h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedNode(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={styles.nodeDetails}>
                <div className={styles.nodeHeader}>
                  <span
                    className={styles.roleBadge}
                    style={{ background: ROLE_COLORS[selectedNode.role ?? 0] || '#6b7280' }}
                  >
                    {ROLE_LABELS[selectedNode.role ?? 0] || 'Unknown'}
                  </span>
                  <span className={styles.nodeName}>{selectedNode.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Source</span>
                  <span>{getSourceLabel(selectedNode)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={`${styles.statusBadge} ${selectedNode.is_online ? styles.online : styles.offline}`}>
                    {selectedNode.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Last Seen</span>
                  <span>{formatLastSeen(selectedNode.last_seen)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Role</span>
                  <span>{ROLE_LABELS[selectedNode.role || 0] || 'Unknown'}</span>
                </div>
                {selectedCoordinates && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.mono}>{selectedCoordinates}</span>
                  </div>
                )}
                {selectedNode.model && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Hardware</span>
                    <span>{selectedNode.model}</span>
                  </div>
                )}
                {selectedNode.firmware_version && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Firmware</span>
                    <span>{selectedNode.firmware_version}</span>
                  </div>
                )}
                {selectedNode.radio && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Radio</span>
                    <span>{selectedNode.radio}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Public Key</span>
                  <span className={styles.mono}>
                    {selectedNode.node_id.slice(0, 8)}...{selectedNode.node_id.slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
