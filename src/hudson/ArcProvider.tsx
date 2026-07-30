// @ts-nocheck
'use client';

import type { ReactNode } from 'react';
import { EditorProvider } from '../components/editor/EditorProvider';

const defaultDiagram = {
  layout: { width: 1600, height: 900 },
  grid: { enabled: true, size: 24, color: '#71717a', opacity: 0.1, type: 'dots' },
  nodes: {},
  nodeData: {},
  connectors: [],
  connectorStyles: {},
};

export function ArcProvider({ children }: { children: ReactNode }) {
  return (
    <EditorProvider
      initialDiagram={defaultDiagram}
      initialColorMode="dark"
    >
      {children}
    </EditorProvider>
  );
}
