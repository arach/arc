---
title: Examples
description: Real-world diagram examples
order: 5
---

# Examples

## Complex Microservices Architecture

```tsx
const microservicesArchitecture: ArcDiagramData = {
  layout: { width: 900, height: 500 },
  nodes: {
    client: { x: 50, y: 200, size: 'l' },
    gateway: { x: 200, y: 200, size: 'm' },
    auth: { x: 400, y: 50, size: 'm' },
    users: { x: 400, y: 200, size: 'm' },
    orders: { x: 400, y: 350, size: 'm' },
    cache: { x: 600, y: 50, size: 's' },
    userDb: { x: 600, y: 200, size: 's' },
    orderDb: { x: 600, y: 350, size: 's' },
    queue: { x: 750, y: 275, size: 'm' },
  },
  nodeData: {
    client: { icon: 'Smartphone', name: 'Mobile App', color: 'violet' },
    gateway: { icon: 'Network', name: 'API Gateway', color: 'emerald' },
    auth: { icon: 'Shield', name: 'Auth Service', color: 'amber' },
    users: { icon: 'Users', name: 'User Service', color: 'blue' },
    orders: { icon: 'ShoppingCart', name: 'Order Service', color: 'rose' },
    cache: { icon: 'Zap', name: 'Redis', subtitle: 'Cache', color: 'orange' },
    userDb: { icon: 'Database', name: 'PostgreSQL', subtitle: 'Users', color: 'blue' },
    orderDb: { icon: 'Database', name: 'PostgreSQL', subtitle: 'Orders', color: 'rose' },
    queue: { icon: 'MessageSquare', name: 'RabbitMQ', color: 'sky' },
  },
  connectors: [
    { from: 'client', to: 'gateway', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'gateway', to: 'auth', fromAnchor: 'topRight', toAnchor: 'left', style: 'grpc' },
    { from: 'gateway', to: 'users', fromAnchor: 'right', toAnchor: 'left', style: 'grpc' },
    { from: 'gateway', to: 'orders', fromAnchor: 'bottomRight', toAnchor: 'left', style: 'grpc' },
    { from: 'auth', to: 'cache', fromAnchor: 'right', toAnchor: 'left', style: 'redis' },
    { from: 'users', to: 'userDb', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
    { from: 'orders', to: 'orderDb', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
    { from: 'orders', to: 'queue', fromAnchor: 'right', toAnchor: 'left', style: 'amqp' },
    { from: 'users', to: 'queue', fromAnchor: 'bottomRight', toAnchor: 'topLeft', style: 'amqp' },
  ],
  connectorStyles: {
    http: { color: 'violet', strokeWidth: 3, label: 'HTTPS' },
    grpc: { color: 'emerald', strokeWidth: 2, label: 'gRPC' },
    redis: { color: 'orange', strokeWidth: 2, dashed: true },
    sql: { color: 'blue', strokeWidth: 2, label: 'SQL' },
    amqp: { color: 'sky', strokeWidth: 2, label: 'AMQP', dashed: true },
  },
}
```

## Simple Three-Tier

```tsx
const threeTier: ArcDiagramData = {
  layout: { width: 600, height: 300 },
  nodes: {
    web: { x: 50, y: 100, size: 'm' },
    api: { x: 250, y: 100, size: 'm' },
    db: { x: 450, y: 100, size: 'm' },
  },
  nodeData: {
    web: { icon: 'Monitor', name: 'Web App', color: 'blue' },
    api: { icon: 'Server', name: 'API', color: 'emerald' },
    db: { icon: 'Database', name: 'Database', color: 'violet' },
  },
  connectors: [
    { from: 'web', to: 'api', fromAnchor: 'right', toAnchor: 'left', style: 'http' },
    { from: 'api', to: 'db', fromAnchor: 'right', toAnchor: 'left', style: 'sql' },
  ],
  connectorStyles: {
    http: { color: 'amber', strokeWidth: 2, label: 'HTTP' },
    sql: { color: 'sky', strokeWidth: 2, label: 'SQL' },
  },
}
```
