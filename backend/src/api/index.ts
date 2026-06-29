import { Router } from 'express'
import { randomBytes, timingSafeEqual } from 'crypto'
import { loadNodes, updateManagedNode } from '../db/client.js'

export const apiRouter = Router()

function portalSecret(): string {
  return process.env.PORTAL_ADMIN_TOKEN || process.env.JWT_SECRET || ''
}

function matchesSecret(value: string, secret: string): boolean {
  const valueBuffer = Buffer.from(value)
  const secretBuffer = Buffer.from(secret)
  return valueBuffer.length === secretBuffer.length && timingSafeEqual(valueBuffer, secretBuffer)
}

apiRouter.use('/portal', (req, res, next) => {
  if (req.path === '/login') {
    next()
    return
  }

  const secret = portalSecret()
  const token = String(req.headers['x-portal-token'] || '').trim()

  if (!secret) {
    res.status(503).json({ error: 'Portal login is not configured yet' })
    return
  }

  if (!token || !matchesSecret(token, secret)) {
    res.status(401).json({ error: 'Portal login required' })
    return
  }

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

apiRouter.post('/portal/login', (req, res) => {
  const secret = portalSecret()
  const token = String(req.body?.token || '').trim()

  if (!secret) {
    res.status(503).json({ error: 'Portal login is not configured yet' })
    return
  }

  if (!token || !matchesSecret(token, secret)) {
    res.status(401).json({ error: 'Invalid portal key' })
    return
  }

  res.json({ ok: true, role: 'admin' })
})

apiRouter.get('/portal/nodes', async (_req, res) => {
  const nodes = await loadNodes()
  res.json({
    data: nodes.map((node) => ({
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

apiRouter.patch('/portal/nodes/:nodeId', async (req, res) => {
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
