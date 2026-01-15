# Create a New Diagram

## Prompt Template

```
Create an Arc diagram for [DESCRIBE YOUR SYSTEM].

The diagram should include:
- [LIST COMPONENTS: e.g., frontend, API, database]
- [DESCRIBE CONNECTIONS: e.g., REST API between frontend and backend]

Use the Arc diagram format with nodes, connectors, and styles.
```

## Example

```
Create an Arc diagram for a user authentication system.

The diagram should include:
- Web client (browser)
- Auth service
- User database
- Token cache (Redis)

Connections:
- Client → Auth service: Login request
- Auth service → Database: User lookup
- Auth service → Redis: Token storage
```

## Expected Output

A complete `ArcDiagramData` object with:
- `layout` dimensions
- `nodes` with positions
- `nodeData` with icons, names, colors
- `connectors` linking components
- `connectorStyles` with labels
