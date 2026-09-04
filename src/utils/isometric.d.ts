// Hand-authored type declarations for the JS implementation in `isometric.js`.
// Kept in sync with that file's exports so the rolled-up `lib/index.d.ts`
// resolves these public isometric utilities instead of leaving dangling
// source-relative imports. (`isometric.js` is plain JS, so vite-plugin-dts /
// api-extractor can't emit types for it on their own.)

/** Face of an isometric box / rectangle. */
export type IsoFace = 'top' | 'left' | 'right';

/** 2D screen point produced by the iso projection. */
export interface IsoScreenPoint {
  screenX: number;
  screenY: number;
}

/** Per-face shading colors (CSS color strings). */
export interface IsoShadingResult {
  top: string;
  right: string;
  left: string;
}

/** One shaded segment of a rounded box corner. */
export interface IsoBoxSegment {
  path: string;
  intensity: number;
}

/** The SVG paths that draw an isometric box: flat faces (path strings), rounded
 *  corners (arrays of shaded segments, empty when `radius` is 0), and outline. */
export interface IsoBoxPaths {
  top: string;
  left: string;
  right: string;
  cornerFrontLeft: IsoBoxSegment[];
  cornerFrontRight: IsoBoxSegment[];
  cornerBackLeft: IsoBoxSegment[];
  cornerBackRight: IsoBoxSegment[];
  outline: string;
}

/** Screen-space bounding box of an isometric box. */
export interface IsoBoundingBoxResult {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/** HSL preset for a named diagram color. */
export interface IsoColorDef {
  hue: number;
  saturation: number;
  lightness: number;
}

/** 30° in radians — the isometric projection angle. */
export declare const ISO_ANGLE: number;
export declare const COS_30: number;
export declare const SIN_30: number;

/** Preset HSL palettes matching Arc's diagram colors. */
export declare const ISO_COLORS: {
  violet: IsoColorDef;
  blue: IsoColorDef;
  cyan: IsoColorDef;
  emerald: IsoColorDef;
  amber: IsoColorDef;
  rose: IsoColorDef;
  slate: IsoColorDef;
  zinc: IsoColorDef;
};

/** Name of a preset iso color. */
export type IsoColorName = keyof typeof ISO_COLORS;

/** Convert 3D isometric coordinates to 2D screen coordinates. */
export declare function isoToScreen(x: number, y: number, z?: number): IsoScreenPoint;

/** Convert 2D screen coordinates to the isometric floor position (z = 0). */
export declare function screenToIsoFloor(screenX: number, screenY: number): { x: number; y: number };

/** Convert a canvas-space point to isometric floor coordinates. */
export declare function canvasToIsoFloor(
  canvasX: number,
  canvasY: number,
  originX: number,
  originY: number
): { x: number; y: number };

/** SVG path (`d` attribute) for an isometric rectangle on a given face. */
export declare function isoRect(width: number, height: number, face: IsoFace, originX?: number, originY?: number): string;

/** SVG path for a rectangle on the isometric floor (XY plane). */
export declare function isoFloorRect(
  x: number,
  y: number,
  width: number,
  depth: number,
  originX?: number,
  originY?: number,
  radius?: number,
  z?: number
): string;

/** SVG path for an ellipse (or circle) on the isometric floor (XY plane). */
export declare function isoFloorEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  originX?: number,
  originY?: number,
  z?: number,
  segments?: number
): string;

/** SVG path strings for an isometric box (cuboid) with its visible faces. */
export declare function isoBox(width: number, depth: number, height: number, originX?: number, originY?: number, radius?: number): IsoBoxPaths;

/** Standard iso face shading derived from a base HSL hue (or color name). */
export declare function isoShading(baseHue: number | string, saturation?: number, baseLightness?: number): IsoShadingResult;

/** Shading for a named preset color (falls back to `slate` when unknown). */
export declare function getColorShading(colorName: string): IsoShadingResult;

/** CSS `transform` value that projects a flat element onto an iso face. */
export declare function cssIsoTransform(face: IsoFace): string;

/** Screen-space bounding box of an isometric box. */
export declare function isoBoundingBox(width: number, depth: number, height: number, originX?: number, originY?: number): IsoBoundingBoxResult;
