// @ts-nocheck
/**
 * Arc — powered by Hudson
 *
 * Alternate entry point that renders Arc inside Hudson's SoloShell.
 * Run with: pnpm dev:hudson (or vite --config vite.config.hudson.js)
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { ArcStandalone } from './standalone';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ArcStandalone />
  </StrictMode>,
);
