import { default as ArcDiagram } from './player/ArcDiagram';
import { configToYaml } from './utils/yamlConfig';
import { default as DiagramCanvas } from './components/editor/DiagramCanvas';
import { default as DiagramEditor } from './components/editor/DiagramEditor';
import { EditorProvider } from './components/editor/EditorProvider';
import { getColorShading } from './utils/isometric';
import { ISO_COLORS } from './utils/isometric';
import { isoBoundingBox } from './utils/isometric';
import { isoBox } from './utils/isometric';
import { isoShading } from './utils/isometric';
import { isoToScreen } from './utils/isometric';
import { parseYamlConfig } from './utils/yamlConfig';
import { renderToElement } from './player/vanilla';
import { renderToString } from './player/vanilla';
import { screenToIsoFloor } from './utils/isometric';
import { useDiagram } from './components/editor/EditorProvider';
import { useEditor } from './components/editor/EditorProvider';
import { useEditorState } from './components/editor/EditorProvider';
import { useViewMode } from './components/editor/EditorProvider';

export { ArcDiagram }

export { configToYaml }

export declare interface ConnectorStyle {
    color: string;
    strokeWidth: number;
    label?: string;
    dashed?: boolean;
    bidirectional?: boolean;
    animated?: boolean;
    showArrow?: boolean;
    showEndpoints?: boolean;
}

export { DiagramCanvas }

export declare interface DiagramConfig {
    id?: string;
    title: string;
    description?: string;
    theme: 'dark' | 'light';
    canvas: {
        width: number;
        height: number;
    };
    origin: {
        x: number;
        y: number;
    };
    cornerRadius?: number;
    tiers: TierConfig[];
    floorSize: {
        width: number;
        depth: number;
    };
    nodes: DiagramNode[];
    pillars?: {
        x: number;
        y: number;
        fromTier: number;
        toTier: number;
    }[];
}

export { DiagramEditor }

export declare interface DiagramNode {
    tier: number;
    x: number;
    y: number;
    width: number;
    depth: number;
    height: number;
    color: string;
    label: string;
    opacity?: number;
    blur?: number;
    translucent?: boolean;
}

export { EditorProvider }

export declare interface EmbedConfig {
    defaultViewMode?: ViewMode;
    enableViewModeToggle?: boolean;
    enableZoom?: boolean;
    enablePan?: boolean;
    enableDrag?: boolean;
    enableSelection?: boolean;
    showZoomControls?: boolean;
    showMiniMap?: boolean;
    showGrid?: boolean;
}

export { getColorShading }

export { ISO_COLORS }

export { isoBoundingBox }

export { isoBox }

export { isoShading }

export { isoToScreen }

export declare interface NodePosition {
    x: number;
    y: number;
    size: NodeSize;
    width?: number;
    height?: number;
    z?: number;
    isoHeight?: number;
    isoDepth?: number;
}

declare type NodeSize = 'large' | 'normal' | 'small';

export { parseYamlConfig }

export { renderToElement }

export { renderToString }

export { screenToIsoFloor }

/**
 * Arc Player Types
 */
export declare interface TierConfig {
    name: string;
    elevation: number;
    floorColor?: string;
    floorOpacity?: number;
    borderColor?: string;
    nodeOpacity?: number;
    blur?: number;
}

export { useDiagram }

export { useEditor }

export { useEditorState }

export { useViewMode }

export declare type ViewMode = '2d' | 'isometric';

export { }
