# Add a Node to Diagram

## Prompt Template

```
Add a new node to this Arc diagram:

[PASTE EXISTING DIAGRAM CONFIG]

New node:
- Name: [NODE NAME]
- Icon: [ICON NAME from Lucide]
- Color: [violet|emerald|blue|amber|sky|zinc|rose|orange]
- Position: [DESCRIBE where it should go]
- Connect to: [EXISTING NODE] via [LABEL]
```

## Example

**Existing diagram:**
```json
{
  "nodes": {
    "frontend": { "x": 50, "y": 100, "size": "m" },
    "backend": { "x": 250, "y": 100, "size": "m" }
  },
  "nodeData": {
    "frontend": { "icon": "Monitor", "name": "Frontend", "color": "violet" },
    "backend": { "icon": "Server", "name": "Backend", "color": "emerald" }
  },
  "connectors": [
    { "from": "frontend", "to": "backend", "fromAnchor": "right", "toAnchor": "left", "style": "api" }
  ]
}
```

**Prompt:**
> Add a Cache Layer node between Frontend and Backend. Use the Database icon, amber color, and connect it to Backend via "Redis".

**Expected result:** Agent adds a new node at x: 150, y: 100, updates nodeData with icon/name/color, and creates a connector from cache to backend.

## Available Icons

| Category | Icons |
|----------|-------|
| Infrastructure | Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu |
| Interfaces | Monitor, Smartphone, Laptop, Globe, Terminal |
| Services | MessageSquare, Mail, Bell, Shield, Lock, Key |
| Data | FileText, Folder, Package, Archive, Layers |
| Connectivity | Wifi, Radio, Plug, Cable, Router |

## Valid Values

| Property | Options |
|----------|---------|
| size | `s`, `m`, `l` |
| color | `violet`, `emerald`, `blue`, `amber`, `sky`, `zinc`, `rose`, `orange` |
| anchor | `left`, `right`, `top`, `bottom`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight` |
