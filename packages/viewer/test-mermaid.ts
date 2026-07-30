import { importMermaid } from './src/mermaid'

// Test 1: Flowchart from OpenScout architecture.md
const flowchart = `flowchart TD
    CONV["Conversation"] -->|contains| MSG["Message"]
    MSG -->|fans out into| DEL["Delivery intent"]
    INV["Invocation"] -->|creates| FLIGHT["Flight"]
    FLIGHT -->|updates| STATE["queued → running → waiting → completed / failed"]
    INV -->|routes through| DEL
    BIND["Binding"] -->|maps conversation to| EXT["External thread / channel"]
    DEL -->|targets| TARGET["Agent endpoint / bridge / device"]
    MSG -. append-only facts .-> EVENT["Control events"]
    INV -. append-only facts .-> EVENT
    FLIGHT -. append-only facts .-> EVENT
    DEL -. append-only facts .-> EVENT`

const r1 = importMermaid(flowchart)
console.log('=== Flowchart ===')
console.log('Nodes:', Object.keys(r1.diagram.nodes).length)
console.log('Connectors:', r1.diagram.connectors.length)
console.log('Warnings:', r1.warnings)
console.log('Unsupported:', r1.unsupported)
console.log('Node names:', Object.entries(r1.diagram.nodeData).map(([k, v]) => `${k}=${v.name}`).join(', '))
console.log()

// Test 2: Sequence diagram
const sequence = `sequenceDiagram
    participant S as "Surface"
    participant B as "Broker"
    participant H as "Agent Endpoint"
    participant DB as "Store"

    S->>B: Post message or invocation
    B->>DB: Persist record and append event
    B->>H: Route delivery / wake target
    H->>B: Flight update
    B->>DB: Persist flight state
    H->>B: Result message, status, or artifact
    B->>DB: Persist output and append event
    B-->>S: Stream updated state`

const r2 = importMermaid(sequence)
console.log('=== Sequence Diagram ===')
console.log('Nodes:', Object.keys(r2.diagram.nodes).length)
console.log('Connectors:', r2.diagram.connectors.length)
console.log('Warnings:', r2.warnings)
console.log('Unsupported:', r2.unsupported)
console.log('Node names:', Object.entries(r2.diagram.nodeData).map(([k, v]) => `${k}=${v.name}`).join(', '))
console.log()

// Test 3: State diagram
const state = `stateDiagram-v2
    [*] --> Installed: scout init
    Installed --> Starting: launchd starts broker
    Starting --> Healthy: health check passes
    Starting --> Failed: startup error
    Failed --> Starting: keepalive restart
    Healthy --> Recovering: reboot / crash / process exit
    Recovering --> Starting: reload durable state
    Healthy --> Healthy: append records + stream projections`

const r3 = importMermaid(state)
console.log('=== State Diagram ===')
console.log('Nodes:', Object.keys(r3.diagram.nodes).length)
console.log('Connectors:', r3.diagram.connectors.length)
console.log('Warnings:', r3.warnings)
console.log('Unsupported:', r3.unsupported)
console.log('Node names:', Object.entries(r3.diagram.nodeData).map(([k, v]) => `${k}=${v.name}`).join(', '))
console.log('Layout:', r3.diagram.layout)
