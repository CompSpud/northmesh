import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Activity, Copy, KeyRound, Lock, MapPin, PlusCircle, Radio, Save, Shield, Trash2, UserPlus, Wifi } from 'lucide-react'
import SEO from '../components/SEO'
import { useNodeStore, Node } from '../hooks/useNodes'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './PortalPage.module.css'

const PORTAL_TOKEN_KEY = 'northmesh-portal-token'
const PORTAL_ROLE_KEY = 'northmesh-portal-role'

const ROLE_LABELS: Record<number, string> = {
  1: 'ChatNode',
  2: 'Repeater',
  3: 'RoomServer',
  4: 'Sensor',
}

interface PortalNode {
  node_id: string
  name: string
  role?: number
  lat?: number
  lon?: number
  firmware_version?: string
  hardware_model?: string
  last_seen?: string
  is_online?: boolean
  is_manual?: boolean
  is_mqtt_node?: boolean
}

interface PortalUser {
  username: string
  role: 'admin' | 'user'
  node_id?: string | null
  created_at?: string
  updated_at?: string
}

function formatLastSeen(value?: string | number): string {
  if (!value) return 'No recent activity'
  const timestamp = typeof value === 'number' ? value : new Date(value).getTime()
  if (!timestamp || Number.isNaN(timestamp)) return 'No recent activity'

  const diff = Date.now() - timestamp
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function mergeNode(staticNode: PortalNode, liveNode?: Node): PortalNode {
  if (!liveNode) return staticNode
  return {
    ...staticNode,
    name: liveNode.name || staticNode.name,
    role: liveNode.role ?? staticNode.role,
    lat: liveNode.lat ?? staticNode.lat,
    lon: liveNode.lon ?? staticNode.lon,
    firmware_version: liveNode.firmware_version ?? staticNode.firmware_version,
    hardware_model: liveNode.model ?? staticNode.hardware_model,
    is_online: liveNode.is_online,
    is_manual: liveNode.is_manual ?? staticNode.is_manual,
    is_mqtt_node: liveNode.is_mqtt_node ?? staticNode.is_mqtt_node,
  }
}

export default function PortalPage() {
  useWebSocket()
  const { nodes: liveNodes, stats } = useNodeStore()
  const [token, setToken] = useState(() => sessionStorage.getItem(PORTAL_TOKEN_KEY) || '')
  const [userRole, setUserRole] = useState<'admin' | 'user' | ''>(() => {
    const savedRole = sessionStorage.getItem(PORTAL_ROLE_KEY)
    return savedRole === 'admin' || savedRole === 'user' ? savedRole : ''
  })
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [isAuthed, setIsAuthed] = useState(() => Boolean(sessionStorage.getItem(PORTAL_TOKEN_KEY)))
  const [portalNodes, setPortalNodes] = useState<PortalNode[]>([])
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [form, setForm] = useState({ name: '', role: '2', lat: '', lon: '' })
  const [newNodeForm, setNewNodeForm] = useState({ node_id: '', name: '', role: '2', lat: '', lon: '' })
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user', node_id: '' })
  const [mqttUsername, setMqttUsername] = useState('')
  const [mqttPassword, setMqttPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const nodes = useMemo(() => {
    return portalNodes
      .map((node) => mergeNode(node, liveNodes.get(node.node_id)))
      .sort((a, b) => String(a.name || a.node_id).localeCompare(String(b.name || b.node_id)))
  }, [portalNodes, liveNodes])

  const selectedNode = nodes.find((node) => node.node_id === selectedNodeId) || nodes[0]

  useEffect(() => {
    if (!selectedNode) return
    setSelectedNodeId(selectedNode.node_id)
    setForm({
      name: selectedNode.name || selectedNode.node_id.slice(0, 8),
      role: String(selectedNode.role ?? 2),
      lat: selectedNode.lat === undefined || selectedNode.lat === null ? '' : String(selectedNode.lat),
      lon: selectedNode.lon === undefined || selectedNode.lon === null ? '' : String(selectedNode.lon),
    })
    setMqttUsername(selectedNode.name || selectedNode.node_id.slice(0, 8))
  }, [selectedNode?.node_id])

  async function portalFetch(path: string, init: RequestInit = {}) {
    const response = await fetch(`/api/portal${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-portal-token': token,
        ...(init.headers || {}),
      },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.error || 'Portal request failed')
    }
    return data
  }

  async function loadPortalNodes() {
    if (!token) return
    try {
      setError('')
      const data = await portalFetch('/nodes')
      setPortalNodes(data.data || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load portal data')
    }
  }

  async function loadPortalUsers() {
    if (!token || userRole !== 'admin') return
    try {
      setError('')
      const data = await portalFetch('/users')
      setPortalUsers(data.data || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load portal users')
    }
  }

  useEffect(() => {
    if (isAuthed) {
      loadPortalNodes()
    }
  }, [isAuthed, token])

  useEffect(() => {
    if (isAuthed && userRole === 'admin') {
      loadPortalUsers()
    }
  }, [isAuthed, token, userRole])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setStatus('')
    setError('')

    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Login failed')

      sessionStorage.setItem(PORTAL_TOKEN_KEY, data.token)
      sessionStorage.setItem(PORTAL_ROLE_KEY, data.role)
      setToken(data.token)
      setUserRole(data.role === 'admin' ? 'admin' : 'user')
      setIsAuthed(true)
      setUsernameInput('')
      setPasswordInput('')
      setStatus('Logged in')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    }
  }

  function logout() {
    sessionStorage.removeItem(PORTAL_TOKEN_KEY)
    sessionStorage.removeItem(PORTAL_ROLE_KEY)
    setToken('')
    setUserRole('')
    setIsAuthed(false)
    setPortalNodes([])
    setPortalUsers([])
    setStatus('')
  }

  async function saveNode(event: FormEvent) {
    event.preventDefault()
    if (!selectedNode) return

    try {
      setError('')
      setStatus('Saving node')
      await portalFetch(`/nodes/${encodeURIComponent(selectedNode.node_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          lat: form.lat,
          lon: form.lon,
        }),
      })
      setStatus('Node saved')
      await loadPortalNodes()
    } catch (saveError) {
      setStatus('')
      setError(saveError instanceof Error ? saveError.message : 'Could not save node')
    }
  }

  async function createNode(event: FormEvent) {
    event.preventDefault()
    try {
      setError('')
      setStatus('Creating node')
      const data = await portalFetch('/nodes', {
        method: 'POST',
        body: JSON.stringify(newNodeForm),
      })
      const node = data.node as PortalNode | undefined
      const nodeId = node?.node_id || newNodeForm.node_id
      setStatus('Node created')
      setNewNodeForm({ node_id: '', name: '', role: '2', lat: '', lon: '' })
      setSelectedNodeId(nodeId)
      setUserForm({ ...userForm, role: 'user', node_id: nodeId })
      await loadPortalNodes()
    } catch (createError) {
      setStatus('')
      setError(createError instanceof Error ? createError.message : 'Could not create node')
    }
  }

  async function generateMqttPassword() {
    try {
      setError('')
      const data = await portalFetch('/mqtt-password', { method: 'POST', body: '{}' })
      setMqttPassword(data.password || '')
      setStatus('MQTT password generated')
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Could not generate password')
    }
  }

  async function generatePortalPassword() {
    try {
      setError('')
      const data = await portalFetch('/mqtt-password', { method: 'POST', body: '{}' })
      setUserForm({ ...userForm, password: data.password || '' })
      setStatus('Password generated')
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Could not generate password')
    }
  }

  async function savePortalUser(event: FormEvent) {
    event.preventDefault()
    try {
      setError('')
      setStatus('Saving user')
      await portalFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userForm),
      })
      setStatus('User saved')
      setUserForm({ username: '', password: '', role: 'user', node_id: '' })
      await loadPortalUsers()
    } catch (saveError) {
      setStatus('')
      setError(saveError instanceof Error ? saveError.message : 'Could not save user')
    }
  }

  async function resetPortalUserPassword(username: string) {
    try {
      setError('')
      const data = await portalFetch('/mqtt-password', { method: 'POST', body: '{}' })
      const password = data.password || ''
      await portalFetch(`/users/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      })
      await navigator.clipboard?.writeText(password)
      setStatus(`Password reset for ${username} and copied`)
      await loadPortalUsers()
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset password')
    }
  }

  async function deletePortalUser(username: string) {
    if (!window.confirm(`Delete ${username}?`)) return
    try {
      setError('')
      await portalFetch(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' })
      setStatus(`Deleted ${username}`)
      await loadPortalUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete user')
    }
  }

  const mosquittoCommand = mqttUsername && mqttPassword
    ? `docker compose exec mosquitto mosquitto_passwd -b /mosquitto/config/passwd ${mqttUsername} ${mqttPassword}`
    : ''

  return (
    <div className={styles.page}>
      <SEO
        title="Portal Login"
        description="NorthMesh portal for managing repeater locations, MQTT credentials, and node status."
        path="/portal"
      />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>NorthMesh Portal</span>
          <h1 className={styles.title}>Repeater Admin</h1>
        </div>
        {isAuthed && (
          <button className={styles.secondaryButton} type="button" onClick={logout}>
            <Lock size={16} />
            Log out
          </button>
        )}
      </div>

      {!isAuthed ? (
        <section className={styles.loginPanel}>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <KeyRound className={styles.loginIcon} size={28} />
            <label className={styles.field}>
              <span>Username</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
                autoComplete="username"
              />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button className={styles.primaryButton} type="submit">
              Login
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <Radio size={22} />
              <strong>{stats.totalNodes}</strong>
              <span>Total nodes</span>
            </div>
            <div className={styles.stat}>
              <Wifi size={22} />
              <strong>{stats.onlineNodes}</strong>
              <span>Online</span>
            </div>
            <div className={styles.stat}>
              <Activity size={22} />
              <strong>{stats.packetsToday.toLocaleString()}</strong>
              <span>Packets today</span>
            </div>
            <div className={styles.stat}>
              <MapPin size={22} />
              <strong>{nodes.filter((node) => node.lat !== undefined && node.lon !== undefined).length}</strong>
              <span>Mapped</span>
            </div>
          </div>

          <div className={styles.portalGrid}>
            <section className={styles.nodeListPanel}>
              <div className={styles.panelHeader}>
                <h2>Nodes</h2>
                <button className={styles.secondaryButton} type="button" onClick={loadPortalNodes}>
                  Refresh
                </button>
              </div>
              <div className={styles.nodeList}>
                {nodes.map((node) => (
                  <button
                    key={node.node_id}
                    className={`${styles.nodeRow} ${node.node_id === selectedNode?.node_id ? styles.nodeRowActive : ''}`}
                    type="button"
                    onClick={() => setSelectedNodeId(node.node_id)}
                  >
                    <span className={`${styles.onlineDot} ${node.is_online ? styles.online : ''}`} />
                    <span>
                      <strong>{node.name || node.node_id.slice(0, 8)}</strong>
                      <small>{ROLE_LABELS[node.role ?? 0] || 'Unknown'} - {formatLastSeen(node.last_seen)}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.editorPanel}>
              <div className={styles.panelHeader}>
                <h2>Selected Repeater</h2>
                {selectedNode?.is_mqtt_node && <span className={styles.badge}>MQTT</span>}
              </div>

              {selectedNode ? (
                <>
                  <form className={styles.formGrid} onSubmit={saveNode}>
                    <label className={styles.field}>
                      <span>Name</span>
                      <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Role</span>
                      <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <option key={role} value={role}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Latitude</span>
                      <input value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Longitude</span>
                      <input value={form.lon} onChange={(event) => setForm({ ...form, lon: event.target.value })} />
                    </label>
                    <button className={styles.primaryButton} type="submit">
                      <Save size={16} />
                      Save node
                    </button>
                  </form>

                  <div className={styles.detailGrid}>
                    <span>Node ID</span>
                    <code>{selectedNode.node_id}</code>
                    <span>Firmware</span>
                    <strong>{selectedNode.firmware_version || 'Unknown'}</strong>
                    <span>Hardware</span>
                    <strong>{selectedNode.hardware_model || 'Unknown'}</strong>
                    <span>Last seen</span>
                    <strong>{formatLastSeen(selectedNode.last_seen)}</strong>
                  </div>

                  <div className={styles.mqttBox}>
                    <div className={styles.panelHeader}>
                      <h3>MQTT Credentials</h3>
                      <button className={styles.secondaryButton} type="button" onClick={generateMqttPassword}>
                        Generate
                      </button>
                    </div>
                    <label className={styles.field}>
                      <span>Username</span>
                      <input value={mqttUsername} onChange={(event) => setMqttUsername(event.target.value)} />
                    </label>
                    {mqttPassword && (
                      <div className={styles.commandBox}>
                        <code>{mqttPassword}</code>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Copy MQTT command"
                          onClick={() => navigator.clipboard?.writeText(mosquittoCommand)}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className={styles.empty}>No nodes loaded yet.</p>
              )}
            </section>
          </div>

          {userRole === 'admin' && (
            <>
              <section className={styles.userPanel}>
                <div className={styles.panelHeader}>
                  <h2>Create Node</h2>
                </div>

                <form className={styles.createNodeForm} onSubmit={createNode}>
                  <label className={styles.field}>
                    <span>Node ID</span>
                    <input
                      value={newNodeForm.node_id}
                      onChange={(event) => setNewNodeForm({ ...newNodeForm, node_id: event.target.value })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Name</span>
                    <input
                      value={newNodeForm.name}
                      onChange={(event) => setNewNodeForm({ ...newNodeForm, name: event.target.value })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Role</span>
                    <select
                      value={newNodeForm.role}
                      onChange={(event) => setNewNodeForm({ ...newNodeForm, role: event.target.value })}
                    >
                      {Object.entries(ROLE_LABELS).map(([role, label]) => (
                        <option key={role} value={role}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Latitude</span>
                    <input
                      value={newNodeForm.lat}
                      onChange={(event) => setNewNodeForm({ ...newNodeForm, lat: event.target.value })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Longitude</span>
                    <input
                      value={newNodeForm.lon}
                      onChange={(event) => setNewNodeForm({ ...newNodeForm, lon: event.target.value })}
                    />
                  </label>
                  <button className={styles.primaryButton} type="submit">
                    <PlusCircle size={16} />
                    Create node
                  </button>
                </form>
              </section>

              <section className={styles.userPanel}>
              <div className={styles.panelHeader}>
                <h2>Portal Users</h2>
                <button className={styles.secondaryButton} type="button" onClick={loadPortalUsers}>
                  Refresh
                </button>
              </div>

              <form className={styles.userForm} onSubmit={savePortalUser}>
                <label className={styles.field}>
                  <span>Username</span>
                  <input
                    value={userForm.username}
                    onChange={(event) => setUserForm({ ...userForm, username: event.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Password</span>
                  <input
                    value={userForm.password}
                    onChange={(event) => setUserForm({ ...userForm, password: event.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Role</span>
                  <select
                    value={userForm.role}
                    onChange={(event) => setUserForm({ ...userForm, role: event.target.value, node_id: event.target.value === 'admin' ? '' : userForm.node_id })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Assigned node</span>
                  <select
                    value={userForm.node_id}
                    disabled={userForm.role === 'admin'}
                    onChange={(event) => setUserForm({ ...userForm, node_id: event.target.value })}
                  >
                    <option value="">Choose node</option>
                    {nodes.map((node) => (
                      <option key={node.node_id} value={node.node_id}>
                        {node.name || node.node_id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className={styles.secondaryButton} type="button" onClick={generatePortalPassword}>
                  <KeyRound size={16} />
                  Generate
                </button>
                <button className={styles.primaryButton} type="submit">
                  <UserPlus size={16} />
                  Save user
                </button>
              </form>

              <div className={styles.userList}>
                {portalUsers.map((user) => {
                  const assignedNode = nodes.find((node) => node.node_id === user.node_id)

                  return (
                    <div className={styles.userRow} key={user.username}>
                      <div className={styles.userMain}>
                        <strong>{user.username}</strong>
                        <span>
                          {user.role === 'admin' ? 'Admin' : assignedNode?.name || user.node_id || 'No node assigned'}
                        </span>
                      </div>
                      <span className={styles.userRole}>
                        <Shield size={14} />
                        {user.role}
                      </span>
                      <button className={styles.secondaryButton} type="button" onClick={() => resetPortalUserPassword(user.username)}>
                        Reset password
                      </button>
                      <button className={styles.iconButton} type="button" aria-label={`Delete ${user.username}`} onClick={() => deletePortalUser(user.username)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
              </section>
            </>
          )}
        </>
      )}

      {(status || error) && (
        <div className={`${styles.toast} ${error ? styles.toastError : ''}`}>
          {error || status}
        </div>
      )}
    </div>
  )
}
