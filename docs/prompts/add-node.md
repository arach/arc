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

```
Add a new node to this Arc diagram:

{
  "nodes": { "frontend": { "x": 50, "y": 100, "size": "m" } },
  "nodeData": { "frontend": { "icon": "Monitor", "name": "Frontend", "color": "violet" } }
}

New node:
- Name: Cache Layer
- Icon: Database
- Color: amber
- Position: between Frontend and Backend
- Connect to: Backend via "Redis"
```

## Available Icons

Infrastructure: Server, Database, Cloud, CloudCog, HardDrive, Network, Cpu
Interfaces: Monitor, Smartphone, Laptop, Globe, Terminal
Services: MessageSquare, Mail, Bell, Shield, Lock, Key
