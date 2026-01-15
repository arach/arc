/// <reference types="vite/client" />

// Type declarations for Vite's ?raw imports
declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '*.txt?raw' {
  const content: string
  export default content
}
