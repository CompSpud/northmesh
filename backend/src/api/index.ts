import { Response, Router } from 'express'
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import { createManagedNode, loadNodes, updateManagedNode } from '../db/client.js'
import { db } from '../db/client.js'

export const apiRouter = Router()
const PORTAL_SESSION_MS = 12 * 60 * 60 * 1000
const PORTAL_HASH_ITERATIONS = 120000

interface PortalUser {
  username: string
  password_hash: string
  role: 'admin' | 'user'
  node_id?: string | null
  created_at?: string | Date
  updated_at?: string | Date
}

interface PortalSession {
  username: string
  role: 'admin' | 'user'
  node_id?: string | null
  exp: number
}

let portalUsersReady: Promise<void> | null = null

function portalSecret(): string {
  return process.env.PORTAL_ADMIN_TOKEN || process.env.JWT_SECRET || ''
}

function portalUsername(): string {
  return process.env.PORTAL_ADMIN_USERNAME || 'admin'
}

function portalPassword(): string {
  return process.env.PORTAL_ADMIN_PASSWORD || process.env.PORTAL_ADMIN_TOKEN || ''
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  const hash = pbkdf2Sync(password, salt, PORTAL_HASH_ITERATIONS, 32, 'sha256').toString('hex')
  return `pbkdf2_sha256$${PORTAL_HASH_ITERATIONS}$${salt}$${hash}`
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split('$')
  const iterations = Number.parseInt(iterationsText, 10)

  if (algorithm !== 'pbkdf2_sha256' || !Number.isInteger(iterations) || !salt || !expectedHash) {
    return false
  }

  const actualHash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex')
  return matchesSecret(actualHash, expectedHash)
}

async function ensurePortalUsersTable(): Promise<void> {
  if (!portalUsersReady) {
    portalUsersReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS portal_users (
          username TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          node_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)

      const username = portalUsername()
      const password = portalPassword()

      if (username && password) {
        await db.query(
          `INSERT INTO portal_users (username, password_hash, role, updated_at)
           VALUES ($1, $2, 'admin', NOW())
           ON CONFLICT (username) DO UPDATE SET
             password_hash = EXCLUDED.password_hash,
             role = 'admin',
             updated_at = NOW()`,
          [username, hashPassword(password)]
        )
      }
    })().catch((error) => {
      portalUsersReady = null
      throw error
    })
  }

  await portalUsersReady
}

async function findPortalUser(username: string): Promise<PortalUser | null> {
  await ensurePortalUsersTable()
  const result = await db.query<PortalUser>(
    `SELECT username, password_hash, role, node_id
     FROM portal_users
     WHERE username = $1`,
    [username]
  )
  const user = result.rows[0]
  if (!user || (user.role !== 'admin' && user.role !== 'user')) {
    return null
  }
  return user
}

function portalSession(res: Response): PortalSession {
  return res.locals.portalUser as PortalSession
}

function requirePortalAdmin(res: Response): PortalSession | null {
  const session = portalSession(res)
  if (session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return null
  }
  return session
}

function publicPortalUser(user: PortalUser) {
  return {
    username: user.username,
    role: user.role,
    node_id: user.node_id ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }
}

function sanitizePortalRole(value: unknown): 'admin' | 'user' {
  return value === 'admin' ? 'admin' : 'user'
}

function matchesSecret(value: string, secret: string): boolean {
  const valueBuffer = Buffer.from(value)
  const secretBuffer = Buffer.from(secret)
  return valueBuffer.length === secretBuffer.length && timingSafeEqual(valueBuffer, secretBuffer)
}

function signPortalSession(user: PortalUser): string {
  const secret = portalSecret()
  const payload = Buffer.from(JSON.stringify({
    username: user.username,
    role: user.role,
    node_id: user.node_id ?? null,
    exp: Date.now() + PORTAL_SESSION_MS,
  })).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function verifyPortalSession(token: string): PortalSession | null {
  const secret = portalSecret()
  const [payload, signature] = token.split('.')

  if (!secret || !payload || !signature) {
    return null
  }

  const expectedSignature = createHmac('sha256', secret).update(payload).digest('base64url')
  if (!matchesSecret(signature, expectedSignature)) {
    return null
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PortalSession
    if (!data.username || (data.role !== 'admin' && data.role !== 'user') || typeof data.exp !== 'number') {
      return null
    }
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

apiRouter.use('/portal', (req, res, next) => {
  if (req.path === '/login') {
    next()
    return
  }

  const token = String(req.headers['x-portal-token'] || '').trim()

  if (!portalSecret() || !portalPassword()) {
    res.status(503).json({ error: 'Portal login is not configured yet' })
    return
  }

  const session = token ? verifyPortalSession(token) : null
  if (!session) {
    res.status(401).json({ error: 'Portal login required' })
    return
  }

  res.locals.portalUser = session
  next()
})

apiRouter.get('/status', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NorthMesh Backend',
    version: '1.0.0',
    timestamp: Date.now(),
  })
})

apiRouter.get('/nodes', (_req, res) => {
  res.json({
    type: 'nodes',
    data: [],
    message: 'Node data is delivered via WebSocket',
  })
})

apiRouter.get('/stats', (_req, res) => {
  res.json({
    type: 'stats',
    data: {
      totalNodes: 0,
      onlineNodes: 0,
      packetsToday: 0,
      activeLinks: 0,
    },
  })
})

apiRouter.post('/portal/login', async (req, res) => {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')

  if (!portalSecret() || !portalPassword()) {
    res.status(503).json({ error: 'Portal login is not configured yet' })
    return
  }

  const user = await findPortalUser(username)
  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }

  res.json({ ok: true, role: user.role, token: signPortalSession(user) })
})

apiRouter.get('/portal/nodes', async (_req, res) => {
  const session = portalSession(res)
  const nodes = await loadNodes()
  const visibleNodes = session.role === 'admin'
    ? nodes
    : nodes.filter((node) => node.node_id === session.node_id)

  res.json({
    data: visibleNodes.map((node) => ({
      node_id: node.node_id,
      name: node.name,
      role: node.role,
      lat: node.lat,
      lon: node.lon,
      firmware_version: node.firmware_version,
      hardware_model: node.hardware_model,
      last_seen: node.last_seen,
      is_online: node.is_online,
      is_manual: node.is_manual,
      is_mqtt_node: node.is_mqtt_node,
    })),
  })
})

apiRouter.post('/portal/nodes', async (req, res) => {
  if (!requirePortalAdmin(res)) return

  const nodeId = String(req.body?.node_id || '').trim()
  const name = String(req.body?.name || '').trim()
  const role = Number.parseInt(String(req.body?.role ?? '2'), 10)
  const lat = req.body?.lat === undefined || req.body?.lat === null || req.body?.lat === ''
    ? null
    : Number.parseFloat(String(req.body.lat))
  const lon = req.body?.lon === undefined || req.body?.lon === null || req.body?.lon === ''
    ? null
    : Number.parseFloat(String(req.body.lon))

  if (!/^[a-zA-Z0-9._:-]{2,96}$/.test(nodeId)) {
    res.status(400).json({ error: 'Node ID must be 2-96 letters, numbers, dots, dashes, underscores, or colons' })
    return
  }

  if (!name) {
    res.status(400).json({ error: 'Node name is required' })
    return
  }

  if (!Number.isInteger(role) || role < 1 || role > 4) {
    res.status(400).json({ error: 'Role must be between 1 and 4' })
    return
  }

  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    res.status(400).json({ error: 'Latitude must be between -90 and 90' })
    return
  }

  if (lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
    res.status(400).json({ error: 'Longitude must be between -180 and 180' })
    return
  }

  if ((lat === null) !== (lon === null)) {
    res.status(400).json({ error: 'Latitude and longitude must be set together' })
    return
  }

  const node = await createManagedNode({ node_id: nodeId, name, role, lat, lon })
  res.json({ ok: true, node })
})

apiRouter.get('/portal/users', async (_req, res) => {
  if (!requirePortalAdmin(res)) return
  await ensurePortalUsersTable()

  const result = await db.query<PortalUser>(
    `SELECT username, role, node_id, created_at, updated_at
     FROM portal_users
     ORDER BY role, username`
  )

  res.json({ data: result.rows.map(publicPortalUser) })
})

apiRouter.post('/portal/users', async (req, res) => {
  if (!requirePortalAdmin(res)) return

  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')
  const role = sanitizePortalRole(req.body?.role)
  const nodeId = role === 'user' ? String(req.body?.node_id || '').trim() : null

  if (!/^[a-zA-Z0-9._-]{2,64}$/.test(username)) {
    res.status(400).json({ error: 'Username must be 2-64 letters, numbers, dots, dashes, or underscores' })
    return
  }

  if (password.length < 12) {
    res.status(400).json({ error: 'Password must be at least 12 characters' })
    return
  }

  if (role === 'user' && !nodeId) {
    res.status(400).json({ error: 'Users must be assigned to a node' })
    return
  }

  await ensurePortalUsersTable()
  const result = await db.query<PortalUser>(
    `INSERT INTO portal_users (username, password_hash, role, node_id, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (username) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       node_id = EXCLUDED.node_id,
       updated_at = NOW()
     RETURNING username, role, node_id, created_at, updated_at`,
    [username, hashPassword(password), role, nodeId || null]
  )

  res.json({ ok: true, user: publicPortalUser(result.rows[0]) })
})

apiRouter.patch('/portal/users/:username', async (req, res) => {
  const session = requirePortalAdmin(res)
  if (!session) return

  const username = String(req.params.username || '').trim()
  const password = typeof req.body?.password === 'string' ? req.body.password : undefined
  const role = req.body?.role === undefined ? undefined : sanitizePortalRole(req.body.role)
  const nodeId = role === 'admin'
    ? null
    : req.body?.node_id === undefined
    ? undefined
    : String(req.body.node_id || '').trim() || null

  if (!username) {
    res.status(400).json({ error: 'Username is required' })
    return
  }

  if (password !== undefined && password.length < 12) {
    res.status(400).json({ error: 'Password must be at least 12 characters' })
    return
  }

  if (username === session.username && role === 'user') {
    res.status(400).json({ error: 'You cannot remove your own admin access' })
    return
  }

  await ensurePortalUsersTable()
  const existing = await findPortalUser(username)
  if (!existing) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const nextRole = role ?? existing.role
  const nextNodeId = nextRole === 'admin'
    ? null
    : nodeId !== undefined
    ? nodeId
    : existing.node_id ?? null

  if (nextRole === 'user' && !nextNodeId) {
    res.status(400).json({ error: 'Users must be assigned to a node' })
    return
  }

  const result = await db.query<PortalUser>(
    `UPDATE portal_users
     SET password_hash = COALESCE($2, password_hash),
         role = $3,
         node_id = $4,
         updated_at = NOW()
     WHERE username = $1
     RETURNING username, role, node_id, created_at, updated_at`,
    [username, password ? hashPassword(password) : null, nextRole, nextNodeId]
  )

  res.json({ ok: true, user: publicPortalUser(result.rows[0]) })
})

apiRouter.delete('/portal/users/:username', async (req, res) => {
  const session = requirePortalAdmin(res)
  if (!session) return

  const username = String(req.params.username || '').trim()
  if (!username) {
    res.status(400).json({ error: 'Username is required' })
    return
  }

  if (username === session.username) {
    res.status(400).json({ error: 'You cannot delete the account you are using' })
    return
  }

  await ensurePortalUsersTable()
  const result = await db.query('DELETE FROM portal_users WHERE username = $1', [username])
  res.json({ ok: true, deleted: result.rowCount ?? 0 })
})

apiRouter.patch('/portal/nodes/:nodeId', async (req, res) => {
  const session = res.locals.portalUser as PortalSession
  const nodeId = String(req.params.nodeId || '').trim()
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined
  const role = req.body?.role === undefined
    ? undefined
    : req.body?.role === null || req.body?.role === ''
    ? null
    : Number.parseInt(String(req.body?.role), 10)
  const lat = req.body?.lat === undefined
    ? undefined
    : req.body?.lat === null || req.body?.lat === ''
    ? null
    : Number.parseFloat(String(req.body?.lat))
  const lon = req.body?.lon === undefined
    ? undefined
    : req.body?.lon === null || req.body?.lon === ''
    ? null
    : Number.parseFloat(String(req.body?.lon))

  if (!nodeId) {
    res.status(400).json({ error: 'Node ID is required' })
    return
  }

  if (session.role !== 'admin' && session.node_id !== nodeId) {
    res.status(403).json({ error: 'You can only update your assigned node' })
    return
  }

  if (name !== undefined && name.length === 0) {
    res.status(400).json({ error: 'Node name cannot be empty' })
    return
  }

  if (role !== undefined && role !== null && (!Number.isInteger(role) || role < 1 || role > 4)) {
    res.status(400).json({ error: 'Role must be between 1 and 4' })
    return
  }

  if (lat !== undefined && lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    res.status(400).json({ error: 'Latitude must be between -90 and 90' })
    return
  }

  if (lon !== undefined && lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
    res.status(400).json({ error: 'Longitude must be between -180 and 180' })
    return
  }

  await updateManagedNode(nodeId, {
    name,
    role,
    lat,
    lon,
    location_locked: lat !== undefined && lon !== undefined && lat !== null && lon !== null,
  })

  res.json({ ok: true })
})

apiRouter.post('/portal/mqtt-password', (_req, res) => {
  res.json({
    password: randomBytes(18).toString('base64url'),
    note: 'Password generated only. Apply it to Mosquitto before giving it to the user.',
  })
})
