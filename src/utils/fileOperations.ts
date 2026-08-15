import { validateDiagramShape } from './diagramValidation'

// Extend window for File System Access API
declare global {
  interface Window {
    showSaveFilePicker?: (options?: any) => Promise<any>
    showOpenFilePicker?: (options?: any) => Promise<any[]>
  }
}

// Save diagram to file using File System Access API
export async function saveDiagram(diagram: any, suggestedName = 'diagram.json') {
  const json = JSON.stringify(diagram, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  try {
    // Try modern File System Access API
    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Arc Diagram',
          accept: { 'application/json': ['.json'] }
        }]
      })

      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()

      return handle.name
    }
  } catch (err) {
    if (err.name === 'AbortError') return null // User cancelled
    console.error('Save failed:', err)
  }

  // Fallback: download link
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return suggestedName
}

/**
 * Outcome of an open. `null` means the user cancelled — the one case with
 * nothing to say. Anything else either loaded or has a reason it didn't, so a
 * caller can never mistake a failure for an empty diagram.
 */
export type LoadResult =
  | { diagram: any; filename: string; error?: undefined }
  | { error: string; diagram?: undefined; filename?: undefined }

function readDiagramFile(file: File): Promise<LoadResult> {
  return file.text().then(text => {
    let diagram: unknown
    try {
      diagram = JSON.parse(text)
    } catch (parseErr) {
      console.error('Invalid JSON in diagram file:', parseErr)
      return { error: `${file.name} is not valid JSON.` }
    }
    const problem = validateDiagramShape(diagram)
    if (problem) {
      return { error: `${file.name} is not an Arc diagram — ${problem}.` }
    }
    return { diagram, filename: file.name }
  })
}

// Load diagram from file
export async function loadDiagram(): Promise<LoadResult | null> {
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Arc Diagram',
          accept: { 'application/json': ['.json'] }
        }]
      })
      return await readDiagramFile(await handle.getFile())
    } catch (err) {
      // Cancelling is not a failure; anything else is worth reporting rather
      // than silently falling through to a second file dialog.
      if ((err as Error).name === 'AbortError') return null
      console.error('Load failed:', err)
      return { error: (err as Error).message || 'Could not read that file.' }
    }
  }

  // Fallback: file input
  return new Promise<LoadResult | null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.style.display = 'none'
    document.body.appendChild(input)

    const done = (result: LoadResult | null) => {
      input.remove()
      resolve(result)
    }

    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return done(null)
      void readDiagramFile(file).then(done)
    }
    // Firefox and Safari fire `cancel` on dismiss; without it the promise —
    // and the caller awaiting it — would hang for the life of the page.
    input.oncancel = () => done(null)

    input.click()
  })
}

// Export diagram in HANDOFF.md format for Talkie
export function exportForTalkie(diagram) {
  // Convert nodeData to have unquoted icon references (as comments indicate)
  const nodeDataStr = JSON.stringify(diagram.nodeData, null, 2)
    .replace(/"icon": "(\w+)"/g, 'icon: $1')

  return `## Diagram Config Update

Here are the updated values to paste into ArchitectureDiagram.jsx:

### nodes
\`\`\`js
const nodes = ${JSON.stringify(diagram.nodes, null, 2)};
\`\`\`

### connectors
\`\`\`js
const connectors = ${JSON.stringify(diagram.connectors, null, 2)};
\`\`\`

### connectorStyles
\`\`\`js
const connectorStyles = ${JSON.stringify(diagram.connectorStyles, null, 2)};
\`\`\`

### nodeData
\`\`\`js
const nodeData = ${nodeDataStr};
\`\`\`
`
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Copy failed:', err)
    return false
  }
}
