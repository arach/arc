// @ts-nocheck
'use client';

/**
 * Arc Standalone — powered by Hudson SDK
 *
 * Replaces Arc's own chrome (TopBar, layout) with Hudson's shell
 * (NavigationBar, SidePanel, StatusBar, CommandPalette, Terminal).
 *
 * Usage:
 *   import { ArcStandalone } from '@arach/arc/hudson'
 *   // or: import { ArcStandalone } from './src/hudson/standalone'
 *
 *   function App() {
 *     return <ArcStandalone />
 *   }
 */

import { AppShell } from 'hudsonkit/shell';
import { arcApp } from './index';

export function ArcStandalone() {
  return <AppShell app={arcApp} />;
}
