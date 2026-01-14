/**
 * Isometric Projection Utilities
 *
 * Isometric projection displays 3D objects in 2D without perspective distortion.
 * All three axes are equally foreshortened at 30° angles.
 *
 * ============================================================================
 * UNIFIED COORDINATE SYSTEM (consistent across all three rendering views)
 * ============================================================================
 *
 * World Coordinates (the "truth"):
 *   - X: Horizontal, increases to the RIGHT
 *   - Y: Depth, increases UPWARD in 2D (representing "into the scene" or "north")
 *   - Z: Elevation, increases UP (height off the floor)
 *   - Origin: At (0, 0, 0), typically bottom-left-floor corner of the scene
 *
 * ============================================================================
 * 2D TOP-DOWN VIEW (reference/planning view)
 * ============================================================================
 *   - Shows X-Y floor plane from directly above
 *   - X increases RIGHT, Y increases UP (screen Y is flipped: sy = origin - y*scale)
 *   - Z (elevation) is not visible, only affects stacking order
 *   - Origin at bottom-left of visible canvas
 *
 * ============================================================================
 * SVG ISOMETRIC VIEW
 * ============================================================================
 *   Transform formula:
 *     screenX = (x - y) * cos(30°)
 *     screenY = -(x + y) * sin(30°) - z   // Note: NEGATED so +X,+Y,+Z go UP
 *
 *   Result (with origin at canvas bottom-center):
 *     - +X axis projects UP and to the RIGHT on screen
 *     - +Y axis projects UP and to the LEFT on screen
 *     - +Z axis projects straight UP on screen
 *     - Objects in positive quadrant extend upward from origin
 *     - Viewing from "front-left-below" looking toward positive X,Y,Z
 *
 *   Visible faces (for boxes):
 *     - TOP face: always visible (lit brightest)
 *     - RIGHT face (+X side): visible
 *     - LEFT face (+Y side): visible (in shadow)
 *
 * ============================================================================
 * THREE.JS VIEW
 * ============================================================================
 *   Coordinate mapping (Three.js uses Y-up convention):
 *     - Our X -> Three.js X (horizontal)
 *     - Our Y -> Three.js Z (depth into scene)
 *     - Our Z -> Three.js Y (up)
 *
 *   Camera position (to match SVG isometric orientation):
 *     - At (-X, +Y, -Z) relative to scene center in Three.js coords
 *     - = (-ourX, +ourZ, -ourY) in our coordinates
 *     - Looking toward scene center
 *     - This creates a view where +X goes right, +Y (our) goes left-back, +Z goes up
 *
 * ============================================================================
 */

// Isometric angles
export const ISO_ANGLE = 30 * (Math.PI / 180); // 30 degrees in radians
export const COS_30 = Math.cos(ISO_ANGLE); // ≈ 0.866
export const SIN_30 = Math.sin(ISO_ANGLE); // = 0.5

/**
 * Convert 3D isometric coordinates to 2D screen coordinates
 * Flipped so +X goes up-right, +Y goes up-left, +Z goes up
 * Origin at bottom, positive space extends upward
 * @param {number} x - Position along X axis (right-back)
 * @param {number} y - Position along Y axis (left-back)
 * @param {number} z - Position along Z axis (up)
 * @returns {{ screenX: number, screenY: number }}
 */
export function isoToScreen(x, y, z = 0) {
  return {
    screenX: (x - y) * COS_30,
    screenY: -(x + y) * SIN_30 - z  // Negated so +X,+Y go UP on screen
  };
}

/**
 * Convert 2D screen coordinates to isometric floor position (z=0)
 * Useful for mouse interaction on the ground plane
 * Updated for flipped Y: screenY = -(x + y) * SIN_30 - z
 * @param {number} screenX
 * @param {number} screenY
 * @returns {{ x: number, y: number }}
 */
export function screenToIsoFloor(screenX, screenY) {
  // Inverse of the iso transform at z=0
  // screenX = (x - y) * COS_30  =>  x - y = screenX / COS_30
  // screenY = -(x + y) * SIN_30  =>  x + y = -screenY / SIN_30
  const xMinusY = screenX / COS_30;
  const xPlusY = -screenY / SIN_30;
  const x = (xMinusY + xPlusY) / 2;
  const y = (xPlusY - xMinusY) / 2;
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
 * @param {number} radius - Corner radius for rounded corners (default 0)
 * @returns {{ top: string, left: string, right: string, outline: string }}
 */
export function isoBox(width, depth, height, originX = 0, originY = 0, radius = 0) {
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

  /**
   * Generate rounded top face path by projecting quarter-circles in world XY space.
   *
   * Math: A circle of radius r in world XY plane projects to an ellipse in screen space.
   * - Circle: x = cx + r*cos(θ), y = cy + r*sin(θ)
   * - Screen: sx = (x-y)*cos30, sy = -(x+y)*sin30
   *
   * The projected ellipse is axis-aligned with:
   * - rx = r * √2 * cos(30°) ≈ 1.2247 * r
   * - ry = r * √2 * sin(30°) ≈ 0.7071 * r
   */
  const buildRoundedTopPath = (w, d, h, r) => {
    if (r <= 0) {
      // No rounding - just return the 4 corners
      const p1 = isoToScreen(0, 0, h);
      const p2 = isoToScreen(w, 0, h);
      const p3 = isoToScreen(w, d, h);
      const p4 = isoToScreen(0, d, h);
      return `M ${p1.screenX + originX},${p1.screenY + originY} L ${p2.screenX + originX},${p2.screenY + originY} L ${p3.screenX + originX},${p3.screenY + originY} L ${p4.screenX + originX},${p4.screenY + originY} Z`;
    }

    // Clamp radius to half the smallest dimension
    const maxR = Math.min(w, d) / 2;
    const rad = Math.min(r, maxR);

    // Sample points along each quarter arc (more segments = smoother)
    const arcSegments = 8;
    const path = [];

    // Helper to add arc points
    const addArc = (cx, cy, startAngle, endAngle) => {
      for (let i = 0; i <= arcSegments; i++) {
        const theta = startAngle + (endAngle - startAngle) * (i / arcSegments);
        const wx = cx + rad * Math.cos(theta);
        const wy = cy + rad * Math.sin(theta);
        const p = isoToScreen(wx, wy, h);
        path.push(`${p.screenX + originX},${p.screenY + originY}`);
      }
    };

    // Trace the rounded rectangle clockwise in world XY:
    // Start at front-left corner's arc end, go around

    // 1. Front-left corner (0,0): center at (rad, rad)
    //    Arc from (0, rad) to (rad, 0) = angles 180° to 270° (π to 3π/2)
    addArc(rad, rad, Math.PI, Math.PI * 1.5);

    // 2. Straight line along front edge from (rad, 0) to (w-rad, 0)
    //    (already at rad,0 from previous arc end)

    // 3. Front-right corner (w,0): center at (w-rad, rad)
    //    Arc from (w-rad, 0) to (w, rad) = angles 270° to 360° (-π/2 to 0)
    addArc(w - rad, rad, Math.PI * 1.5, Math.PI * 2);

    // 4. Straight line along right edge from (w, rad) to (w, d-rad)
    //    (already at w,rad from previous arc end)

    // 5. Back-right corner (w,d): center at (w-rad, d-rad)
    //    Arc from (w, d-rad) to (w-rad, d) = angles 0° to 90°
    addArc(w - rad, d - rad, 0, Math.PI * 0.5);

    // 6. Straight line along back edge from (w-rad, d) to (rad, d)

    // 7. Back-left corner (0,d): center at (rad, d-rad)
    //    Arc from (rad, d) to (0, d-rad) = angles 90° to 180°
    addArc(rad, d - rad, Math.PI * 0.5, Math.PI);

    // 8. Straight line along left edge from (0, d-rad) to (0, rad) - closes to start

    return `M ${path[0]} L ${path.slice(1).join(' L ')} Z`;
  };

  // Straight path (no rounding)
  const straightPath = (points) => {
    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
  };

  /**
   * Build vertical quarter-cylinder surface as multiple segments for shading.
   *
   * The fillet surface normal varies with angle θ:
   *   n(θ) = <cos(θ), sin(θ), 0>  (horizontal, perpendicular to cylinder axis)
   *
   * We split into segments and return an array of { path, intensity } objects
   * where intensity is the Lambert shading value for that segment.
   *
   * Light direction: top-right-front = normalized(-1, -1, 1) in our coords
   */
  const buildCornerCylinderSegments = (cx, cy, r, h, startAngle, endAngle) => {
    const segments = 6;
    const result = [];

    // Light direction (normalized): coming from top-right-front
    // In our coords: -X, -Y, +Z direction
    const lightX = -0.577;  // -1/√3
    const lightY = -0.577;  // -1/√3
    const lightZ = 0.577;   // +1/√3

    for (let i = 0; i < segments; i++) {
      const theta0 = startAngle + (endAngle - startAngle) * (i / segments);
      const theta1 = startAngle + (endAngle - startAngle) * ((i + 1) / segments);
      const thetaMid = (theta0 + theta1) / 2;

      // Surface normal at midpoint (horizontal, pointing outward)
      const nx = Math.cos(thetaMid);
      const ny = Math.sin(thetaMid);
      const nz = 0;

      // Lambert diffuse: I = max(0, n · L)
      // Softened: compress the range to avoid harsh transitions
      const dotProduct = nx * lightX + ny * lightY + nz * lightZ;
      const rawIntensity = Math.max(0, dotProduct + 0.4);
      const intensity = 0.3 + rawIntensity * 0.5; // range 0.3 to 0.8, softer gradient

      // Build quad for this segment
      const p0b = isoToScreen(cx + r * Math.cos(theta0), cy + r * Math.sin(theta0), 0);
      const p1b = isoToScreen(cx + r * Math.cos(theta1), cy + r * Math.sin(theta1), 0);
      const p0t = isoToScreen(cx + r * Math.cos(theta0), cy + r * Math.sin(theta0), h);
      const p1t = isoToScreen(cx + r * Math.cos(theta1), cy + r * Math.sin(theta1), h);

      const path = `M ${p0b.screenX + originX},${p0b.screenY + originY} ` +
                   `L ${p1b.screenX + originX},${p1b.screenY + originY} ` +
                   `L ${p1t.screenX + originX},${p1t.screenY + originY} ` +
                   `L ${p0t.screenX + originX},${p0t.screenY + originY} Z`;

      result.push({ path, intensity });
    }

    return result;
  };

  // Clamp radius
  const rad = Math.min(radius, Math.min(width, depth) / 2);

  // Build paths for each visible face
  // TOP face: rounded corners via projected quarter-circles in XY plane
  const top = buildRoundedTopPath(width, depth, height, rad);

  // For rounded boxes, we need:
  // 1. Flat portions of side faces (between the rounded corners)
  // 2. Quarter-cylinder surfaces at each visible corner

  let left, right, cornerFrontLeft, cornerFrontRight, cornerBackLeft, cornerBackRight;

  if (rad > 0) {
    // FLAT portion of left face (x=0): from y=rad to y=depth-rad
    const leftFlatPoints = [
      { x: isoToScreen(0, rad, 0).screenX + originX, y: isoToScreen(0, rad, 0).screenY + originY },
      { x: isoToScreen(0, depth - rad, 0).screenX + originX, y: isoToScreen(0, depth - rad, 0).screenY + originY },
      { x: isoToScreen(0, depth - rad, height).screenX + originX, y: isoToScreen(0, depth - rad, height).screenY + originY },
      { x: isoToScreen(0, rad, height).screenX + originX, y: isoToScreen(0, rad, height).screenY + originY },
    ];
    left = straightPath(leftFlatPoints);

    // FLAT portion of front face (y=0): from x=rad to x=width-rad
    const rightFlatPoints = [
      { x: isoToScreen(rad, 0, 0).screenX + originX, y: isoToScreen(rad, 0, 0).screenY + originY },
      { x: isoToScreen(width - rad, 0, 0).screenX + originX, y: isoToScreen(width - rad, 0, 0).screenY + originY },
      { x: isoToScreen(width - rad, 0, height).screenX + originX, y: isoToScreen(width - rad, 0, height).screenY + originY },
      { x: isoToScreen(rad, 0, height).screenX + originX, y: isoToScreen(rad, 0, height).screenY + originY },
    ];
    right = straightPath(rightFlatPoints);

    // All four corner cylinders with shading segments:
    // Each returns an array of { path, intensity } for Lambert shading

    // Front-left corner (most visible) - center at (rad, rad)
    // Arc from -X (180°) to -Y (270°)
    cornerFrontLeft = buildCornerCylinderSegments(rad, rad, rad, height, Math.PI, Math.PI * 1.5);

    // Front-right corner - center at (width-rad, rad)
    // Arc from -Y (270°) to +X (360°)
    cornerFrontRight = buildCornerCylinderSegments(width - rad, rad, rad, height, Math.PI * 1.5, Math.PI * 2);

    // Back-left corner - center at (rad, depth-rad)
    // Arc from +Y (90°) to -X (180°)
    cornerBackLeft = buildCornerCylinderSegments(rad, depth - rad, rad, height, Math.PI * 0.5, Math.PI);

    // Back-right corner - center at (width-rad, depth-rad)
    // Arc from +X (0°) to +Y (90°)
    cornerBackRight = buildCornerCylinderSegments(width - rad, depth - rad, rad, height, 0, Math.PI * 0.5);
  } else {
    // No rounding - standard flat faces
    const leftPoints = [c.leftBottom, c.backBottom, c.backTop, c.leftTop];
    const rightPoints = [c.leftBottom, c.frontBottom, c.frontTop, c.leftTop];
    left = straightPath(leftPoints);
    right = straightPath(rightPoints);
    cornerFrontLeft = [];
    cornerFrontRight = [];
    cornerBackLeft = [];
    cornerBackRight = [];
  }

  // Full outline (the silhouette) - no rounding for simplicity
  const outline = `M ${c.leftBottom.x},${c.leftBottom.y} L ${c.frontBottom.x},${c.frontBottom.y} L ${c.rightBottom.x},${c.rightBottom.y} L ${c.backBottom.x},${c.backBottom.y} Z`;

  return {
    top,
    left,
    right,
    cornerFrontLeft,
    cornerFrontRight,
    cornerBackLeft,
    cornerBackRight,
    outline
  };
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
