import { Pool } from 'pg'

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

let nodesSchemaReady: Promise<void> | null = null

export async function ensureNodesTable(): Promise<void> {
  if (!nodesSchemaReady) {
    nodesSchemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS nodes (
          node_id TEXT PRIMARY KEY,
          name TEXT,
          lat DOUBLE PRECISION,
          lon DOUBLE PRECISION,
          role INTEGER,
          last_seen TIMESTAMPTZ DEFAULT NOW(),
          is_online BOOLEAN DEFAULT FALSE,
          hardware_model TEXT,
          firmware_version TEXT,
          public_key TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          advert_count INTEGER NOT NULL DEFAULT 0,
          elevation_m DOUBLE PRECISION,
          network TEXT NOT NULL DEFAULT 'uk/north',
          last_predicted_online_at TIMESTAMPTZ,
          last_path_evidence_at TIMESTAMPTZ,
          is_manual BOOLEAN NOT NULL DEFAULT FALSE,
          location_locked BOOLEAN NOT NULL DEFAULT FALSE,
          is_mqtt_node BOOLEAN NOT NULL DEFAULT FALSE
        )
      `)

      await db.query('ALTER TABLE nodes ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT FALSE')
      await db.query('ALTER TABLE nodes ADD COLUMN IF NOT EXISTS location_locked BOOLEAN NOT NULL DEFAULT FALSE')
      await db.query('ALTER TABLE nodes ADD COLUMN IF NOT EXISTS is_mqtt_node BOOLEAN NOT NULL DEFAULT FALSE')
      await db.query(`
        UPDATE nodes
        SET is_manual = TRUE
        WHERE is_manual = FALSE
          AND location_locked = TRUE
          AND is_mqtt_node = FALSE
      `)
      await db.query('CREATE INDEX IF NOT EXISTS idx_nodes_last_seen ON nodes (last_seen)')
      await db.query('CREATE INDEX IF NOT EXISTS idx_nodes_is_online ON nodes (is_online)')
      await db.query('CREATE INDEX IF NOT EXISTS idx_nodes_network ON nodes (network)')
    })().catch((error) => {
      nodesSchemaReady = null
      throw error
    })
  }

  await nodesSchemaReady
}

export async function loadNodes(): Promise<Array<{
  node_id: string
  name: string
  lat?: number
  lon?: number
  role?: number
  firmware_version?: string
  hardware_model?: string
  last_seen?: string | Date
  is_online?: boolean
  is_manual?: boolean
  is_mqtt_node?: boolean
}>> {
  try {
    await ensureNodesTable()
    const result = await db.query(
      `SELECT node_id, name, lat, lon, role, firmware_version, hardware_model, last_seen, is_online,
              is_manual, is_mqtt_node
       FROM nodes
       WHERE is_manual = TRUE OR is_mqtt_node = TRUE`
    )
    return result.rows
  } catch (error) {
    console.error('[DB] Failed to load nodes:', error)
    return []
  }
}

export async function getNodeLocation(nodeId: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const result = await db.query<{ lat: number; lon: number }>(
      'SELECT lat, lon FROM nodes WHERE node_id = $1 AND lat IS NOT NULL AND lon IS NOT NULL',
      [nodeId]
    )
    return result.rows[0] ?? null
  } catch {
    return null
  }
}

export async function upsertNode(node: {
  node_id: string
  name: string
  role?: number
  lat?: number
  lon?: number
  firmware_version?: string
  hardware_model?: string
  is_manual?: boolean
  is_mqtt_node?: boolean
}): Promise<void> {
  try {
    await ensureNodesTable()
    await db.query(
      `INSERT INTO nodes (node_id, name, role, lat, lon, firmware_version, hardware_model, last_seen, is_online, is_manual, is_mqtt_node)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), TRUE, $8, $9)
       ON CONFLICT (node_id) DO UPDATE SET
         name = EXCLUDED.name,
         role = COALESCE(EXCLUDED.role, nodes.role),
         lat = CASE WHEN nodes.location_locked THEN nodes.lat ELSE COALESCE(EXCLUDED.lat, nodes.lat) END,
         lon = CASE WHEN nodes.location_locked THEN nodes.lon ELSE COALESCE(EXCLUDED.lon, nodes.lon) END,
         firmware_version = COALESCE(EXCLUDED.firmware_version, nodes.firmware_version),
         hardware_model = COALESCE(EXCLUDED.hardware_model, nodes.hardware_model),
         last_seen = NOW(),
         is_online = TRUE,
         is_manual = CASE
           WHEN EXCLUDED.is_mqtt_node THEN FALSE
           ELSE nodes.is_manual OR EXCLUDED.is_manual
         END,
         is_mqtt_node = nodes.is_mqtt_node OR EXCLUDED.is_mqtt_node`,
      [
        node.node_id,
        node.name,
        node.role,
        node.lat ?? null,
        node.lon ?? null,
        node.firmware_version ?? null,
        node.hardware_model ?? null,
        node.is_manual ?? false,
        node.is_mqtt_node ?? false,
      ]
    )
  } catch (error) {
    console.error(`[DB] Failed to upsert node ${node.node_id}:`, error)
  }
}

export async function updateManagedNode(nodeId: string, updates: {
  name?: string
  role?: number | null
  lat?: number | null
  lon?: number | null
  location_locked?: boolean
}): Promise<void> {
  await ensureNodesTable()

  await db.query(
    `UPDATE nodes
     SET name = COALESCE($2, name),
         role = COALESCE($3, role),
         lat = $4,
         lon = $5,
         location_locked = $6,
         is_manual = CASE WHEN is_mqtt_node THEN is_manual ELSE TRUE END
     WHERE node_id = $1`,
    [
      nodeId,
      updates.name ?? null,
      updates.role ?? null,
      updates.lat ?? null,
      updates.lon ?? null,
      updates.location_locked ?? false,
    ]
  )
}
