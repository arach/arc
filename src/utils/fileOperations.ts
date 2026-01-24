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

// Load diagram from file
export async function loadDiagram() {
  try {
    // Try modern File System Access API
    if ('showOpenFilePicker' in window) {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Arc Diagram',
          accept: { 'application/json': ['.json'] }
        }]
      })

      const file = await handle.getFile()
      const text = await file.text()

      try {
        const diagram = JSON.parse(text)
        return { diagram, filename: handle.name }
      } catch (parseErr) {
        console.error('Invalid JSON in diagram file:', parseErr)
        alert('The selected file contains invalid JSON. Please check the file format.')
        return null
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null // User cancelled
    console.error('Load failed:', err)
  }

  // Fallback: file input
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const text = await file.text()
        const diagram = JSON.parse(text)
        resolve({ diagram, filename: file.name })
      } catch (err) {
        console.error('Parse error:', err)
        resolve(null)
      }
    }

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
