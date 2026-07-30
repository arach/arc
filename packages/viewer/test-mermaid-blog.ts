import { describe, expect, test } from 'bun:test'
import { importMermaid } from './src/mermaid'

const openScoutBlogFigure = `%% OpenScout blog figure: local transport vs paid model inference
%% Render target: /blog/how-agents-learn-to-speak-scout.svg
flowchart TB
  subgraph localTransport["Local transport — no model meter"]
    direction TB
    Operator["Operator"]
    Menu["Scout Menu<br/>native compose"]
    Broker["Local broker<br/>records + routing"]
    SSE["Broker SSE<br/>message.posted"]

    Operator -->|"type message"| Menu
    Menu -->|"POST /api/send"| Broker
    Broker -->|"event stream /api/events"| SSE
    SSE -->|"UI append"| Menu
  end

  subgraph paidInference["Paid model inference — harness account"]
    direction TB
    Scoutbot["Scoutbot<br/>low reasoning · allowlisted Scout MCP<br/>no shell · no codebase writes"]
    ProjectAgent["Optional project agent<br/>role prompt · tools · AGENTS.md<br/>Scout skill · reply context"]
    RepoTools["Repo / harness tools<br/>read · edit · shell as granted"]

    Scoutbot -->|"ask when work needs a repo owner"| ProjectAgent
    ProjectAgent --> RepoTools
    RepoTools --> ProjectAgent
  end

  Broker -->|"wake concierge if targeted"| Scoutbot
  Scoutbot -->|"messages_send / ask · broker writes"| Broker
  ProjectAgent -->|"final reply / progress via broker"| Broker

  classDef free fill:#ecfdf5,stroke:#059669,color:#064e3b
  class Operator,Menu,Broker,SSE free
`

describe('OpenScout blog Mermaid import', () => {
  test('accepts comments before the declaration and preserves topology', () => {
    const result = importMermaid(openScoutBlogFigure, {
      width: 960,
      height: 560,
      defaultSize: 'l',
    })

    expect(Object.keys(result.diagram.nodes)).toEqual([
      'Operator',
      'Menu',
      'Broker',
      'SSE',
      'Scoutbot',
      'ProjectAgent',
      'RepoTools',
    ])
    expect(result.diagram.connectors).toHaveLength(10)
    expect(result.warnings).toEqual([])
    expect(result.unsupported).toEqual([
      'subgraph',
      'direction directives',
      'styling directives',
    ])
  })

  test('maps Mermaid line breaks into structured Arc node copy', () => {
    const { diagram } = importMermaid(openScoutBlogFigure)

    expect(diagram.nodeData.Menu).toMatchObject({
      name: 'Scout Menu',
      subtitle: 'native compose',
    })
    expect(diagram.nodeData.Scoutbot).toMatchObject({
      name: 'Scoutbot',
      subtitle: 'low reasoning · allowlisted Scout MCP',
      description: 'no shell · no codebase writes',
    })
    expect(diagram.nodeData.Operator.name).toBe('Operator')
  })

  test('returns a useful diagnostic for comment-only input', () => {
    const result = importMermaid('%% no diagram yet')

    expect(result.diagram.connectors).toEqual([])
    expect(result.warnings).toEqual([
      'Mermaid source does not contain a diagram declaration',
    ])
  })
})
