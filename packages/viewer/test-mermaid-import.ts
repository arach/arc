import { describe, expect, test } from 'bun:test'
import { importMermaid } from './src/importMermaid'

describe('Mermaid architecture projection', () => {
  test('imports a flowchart after comments and preserves structured labels', () => {
    const result = importMermaid(`%% reviewed architecture source
      %%{init: { "theme": "neutral" }}%%
      flowchart LR
        APP["Web app<br/>React<br />Public surface"] -->|HTTPS| API[API]
        API -. events .-> QUEUE[Message queue]`)

    expect(result.warnings).toEqual([])
    expect(result.unsupported).toEqual([])
    expect(Object.keys(result.diagram.nodes)).toEqual(['APP', 'API', 'QUEUE'])
    expect(result.diagram.nodeData.APP).toMatchObject({
      name: 'Web app',
      subtitle: 'React',
      description: 'Public surface',
    })
    expect(result.diagram.connectors).toHaveLength(2)
    expect(result.diagram.connectorStyles.e0).toMatchObject({ label: 'HTTPS' })
    expect(result.diagram.connectorStyles.e1).toMatchObject({ label: 'events', dashed: true })
  })

  test('reports unsupported flowchart capabilities once', () => {
    const result = importMermaid(`flowchart TD
      subgraph Runtime
        direction LR
        A --> B
      end
      classDef service fill:#fff
      class A service
      style B stroke:#000
      linkStyle 0 stroke:#999`)

    expect(result.diagram.connectors).toHaveLength(1)
    expect(result.unsupported).toEqual([
      'direction directives',
      'subgraph',
      'styling directives',
      'click/linkStyle',
    ])
  })

  test('imports compact edges without requiring whitespace around arrows', () => {
    const result = importMermaid(`flowchart LR
      A[App]-->B[API]`)

    expect(result.warnings).toEqual([])
    expect(result.unsupported).toEqual([])
    expect(Object.keys(result.diagram.nodes)).toEqual(['A', 'B'])
    expect(result.diagram.nodeData.A.name).toBe('App')
    expect(result.diagram.nodeData.B.name).toBe('API')
    expect(result.diagram.connectors).toHaveLength(1)
    expect(result.diagram.connectors[0]).toMatchObject({ from: 'A', to: 'B' })
  })

  test('expands chained edges into one connector per hop', () => {
    const result = importMermaid(`flowchart LR
      A --> B --> C`)

    expect(result.warnings).toEqual([])
    expect(Object.keys(result.diagram.nodes)).toEqual(['A', 'B', 'C'])
    expect(result.diagram.connectors).toHaveLength(2)
    expect(result.diagram.connectors[0]).toMatchObject({ from: 'A', to: 'B' })
    expect(result.diagram.connectors[1]).toMatchObject({ from: 'B', to: 'C' })
  })

  test('preserves labels from decision and hexagon node shapes', () => {
    const result = importMermaid(`flowchart LR
      A{Is valid?} --> B{{Decision service}} --> C[Done]`)

    expect(result.warnings).toEqual([])
    expect(result.diagram.nodeData.A.name).toBe('Is valid?')
    expect(result.diagram.nodeData.B.name).toBe('Decision service')
    expect(result.diagram.nodeData.C.name).toBe('Done')
    expect(result.diagram.connectors).toHaveLength(2)
  })

  test('imports state transitions with stable start and end nodes', () => {
    const result = importMermaid(`stateDiagram-v2
      [*] --> Ready: boot
      state "Ready to work" as Ready
      Ready --> Done: finish
      Done --> [*]`)

    expect(result.warnings).toEqual([])
    expect(result.unsupported).toEqual([])
    expect(result.diagram.nodeData.__start__.name).toBe('Start')
    expect(result.diagram.nodeData.Ready.name).toBe('Ready to work')
    expect(result.diagram.nodeData.__end__.name).toBe('End')
    expect(result.diagram.connectors).toHaveLength(3)
  })

  test('makes lossy sequence projection explicit', () => {
    const result = importMermaid(`sequenceDiagram
      participant App
      participant API
      App->>API: Load diagram
      API-->>App: Typed result`)

    expect(result.diagram.connectors).toHaveLength(2)
    expect(result.warnings).toContain(
      'sequenceDiagram is projected to architecture nodes and connectors; use parseMermaid() or <ArcMermaid /> to preserve sequence semantics',
    )
  })

  test('keeps normalized identifier collisions distinct and visible', () => {
    const result = importMermaid(`sequenceDiagram
      participant api.v1
      participant api/v1
      api.v1->>api/v1: Compare`)

    expect(Object.keys(result.diagram.nodes)).toEqual(['api_v1', 'api_v1_2'])
    expect(result.diagram.connectors[0]).toMatchObject({
      from: 'api_v1',
      to: 'api_v1_2',
    })
    expect(result.warnings).toContain(
      'Mermaid identifier "api/v1" was mapped to "api_v1_2" to avoid an Arc ID collision',
    )
  })

  test('returns an explicit result for unknown declarations', () => {
    const result = importMermaid('mindmap\n  root((Arc))')

    expect(result.diagram.nodes).toEqual({})
    expect(result.warnings).toEqual(['Unrecognized diagram type: "mindmap"'])
    expect(result.unsupported).toEqual(['mindmap'])
  })
})
