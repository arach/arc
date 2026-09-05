#!/usr/bin/env bun
/**
 * Force-sync arc-server agents into the local Scout broker.
 * mesh discover hangs when the local registry has thousands of stale peers;
 * this fetches only arc-server and upserts the 12 remote agents directly.
 */
import { fetchPeerAgents } from '../../openscout/packages/runtime/src/mesh-forwarding.ts'
import { remotePeerAgentForNode } from '../../openscout/packages/runtime/src/broker-mesh-discovery-service.ts'

const brokerUrl = process.env.OPENSCOUT_BROKER_URL ?? 'http://127.0.0.1:43110'
const peerUrl = process.env.ARC_SERVER_BROKER_URL ?? 'https://100.125.19.93:43110'
const peerNodeId = 'arc-server-openscout'

const node = {
  id: peerNodeId,
  meshId: 'openscout',
  name: 'arc-server',
  hostName: 'arc-server',
  brokerUrl: peerUrl,
  advertiseScope: 'mesh',
}

const snap = await fetch(`${brokerUrl}/v1/snapshot`).then((r) => r.json())
const localNodeId =
  snap.localNodeId ??
  Object.keys(snap.nodes ?? {}).find((k) => k.includes('arts-mini')) ??
  'arts-mini-openscout'

const nodeLocal = new Set(
  Object.keys(snap.agents ?? {}).filter((id) => !id.includes('.')),
)

const peerAgents = await fetchPeerAgents(peerUrl)
let synced = 0

for (const agent of peerAgents) {
  const remote = remotePeerAgentForNode({
    agent,
    node,
    nodeId: localNodeId,
    existingAgent: snap.agents?.[agent.id],
    nodeLocalProductAgentIds: nodeLocal,
  })
  if (!remote) continue

  const res = await fetch(`${brokerUrl}/v1/agents`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(remote),
  })
  if (res.ok) synced++
  else console.error('failed', agent.id, await res.text())
}

console.log(`synced ${synced}/${peerAgents.length} arc-server agents into ${brokerUrl}`)
