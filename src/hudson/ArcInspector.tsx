// @ts-nocheck
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useDiagram, useEditorState, useViewMode } from '../components/editor/EditorProvider';
import { PropertiesInspectorContent } from '../components/editor/PropertiesPanel';

type InspectorSectionId = 'selection' | 'styles' | 'diagram';

function InspectorSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: InspectorSectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: InspectorSectionId) => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-neutral-800/50 last:border-b-0">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center gap-2 bg-neutral-900/30 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 transition-colors hover:bg-neutral-900/50 hover:text-neutral-300"
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-neutral-600 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
        <span className="flex-1">{title}</span>
      </button>
      {isOpen && (
        <div className="space-y-3 px-3 pb-3 pt-3 text-xs text-neutral-400">
          {children}
        </div>
      )}
    </div>
  );
}

function InspectorRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded px-1.5 py-0.5">
      <span className="text-[10px] uppercase tracking-wider text-neutral-600">{label}</span>
      <span className={`text-right text-[11px] text-neutral-300 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function ArcInspector() {
  const editor = useEditorState();
  const diagram = useDiagram();
  const viewMode = useViewMode();

  const hasNodeSelected = editor.selectedNodeIds?.length > 0;
  const hasConnectorSelected = editor.selectedConnectorIndex !== null;
  const hasGroupSelected = editor.selectedGroupId !== null;
  const hasImageSelected = editor.selectedImageId !== null;
  const hasSelection = hasNodeSelected || hasConnectorSelected || hasGroupSelected || hasImageSelected;

  const selectionSectionId: InspectorSectionId = hasSelection ? 'selection' : 'styles';
  const [openSections, setOpenSections] = useState<Set<InspectorSectionId>>(
    new Set([selectionSectionId, 'diagram']),
  );

  useEffect(() => {
    setOpenSections((prev) => {
      if (prev.has(selectionSectionId)) return prev;
      const next = new Set(prev);
      next.add(selectionSectionId);
      return next;
    });
  }, [selectionSectionId]);

  const toggleSection = (id: InspectorSectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedNodeId = editor.selectedNodeIds?.[0];
  const selectedConnector = hasConnectorSelected
    ? diagram.connectors[editor.selectedConnectorIndex]
    : null;
  const selectedGroup = hasGroupSelected
    ? diagram.groups?.find(group => group.id === editor.selectedGroupId)
    : null;
  const selectedImage = hasImageSelected
    ? diagram.images?.find(image => image.id === editor.selectedImageId)
    : null;

  const selectionTitle = hasNodeSelected
    ? 'Node'
    : hasConnectorSelected
      ? 'Connector'
      : hasGroupSelected
        ? 'Group'
        : hasImageSelected
          ? 'Image'
          : 'Styles';

  const selectionValue = hasNodeSelected
    ? editor.selectedNodeIds.length > 1
      ? `${editor.selectedNodeIds.length} nodes`
      : diagram.nodeData[selectedNodeId]?.name || selectedNodeId
    : hasConnectorSelected
      ? `${diagram.nodeData[selectedConnector?.from]?.name || selectedConnector?.from} → ${diagram.nodeData[selectedConnector?.to]?.name || selectedConnector?.to}`
      : hasGroupSelected
        ? selectedGroup?.label || editor.selectedGroupId
      : hasImageSelected
          ? selectedImage?.name || editor.selectedImageId
          : `${Object.keys(diagram.connectorStyles).length} connector styles`;
  const selectionRowLabel = hasSelection ? 'Selected' : 'Styles';

  return (
    <div className="flex h-full flex-col overflow-hidden text-[10px]">
      <div className="flex-1 overflow-y-auto">
        <InspectorSection
          id={selectionSectionId}
          title={selectionTitle}
          isOpen={openSections.has(selectionSectionId)}
          onToggle={toggleSection}
        >
          <InspectorRow label={selectionRowLabel} value={selectionValue} />
          <PropertiesInspectorContent variant="hudson" />
        </InspectorSection>

        <InspectorSection
          id="diagram"
          title="Diagram"
          isOpen={openSections.has('diagram')}
          onToggle={toggleSection}
        >
          <InspectorRow label="Nodes" value={String(Object.keys(diagram.nodes).length)} mono />
          <InspectorRow label="Connectors" value={String(diagram.connectors.length)} mono />
          <InspectorRow label="Groups" value={String(diagram.groups?.length ?? 0)} mono />
          <InspectorRow label="Images" value={String(diagram.images?.length ?? 0)} mono />
          <InspectorRow label="View" value={viewMode === 'isometric' ? 'Isometric' : '2D'} />
        </InspectorSection>
      </div>
    </div>
  );
}
