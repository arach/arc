/**
 * Isometric Projection Utilities
 *
 * Isometric projection displays 3D objects in 2D without perspective distortion.
 * All three axes are equally foreshortened at 30° angles.
 *
 * Coordinate system:
 *   - X axis: 30° down-right (width)
 *   - Y axis: 30° down-left (depth)
 *   - Z axis: straight up (height)
 *
 * The transformation matrix for isometric:
 *   screenX = (x - y) * cos(30°)
 *   screenY = (x + y) * sin(30°) - z
 */

// Isometric angles
export const ISO_ANGLE = 30 * (Math.PI / 180); // 30 degrees in radians
export const COS_30 = Math.cos(ISO_ANGLE); // ≈ 0.866
export const SIN_30 = Math.sin(ISO_ANGLE); // = 0.5

/**
 * Convert 3D isometric coordinates to 2D screen coordinates
 * @param {number} x - Position along X axis (right-forward)
 * @param {number} y - Position along Y axis (left-forward)
 * @param {number} z - Position along Z axis (up)
 * @returns {{ screenX: number, screenY: number }}
 */
export function isoToScreen(x, y, z = 0) {
  return {
    screenX: (x - y) * COS_30,
    screenY: (x + y) * SIN_30 - z
  };
}

/**
 * Convert 2D screen coordinates to isometric floor position (z=0)
 * Useful for mouse interaction on the ground plane
 * @param {number} screenX
 * @param {number} screenY
 * @returns {{ x: number, y: number }}
 */
export function screenToIsoFloor(screenX, screenY) {
  // Inverse of the iso transform at z=0
  const x = (screenX / COS_30 + screenY / SIN_30) / 2;
  const y = (screenY / SIN_30 - screenX / COS_30) / 2;
  return { x, y };
}

/**
 * Generate SVG path points for an isometric rectangle on a specific face
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {'top' | 'left' | 'right'} face - Which face to project onto
 * @param {number} originX - Screen X origin
 * @param {number} originY - Screen Y origin
 * @returns {string} SVG path d attribute
 */
export function isoRect(width, height, face, originX = 0, originY = 0) {
  let points;

  switch (face) {
    case 'top':
      // Rectangle on the XY plane (floor/ceiling)
      points = [
        isoToScreen(0, 0, 0),
        isoToScreen(width, 0, 0),
        isoToScreen(width, height, 0),
        isoToScreen(0, height, 0),
      ];
      break;

    case 'left':
      // Rectangle on the YZ plane (left wall)
      points = [
        isoToScreen(0, 0, 0),
        isoToScreen(0, width, 0),
        isoToScreen(0, width, height),
        isoToScreen(0, 0, height),
      ];
      break;

    case 'right':
      // Rectangle on the XZ plane (right wall)
      points = [
        isoToScreen(0, 0, 0),
        isoToScreen(width, 0, 0),
        isoToScreen(width, 0, height),
        isoToScreen(0, 0, height),
      ];
      break;

    default:
      throw new Error(`Unknown face: ${face}`);
  }

  // Translate to origin and build path
  const translated = points.map(p => ({
    x: p.screenX + originX,
    y: p.screenY + originY
  }));

  return `M ${translated.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
}

/**
 * Generate an isometric box (cuboid) with all visible faces
 * @param {number} width - Size along X axis
 * @param {number} depth - Size along Y axis
 * @param {number} height - Size along Z axis
 * @param {number} originX - Screen X origin (bottom center point)
 * @param {number} originY - Screen Y origin (bottom center point)
 * @returns {{ top: string, left: string, right: string, outline: string }}
 */
export function isoBox(width, depth, height, originX = 0, originY = 0) {
  // Calculate the 8 corners of the box
  const corners = {
    // Bottom face
    frontBottom: isoToScreen(width, 0, 0),
    rightBottom: isoToScreen(width, depth, 0),
    backBottom: isoToScreen(0, depth, 0),
    leftBottom: isoToScreen(0, 0, 0),
    // Top face
    frontTop: isoToScreen(width, 0, height),
    rightTop: isoToScreen(width, depth, height),
    backTop: isoToScreen(0, depth, height),
    leftTop: isoToScreen(0, 0, height),
  };

  // Translate all corners
  const t = (corner) => ({
    x: corner.screenX + originX,
    y: corner.screenY + originY
  });

  const c = Object.fromEntries(
    Object.entries(corners).map(([k, v]) => [k, t(v)])
  );

  // Build paths for each visible face
  // Top face (always visible from isometric view)
  const top = `M ${c.leftTop.x},${c.leftTop.y} L ${c.frontTop.x},${c.frontTop.y} L ${c.rightTop.x},${c.rightTop.y} L ${c.backTop.x},${c.backTop.y} Z`;

  // Left face (Y-Z plane, facing left-forward)
  const left = `M ${c.leftBottom.x},${c.leftBottom.y} L ${c.backBottom.x},${c.backBottom.y} L ${c.backTop.x},${c.backTop.y} L ${c.leftTop.x},${c.leftTop.y} Z`;

  // Right face (X-Z plane, facing right-forward)
  const right = `M ${c.leftBottom.x},${c.leftBottom.y} L ${c.frontBottom.x},${c.frontBottom.y} L ${c.frontTop.x},${c.frontTop.y} L ${c.leftTop.x},${c.leftTop.y} Z`;

  // Full outline (the silhouette)
  const outline = `M ${c.leftBottom.x},${c.leftBottom.y} L ${c.frontBottom.x},${c.frontBottom.y} L ${c.rightBottom.x},${c.rightBottom.y} L ${c.backBottom.x},${c.backBottom.y} Z M ${c.frontBottom.x},${c.frontBottom.y} L ${c.frontTop.x},${c.frontTop.y} M ${c.rightBottom.x},${c.rightBottom.y} L ${c.rightTop.x},${c.rightTop.y} M ${c.backBottom.x},${c.backBottom.y} L ${c.backTop.x},${c.backTop.y} M ${c.leftBottom.x},${c.leftBottom.y} L ${c.leftTop.x},${c.leftTop.y}`;

  return { top, left, right, outline };
}

/**
 * Generate shading colors for isometric faces based on a base color
 * Standard isometric shading: top = light, right = medium, left = dark
 * @param {string} baseHue - HSL hue value (0-360) or Tailwind color name
 * @param {number} saturation - HSL saturation (0-100)
 * @param {number} baseLightness - Base lightness (0-100)
 * @returns {{ top: string, right: string, left: string }}
 */
export function isoShading(baseHue, saturation = 60, baseLightness = 50) {
  return {
    top: `hsl(${baseHue}, ${saturation}%, ${Math.min(baseLightness + 15, 95)}%)`,
    right: `hsl(${baseHue}, ${saturation}%, ${baseLightness}%)`,
    left: `hsl(${baseHue}, ${saturation}%, ${Math.max(baseLightness - 15, 15)}%)`,
  };
}

/**
 * Preset color palettes for common diagram colors (matching Arc's palette)
 */
export const ISO_COLORS = {
  violet: { hue: 270, saturation: 60, lightness: 55 },
  blue: { hue: 220, saturation: 70, lightness: 50 },
  cyan: { hue: 190, saturation: 80, lightness: 45 },
  emerald: { hue: 155, saturation: 65, lightness: 45 },
  amber: { hue: 40, saturation: 90, lightness: 50 },
  rose: { hue: 350, saturation: 70, lightness: 55 },
  slate: { hue: 220, saturation: 15, lightness: 50 },
  zinc: { hue: 240, saturation: 5, lightness: 50 },
};

/**
 * Get shading for a named color
 * @param {keyof typeof ISO_COLORS} colorName
 * @returns {{ top: string, right: string, left: string }}
 */
export function getColorShading(colorName) {
  const color = ISO_COLORS[colorName] || ISO_COLORS.slate;
  return isoShading(color.hue, color.saturation, color.lightness);
}

/**
 * Transform a flat 2D element into an isometric projection
 * This applies CSS transforms to rotate and skew elements
 * @param {'top' | 'left' | 'right'} face - Target face
 * @returns {string} CSS transform value
 */
export function cssIsoTransform(face) {
  switch (face) {
    case 'top':
      // Rotate 45° then scale Y by cos(30°) ≈ 0.866
      return 'rotateX(60deg) rotateZ(45deg)';
    case 'left':
      // Skew for left face
      return 'skewY(30deg) scaleX(0.866)';
    case 'right':
      // Skew for right face
      return 'skewY(-30deg) scaleX(0.866)';
    default:
      return '';
  }
}

/**
 * Calculate the bounding box of an isometric box in screen space
 * Useful for hit testing and layout calculations
 * @param {number} width
 * @param {number} depth
 * @param {number} height
 * @param {number} originX
 * @param {number} originY
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function isoBoundingBox(width, depth, height, originX = 0, originY = 0) {
  const points = [
    isoToScreen(0, 0, 0),
    isoToScreen(width, 0, 0),
    isoToScreen(0, depth, 0),
    isoToScreen(width, depth, 0),
    isoToScreen(0, 0, height),
    isoToScreen(width, 0, height),
    isoToScreen(0, depth, height),
    isoToScreen(width, depth, height),
  ];

  const xs = points.map(p => p.screenX + originX);
  const ys = points.map(p => p.screenY + originY);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}
