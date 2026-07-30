// @ts-nocheck
'use client';

import DiagramCanvas from '../components/editor/DiagramCanvas';
import FloatingToolbar from '../components/editor/FloatingToolbar';
import ErrorBoundary from '../components/ErrorBoundary';

export function ArcContent() {
  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 relative overflow-hidden">
        <div className="w-full h-full">
          <ErrorBoundary>
            <DiagramCanvas
              embedConfig={{ enableViewModeToggle: true }}
              isDark={true}
            />
          </ErrorBoundary>
        </div>
        <FloatingToolbar />
      </div>
    </div>
  );
}
