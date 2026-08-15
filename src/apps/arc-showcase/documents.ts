// Sample documents for the player showcase (/showcase).
//
// Three diagrams chosen to exercise different parts of the renderer: a small
// linear pipeline, a request path with focus stories and group boundaries, and
// a wide platform map that needs the minimap and a busy key.
//
// Node footprints (for laying these out by hand): l 220×90, m 160×75,
// s 110×48, xs 80×36.

import type { ArcDiagramData } from '../../components/ArcDiagram'

export interface ShowcaseDoc {
  id: string
  name: string
  blurb: string
  /** Feature the document is here to demonstrate. */
  demonstrates: string
  data: ArcDiagramData
}

// --- 01 · Pipeline ---------------------------------------------------------
// Small and legible: the baseline for reading typography and connector labels.

const pipeline: ArcDiagramData = {
  id: 'ARC.PIPE.001',
  layout: { width: 820, height: 380 },
  nodes: {
    editor:    { x: 40,  y: 60,  size: 'm' },
    templates: { x: 40,  y: 220, size: 'm' },
    model:     { x: 300, y: 138, size: 'l' },
    exporters: { x: 330, y: 268, size: 's' },
    docs:      { x: 620, y: 150, size: 'm' },
  },
  nodeData: {
    editor:    { icon: 'Monitor',  name: 'Editor',        subtitle: 'Canvas UI',  description: 'Drag, connect, style.',     color: 'blue' },
    templates: { icon: 'Grid3X3',  name: 'Templates',     subtitle: 'Themes',     description: 'Palettes and presets.',     color: 'amber' },
    model:     { icon: 'Layers',   name: 'Diagram Model', subtitle: 'JSON / TS',  description: 'Typed, diffable state.',    color: 'violet' },
    exporters: { icon: 'Upload',   name: 'Exporters',     subtitle: 'SVG / PNG',                                            color: 'emerald' },
    docs:      { icon: 'FileCode', name: 'Docs + Apps',   subtitle: 'Consumers',  description: 'Embed anywhere.',           color: 'sky' },
  },
  connectors: [
    { from: 'editor',    to: 'model',     fromAnchor: 'right',  toAnchor: 'left', style: 'diagram' },
    { from: 'templates', to: 'model',     fromAnchor: 'right',  toAnchor: 'left', style: 'themes' },
    { from: 'model',     to: 'docs',      fromAnchor: 'right',  toAnchor: 'left', style: 'publish' },
    { from: 'model',     to: 'exporters', fromAnchor: 'bottom', toAnchor: 'top',  style: 'export' },
  ],
  connectorStyles: {
    diagram: { color: 'blue',    strokeWidth: 2, label: 'diagram' },
    themes:  { color: 'amber',   strokeWidth: 2, label: 'themes' },
    publish: { color: 'sky',     strokeWidth: 2, label: 'publish' },
    export:  { color: 'emerald', strokeWidth: 2, label: 'export' },
  },
}

// --- 02 · Request path -----------------------------------------------------
// Groups + focus stories: hover the gateway or the worker to see a declared
// path light up with its caption and steps.

const requestPath: ArcDiagramData = {
  id: 'ARC.REQ.002',
  layout: { width: 900, height: 460 },
  groups: [
    { id: 'edge', x: 22, y: 74, width: 244, height: 236, type: 'rect', color: 'sky',     label: 'Edge', dashed: true },
    { id: 'core', x: 300, y: 74, width: 300, height: 236, type: 'rect', color: 'violet', label: 'Core services', dashed: true },
  ],
  nodes: {
    client:  { x: 48,  y: 104, size: 'm' },
    gateway: { x: 48,  y: 214, size: 'm' },
    auth:    { x: 326, y: 104, size: 'm' },
    api:     { x: 326, y: 214, size: 'm' },
    queue:   { x: 640, y: 108, size: 's' },
    worker:  { x: 640, y: 212, size: 'm' },
    db:      { x: 640, y: 340, size: 's' },
  },
  nodeData: {
    client:  { icon: 'Smartphone', name: 'Client',      subtitle: 'Web / mobile',                                       color: 'zinc' },
    gateway: { icon: 'Shield',     name: 'Gateway',     subtitle: 'Rate limit + TLS', description: 'Public entrypoint.', color: 'sky' },
    auth:    { icon: 'Key',        name: 'Auth',        subtitle: 'OIDC',                                               color: 'violet' },
    api:     { icon: 'Server',     name: 'API',         subtitle: 'REST + RPC',       description: 'Request handling.',  color: 'blue' },
    queue:   { icon: 'Layers',     name: 'Queue',       subtitle: 'Durable',                                            color: 'amber' },
    worker:  { icon: 'Cpu',        name: 'Worker Pool', subtitle: 'Async jobs',                                         color: 'emerald' },
    db:      { icon: 'Database',   name: 'Postgres',    subtitle: 'Primary',                                            color: 'rose' },
  },
  connectors: [
    { from: 'client',  to: 'gateway', fromAnchor: 'bottom', toAnchor: 'top',   style: 'request' },
    { from: 'gateway', to: 'api',     fromAnchor: 'right',  toAnchor: 'left',  style: 'request' },
    { from: 'gateway', to: 'auth',    fromAnchor: 'right',  toAnchor: 'left',  style: 'verify' },
    { from: 'api',     to: 'queue',   fromAnchor: 'right',  toAnchor: 'left',  style: 'enqueue' },
    { from: 'queue',   to: 'worker',  fromAnchor: 'bottom', toAnchor: 'top',   style: 'enqueue' },
    { from: 'worker',  to: 'db',      fromAnchor: 'bottom', toAnchor: 'top',   style: 'write' },
    { from: 'api',     to: 'db',      fromAnchor: 'bottom', toAnchor: 'left',  style: 'read' },
  ],
  connectorStyles: {
    request: { color: 'blue',    strokeWidth: 2,   label: 'request' },
    verify:  { color: 'violet',  strokeWidth: 1.5, label: 'verify', dashed: true },
    enqueue: { color: 'amber',   strokeWidth: 2,   label: 'enqueue' },
    write:   { color: 'rose',    strokeWidth: 2,   label: 'write' },
    read:    { color: 'emerald', strokeWidth: 1.5, label: 'read', dashed: true },
  },
  focusTargets: {
    gateway: {
      mode: 'replace',
      nodes: ['client', 'gateway', 'auth', 'api'],
      connectors: [
        { from: 'client', to: 'gateway' },
        { from: 'gateway', to: 'auth' },
        { from: 'gateway', to: 'api' },
      ],
      caption: 'Every request is terminated at the edge, verified, then forwarded to the API.',
      steps: [
        { icon: 'Lock', label: 'Terminate TLS' },
        { icon: 'Key', label: 'Verify token' },
        { icon: 'ArrowRight', label: 'Forward' },
      ],
    },
    worker: {
      mode: 'replace',
      nodes: ['api', 'queue', 'worker', 'db'],
      connectors: [
        { from: 'api', to: 'queue' },
        { from: 'queue', to: 'worker' },
        { from: 'worker', to: 'db' },
      ],
      caption: 'Writes are acknowledged before the job runs — the worker owns the durable path.',
      steps: [
        { icon: 'ListPlus', label: 'Enqueue' },
        { icon: 'Cpu', label: 'Process' },
        { icon: 'Database', label: 'Commit' },
      ],
    },
  },
}

// --- 03 · Platform ---------------------------------------------------------
// Wide and dense: the case for the minimap, a fit zoom, and a busy key.

const platform: ArcDiagramData = {
  id: 'ARC.PLAT.003',
  layout: { width: 1180, height: 560 },
  groups: [
    { id: 'ingest',  x: 24,  y: 60,  width: 250, height: 400, type: 'rect', color: 'sky',     label: 'Ingest', dashed: true },
    { id: 'storage', x: 320, y: 60,  width: 270, height: 400, type: 'rect', color: 'amber',   label: 'Storage', dashed: true },
    { id: 'serving', x: 640, y: 60,  width: 500, height: 400, type: 'rect', color: 'emerald', label: 'Serving', dashed: true },
  ],
  nodes: {
    sdk:      { x: 52,  y: 96,  size: 's' },
    webhooks: { x: 52,  y: 190, size: 's' },
    stream:   { x: 52,  y: 300, size: 'm' },
    lake:     { x: 348, y: 96,  size: 'm' },
    warehouse:{ x: 348, y: 220, size: 'm' },
    catalog:  { x: 348, y: 350, size: 's' },
    jobs:     { x: 672, y: 96,  size: 'm' },
    api:      { x: 672, y: 240, size: 'm' },
    cache:    { x: 672, y: 366, size: 's' },
    console:  { x: 930, y: 130, size: 'm' },
    alerts:   { x: 930, y: 300, size: 's' },
  },
  nodeData: {
    sdk:       { icon: 'Code',          name: 'SDKs',       subtitle: 'ts / py / go',                                     color: 'sky' },
    webhooks:  { icon: 'Wifi',          name: 'Webhooks',   subtitle: 'Inbound',                                          color: 'sky' },
    stream:    { icon: 'Activity',      name: 'Stream',     subtitle: 'Kafka',        description: 'Ordered ingest bus.', color: 'blue' },
    lake:      { icon: 'HardDrive',     name: 'Lake',       subtitle: 'S3 / parquet',                                     color: 'amber' },
    warehouse: { icon: 'Database',      name: 'Warehouse',  subtitle: 'Columnar',     description: 'Modelled tables.',    color: 'amber' },
    catalog:   { icon: 'Folder',        name: 'Catalog',    subtitle: 'Lineage',                                          color: 'zinc' },
    jobs:      { icon: 'RefreshCw',     name: 'Jobs',       subtitle: 'dbt / spark',  description: 'Scheduled models.',   color: 'violet' },
    api:       { icon: 'Server',        name: 'Query API',  subtitle: 'GraphQL',      description: 'Serving layer.',      color: 'emerald' },
    cache:     { icon: 'Zap',           name: 'Cache',      subtitle: 'Redis',                                            color: 'rose' },
    console:   { icon: 'Monitor',       name: 'Console',    subtitle: 'Dashboards',                                       color: 'emerald' },
    alerts:    { icon: 'Bell',          name: 'Alerts',     subtitle: 'On-call',                                          color: 'orange' },
  },
  connectors: [
    { from: 'sdk',       to: 'stream',    fromAnchor: 'bottom', toAnchor: 'top',   style: 'events' },
    { from: 'webhooks',  to: 'stream',    fromAnchor: 'bottom', toAnchor: 'top',   style: 'events' },
    { from: 'stream',    to: 'lake',      fromAnchor: 'right',  toAnchor: 'left',  style: 'events' },
    { from: 'lake',      to: 'warehouse', fromAnchor: 'bottom', toAnchor: 'top',   style: 'batch' },
    { from: 'warehouse', to: 'catalog',   fromAnchor: 'bottom', toAnchor: 'top',   style: 'meta' },
    { from: 'warehouse', to: 'jobs',      fromAnchor: 'right',  toAnchor: 'left',  style: 'batch' },
    { from: 'jobs',      to: 'api',       fromAnchor: 'bottom', toAnchor: 'top',   style: 'serve' },
    { from: 'warehouse', to: 'api',       fromAnchor: 'right',  toAnchor: 'left',  style: 'serve' },
    { from: 'api',       to: 'cache',     fromAnchor: 'bottom', toAnchor: 'top',   style: 'cache' },
    { from: 'api',       to: 'console',   fromAnchor: 'right',  toAnchor: 'left',  style: 'serve' },
    { from: 'jobs',      to: 'alerts',    fromAnchor: 'right',  toAnchor: 'top',   style: 'signal' },
  ],
  connectorStyles: {
    events: { color: 'sky',     strokeWidth: 2,   label: 'events' },
    batch:  { color: 'amber',   strokeWidth: 2,   label: 'batch' },
    meta:   { color: 'zinc',    strokeWidth: 1.5, label: 'metadata', dashed: true },
    serve:  { color: 'emerald', strokeWidth: 2,   label: 'serve' },
    cache:  { color: 'rose',    strokeWidth: 1.5, label: 'cache', dashed: true },
    signal: { color: 'orange',  strokeWidth: 1.5, label: 'signal', dashed: true },
  },
  focusTargets: {
    api: {
      mode: 'replace',
      nodes: ['warehouse', 'jobs', 'api', 'cache', 'console'],
      connectors: [
        { from: 'warehouse', to: 'api' },
        { from: 'jobs', to: 'api' },
        { from: 'api', to: 'cache' },
        { from: 'api', to: 'console' },
      ],
      caption: 'Reads fan out from one serving API — modelled tables in, cached responses out.',
      steps: [
        { icon: 'Database', label: 'Read models' },
        { icon: 'Zap', label: 'Cache' },
        { icon: 'Monitor', label: 'Render' },
      ],
    },
  },
}

export const SHOWCASE_DOCS: ShowcaseDoc[] = [
  {
    id: 'pipeline',
    name: 'Pipeline',
    blurb: '5 nodes · 4 edges',
    demonstrates: 'Baseline legibility — typography, labels, anchors.',
    data: pipeline,
  },
  {
    id: 'request',
    name: 'Request path',
    blurb: '7 nodes · 7 edges · 2 groups',
    demonstrates: 'Focus stories and group boundaries. Hover Gateway or Worker Pool.',
    data: requestPath,
  },
  {
    id: 'platform',
    name: 'Data platform',
    blurb: '11 nodes · 11 edges · 3 groups',
    demonstrates: 'A dense canvas — fit zoom, minimap, and a six-entry key.',
    data: platform,
  },
]
