// @ts-nocheck
'use client';

import { createElement } from 'react';
import type { HudsonApp } from 'hudsonkit';
import { GitBranch, ScanSearch } from 'lucide-react';
import { ArcProvider } from './ArcProvider';
import { ArcContent } from './ArcContent';
import { ArcInspector } from './ArcInspector';
import { useArcCommands, useArcStatus } from './hooks';

// Re-export standalone shell
export { ArcStandalone } from './standalone';

export const arcApp: HudsonApp = {
  id: 'arc',
  name: 'Arc',
  description: 'Visual diagram editor for architecture diagrams',
  mode: 'panel',

  rightPanel: {
    title: 'Properties',
    icon: createElement(ScanSearch, { size: 12 }),
  },

  Provider: ArcProvider,

  slots: {
    Content: ArcContent,
    Inspector: ArcInspector,
  },

  hooks: {
    useCommands: useArcCommands,
    useStatus: useArcStatus,
  },
};
