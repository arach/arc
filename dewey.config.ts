/** @type {import('@arach/dewey').DeweyConfig} */
export default {
  project: {
    name: 'arc',
    tagline: 'Diagrams as Code - Visual editor for architecture diagrams that live in your codebase',
    type: 'react-library',
  },

  agent: {
    criticalContext: [
      'Arc exports two npm packages: @arach/arc (full editor) and @arach/arc-player (lightweight renderer)',
      'Diagrams are stored as declarative JSON/TypeScript configs, not binary files',
      'The editor uses useReducer + Context for state management (EditorProvider)',
      'Never modify diagram configs without understanding the schema in src/types/',
      'Exports should be deterministic - same input = same output for diffability',
    ],

    entryPoints: {
      'editor': 'src/components/editor/',
      'properties': 'src/components/properties/',
      'utils': 'src/utils/',
      'types': 'src/types/',
      'player': 'src/player/',
      'lib-entry': 'src/index.ts',
    },

    rules: [
      { pattern: 'diagram state', instruction: 'Check EditorProvider.tsx and editorReducer.ts' },
      { pattern: 'node|connector|group', instruction: 'See src/types/diagram.ts for type definitions' },
      { pattern: 'export|render', instruction: 'Look at src/utils/exportUtils.ts and src/player/' },
      { pattern: 'isometric|3d', instruction: 'See src/utils/isometric.ts and IsometricNodeLayer.tsx' },
    ],

    sections: ['overview', 'quickstart', 'api', 'examples', 'architecture'],
  },

  docs: {
    path: './docs',
    output: './docs',
    required: ['overview', 'quickstart', 'api'],
  },
}
