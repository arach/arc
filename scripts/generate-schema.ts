#!/usr/bin/env bun
/**
 * Regenerate `schemas/arc-diagram.schema.json` from the `ArcDiagramData` type.
 *
 * Uses ts-json-schema-generator (draft-07, `$ref` definitions, JSDoc carried
 * into `description`). The generator already emits `additionalProperties:
 * false` on closed object types; the post-pass below enforces it anyway so the
 * guarantee survives generator config drift. `Record<string, …>` maps (nodes,
 * nodeData, connectorStyles, focusTargets, layoutHints.*) are index-signature
 * objects, not closed types, so their keys stay open.
 *
 * Run: `bun run generate:schema`
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGenerator, type Schema } from 'ts-json-schema-generator'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const SCHEMA_PATH = join(REPO_ROOT, 'schemas', 'arc-diagram.schema.json')
const TYPE_PATH = join(REPO_ROOT, 'src', 'types', 'diagram.ts')
const TSCONFIG_PATH = join(REPO_ROOT, 'tsconfig.json')

interface ObjectDef {
  type?: string
  properties?: Record<string, unknown>
  additionalProperties?: unknown
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Deep-sort object keys so the artifact is stable and diff-friendly. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (!isPlainObject(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys(value[key])]),
  )
}

/** Build the draft-07 JSON Schema object for `ArcDiagramData`. */
export function buildSchema(): Schema {
  const schema = createGenerator({
    path: TYPE_PATH,
    tsconfig: TSCONFIG_PATH,
    type: 'ArcDiagramData',
    jsDoc: 'extended',
    additionalProperties: false,
    sortProps: true,
    topRef: true,
  }).createSchema('ArcDiagramData')

  // Closed object types reject invented fields; Record maps are index-signature
  // objects (their additionalProperties is a subschema) and stay open.
  const definitions = (schema.definitions ?? {}) as Record<string, ObjectDef>
  for (const def of Object.values(definitions)) {
    if (def?.type === 'object' && def.properties && def.additionalProperties === undefined) {
      def.additionalProperties = false
    }
  }
  return sortKeys(schema) as Schema
}

/** Canonical serialized form — the committed artifact is exactly this text. */
export function generateSchemaText(): string {
  return `${JSON.stringify(buildSchema(), null, 2)}\n`
}

if (import.meta.main) {
  mkdirSync(dirname(SCHEMA_PATH), { recursive: true })
  writeFileSync(SCHEMA_PATH, generateSchemaText())
  console.log(`wrote ${SCHEMA_PATH}`)
}
