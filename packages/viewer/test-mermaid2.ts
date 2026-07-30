import { importMermaid } from './src/mermaid'

// Test: Flowchart with subgraph from message-format.md
const flowchartLR = `flowchart LR
    subgraph Canonical["Canonical broker state"]
        M["Messages"]
        I["Invocations"]
        F["Flights"]
        D["Deliveries"]
        E["Events"]
    end

    LINE["Rendered relay line"]

    M --> LINE
    I -. omitted .-> LINE
    F -. omitted .-> LINE
    D -. omitted .-> LINE
    E -. omitted .-> LINE`

const r = importMermaid(flowchartLR)
console.log('=== Flowchart LR with subgraph ===')
console.log('Nodes:', Object.keys(r.diagram.nodes).length)
console.log('Connectors:', r.diagram.connectors.length)
console.log('Warnings:', r.warnings)
console.log('Unsupported:', r.unsupported)
console.log('Node names:', Object.entries(r.diagram.nodeData).map(([k, v]) => `${k}=${v.name}`).join(', '))
