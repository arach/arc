/** @type {import('@dewey/cli').DeweyConfig} */
export default {
  project: {
    name: 'arc',
    tagline: 'Visual diagram editor for creating architecture diagrams',
    type: 'generic',
  },

  agent: {
    // Critical context that AI agents MUST know
    criticalContext: [
      // Add project-specific rules here
      // 'NEVER do X when Y',
      // 'Always check Z before modifying W',
    ],

    // Key entry points for navigating the codebase
    entryPoints: {
      // 'main': 'src/',
      // 'config': 'config/',
    },

    // Pattern-based navigation hints
    rules: [
      // { pattern: 'database', instruction: 'Check src/db/ for database code' },
    ],

    // Which doc sections to include in AGENTS.md
    sections: ['overview', 'quickstart', 'api'],
  },

  docs: {
    path: './docs',
    output: './',
    required: ['overview', 'quickstart'],
  },
}
