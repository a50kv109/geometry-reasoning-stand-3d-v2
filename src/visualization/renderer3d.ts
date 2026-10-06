/**
 * 3D VIEWPORT RENDERER (Canvas 2D Subpixel Projection Engine)
 * 
 * Strict architectural separation:
 * - Pure client renderer; does NOT mutate canonical geometry.
 * - Painter's depth sorting algorithm for honest 3D occlusion.
 * - Dynamic causal highlighting for affected vs invariant elements.
 * - Explanatory spherical coordinate grid (parallels, meridians, equator, poles).
 * - Fixed world XYZ coordinate frame widget.
 */

import { Point3D, VertexId, EdgeId, FaceId, CanonicalGeometryState } from '../core/types';
import { CANONICAL_EDGES, CANONICAL_FACES, CANONICAL_VERTICES } from '../core/topology';
import { ComprehensiveGeometryMetrics } from '../core/metrics';
import { cartesianToSpherical } from '../core/representation';
import { CameraState, projectWorldPoint, projectTriadPoint, worldToEye } from './camera';
import { CausalAnalysis } from './causalModel';

export interface RenderOptions {
  showGrid: boolean;
  showFaces: boolean;
  showEdges: boolean;
  showVertices: boolean;
  showLabels: boolean;
  showTriad: boolean;
  showEquator: boolean;
  showPoles: boolean;
  showVertexGuides: boolean;     // Per-vertex latitude and longitude guides (M1.7)
  showAllVertexGuides: boolean;  // Subtle guides for inactive vertices (M1.7)
  visualScale: number;           // Visual scale factor: 1.0 (100%), 0.75 (75%), 0.5 (50%) (M1.7)
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showGrid: true,
  showFaces: true,
  showEdges: true,
  showVertices: true,
  showLabels: true,
  showTriad: true,
  showEquator: true,
  showPoles: true,
  showVertexGuides: true,
  showAllVertexGuides: true,
  visualScale: 1.0,
};

// Distinct colors for semantic vertex identities
export const VERTEX_COLORS: Record<VertexId, { primary: string; light: string; glow: string; text: string }> = {
  A: { primary: '#ef4444', light: 'rgba(239, 68, 68, 0.25)', glow: 'rgba(239, 68, 68, 0.6)', text: '#ffffff' }, // Coral Red
  B: { primary: '#10b981', light: 'rgba(16, 185, 129, 0.25)', glow: 'rgba(16, 185, 129, 0.6)', text: '#ffffff' }, // Emerald
  C: { primary: '#0284c7', light: 'rgba(2, 132, 199, 0.25)', glow: 'rgba(2, 132, 199, 0.6)', text: '#ffffff' }, // Sky Blue
  D: { primary: '#8b5cf6', light: 'rgba(139, 92, 246, 0.25)', glow: 'rgba(139, 92, 246, 0.6)', text: '#ffffff' }, // Violet
};

interface DrawableItem {
  depth: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * Draws the complete 3D geometric scene.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CanonicalGeometryState,
  metrics: ComprehensiveGeometryMetrics,
  causal: CausalAnalysis,
  camera: CameraState,
  hoveredVertexId: VertexId | null,
  options: RenderOptions = DEFAULT_RENDER_OPTIONS
): void {
  // Clear canvas with subtle sophisticated neutral background
  ctx.clearRect(0, 0, width, height);

  // Background radial gradient for subtle depth
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) / 1.5);
  bgGrad.addColorStop(0, '#0f172a'); // Slate 900
  bgGrad.addColorStop(1, '#020617'); // Slate 950
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const R = state.sphere.radius;
  const O = state.sphere.center;

  // Visual scale multiplier: maps R to comfortable pixel radius on canvas
  const visualScale = options.visualScale ?? 1.0;
  const targetPixelRadius = Math.min(width, height) * 0.32 * visualScale;
  const scaleMultiplier = targetPixelRadius / (R || 1);

  // Project Sphere center
  const projectedCenter = projectWorldPoint(O, camera, width, height, scaleMultiplier);

  // 1. Draw Sphere Shell & Rim Glow
  drawSphereShell(ctx, projectedCenter, targetPixelRadius, camera);

  // 2. Draw Spherical Coordinate Grid (Parallels & Meridians)
  if (options.showGrid) {
    drawSphericalGrid(ctx, O, R, camera, width, height, scaleMultiplier, options);
  }

  // 2.5 Draw Per-Vertex Coordinate Guides (Parallels & Meridians on S²)
  if (options.showVertexGuides) {
    const selectedVertexId = causal.selected?.type === 'VERTEX' ? causal.selected.id : null;
    drawVertexCoordinateGuides(
      ctx,
      state,
      selectedVertexId,
      camera,
      width,
      height,
      scaleMultiplier,
      options
    );
  }

  // 3. Collect 3D Drawable items for Painter's Algorithm (Depth Sorting)
  const drawables: DrawableItem[] = [];

  // (a) Faces
  if (options.showFaces) {
    for (const face of CANONICAL_FACES) {
      const pA = state.vertices[face.vertices[0]];
      const pB = state.vertices[face.vertices[1]];
      const pC = state.vertices[face.vertices[2]];

      const projA = projectWorldPoint(pA, camera, width, height, scaleMultiplier);
      const projB = projectWorldPoint(pB, camera, width, height, scaleMultiplier);
      const projC = projectWorldPoint(pC, camera, width, height, scaleMultiplier);

      const avgDepth = (projA.depth + projB.depth + projC.depth) / 3;
      const isAffected = causal.affectedFaces.has(face.id);
      const isSelected = causal.selected?.type === 'FACE' && causal.selected.id === face.id;
      const faceMetric = metrics.faces[face.id];

      drawables.push({
        depth: avgDepth,
        draw: (c) => drawFace(c, projA, projB, projC, face.id, faceMetric, isAffected, isSelected, causal.selected !== null),
      });
    }
  }

  // (b) Edges
  if (options.showEdges) {
    for (const edge of CANONICAL_EDGES) {
      const p1 = state.vertices[edge.v1];
      const p2 = state.vertices[edge.v2];

      const proj1 = projectWorldPoint(p1, camera, width, height, scaleMultiplier);
      const proj2 = projectWorldPoint(p2, camera, width, height, scaleMultiplier);

      const avgDepth = (proj1.depth + proj2.depth) / 2;
      const isAffected = causal.affectedEdges.has(edge.id);
      const isSelected = causal.selected?.type === 'EDGE' && causal.selected.id === edge.id;
      const length = metrics.edges[edge.id]?.length ?? 0;

      drawables.push({
        depth: avgDepth + 0.1, // slightly in front of faces
        draw: (c) => drawEdge(c, proj1, proj2, edge.id, length, isAffected, isSelected, causal.selected !== null),
      });
    }
  }

  // (c) Centroid G
  const projG = projectWorldPoint(metrics.global.centroid, camera, width, height, scaleMultiplier);
  drawables.push({
    depth: projG.depth + 0.15,
    draw: (c) => drawCentroid(c, projG),
  });

  // (d) Vertices
  if (options.showVertices) {
    for (const id of CANONICAL_VERTICES) {
      const p = state.vertices[id];
      const proj = projectWorldPoint(p, camera, width, height, scaleMultiplier);

      const isAffected = causal.affectedVertices.has(id);
      const isSelected = causal.selected?.type === 'VERTEX' && causal.selected.id === id;
      const isHovered = hoveredVertexId === id;

      drawables.push({
        depth: proj.depth + 0.5, // vertices always in front of edges
        draw: (c) => drawVertex(c, proj, id, isSelected, isAffected, isHovered, options.showLabels),
      });
    }
  }

  // (e) Poles (North / South)
  if (options.showPoles) {
    const northPole: Point3D = { x: O.x, y: O.y, z: O.z + R };
    const southPole: Point3D = { x: O.x, y: O.y, z: O.z - R };
    const projNorth = projectWorldPoint(northPole, camera, width, height, scaleMultiplier);
    const projSouth = projectWorldPoint(southPole, camera, width, height, scaleMultiplier);

    drawables.push({
      depth: projNorth.depth + 0.2,
      draw: (c) => drawPole(c, projNorth, 'Северный полюс (N)', '#38bdf8'),
    });
    drawables.push({
      depth: projSouth.depth + 0.2,
      draw: (c) => drawPole(c, projSouth, 'Южный полюс (S)', '#818cf8'),
    });
  }

  // Sort drawables back-to-front (lowest depth first)
  drawables.sort((a, b) => a.depth - b.depth);

  // Execute all draw calls
  for (const item of drawables) {
    item.draw(ctx);
  }

  // 4. Fixed Global XYZ Triad (rendered in screen space at bottom-left corner)
  if (options.showTriad) {
    drawGlobalCoordinateTriad(ctx, camera, { x: 55, y: height - 55 });
  }

  // 5. Degeneracy or Non-regularity visual indicator banner if applicable
  if (metrics.global.orientation === 'COPLANAR') {
    drawDegeneracyWarning(ctx, width);
  }
}

/**
 * Draws the transparent sphere shell and silhouette.
 */
function drawSphereShell(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  camera: CameraState
): void {
  ctx.save();

  // Subtle interior fill
  const sphereGrad = ctx.createRadialGradient(
    center.x - radius * 0.3,
    center.y - radius * 0.3,
    radius * 0.1,
    center.x,
    center.y,
    radius
  );
  sphereGrad.addColorStop(0, 'rgba(30, 41, 59, 0.45)');
  sphereGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.6)');
  sphereGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)');

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.fill();

  // Outer sphere contour
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the Spherical Coordinate Grid:
 * - Parallels (latitude lines)
 * - Equator highlighted in bright cyan
 * - Meridians (longitude lines)
 */
function drawSphericalGrid(
  ctx: CanvasRenderingContext2D,
  center: Point3D,
  R: number,
  camera: CameraState,
  w: number,
  h: number,
  scaleMultiplier: number,
  options: RenderOptions
): void {
  ctx.save();

  // Latitude lines (Parallels)
  const latitudes = [-60, -30, 0, 30, 60];
  const SEGMENTS = 64;

  for (const latDeg of latitudes) {
    const isEquator = latDeg === 0;
    if (isEquator && !options.showEquator) continue;

    const phi = (latDeg * Math.PI) / 180;
    const rParallel = R * Math.cos(phi);
    const zParallel = center.z + R * Math.sin(phi);

    ctx.beginPath();
    let first = true;

    for (let i = 0; i <= SEGMENTS; i++) {
      const lambda = (i / SEGMENTS) * Math.PI * 2;
      const pt: Point3D = {
        x: center.x + rParallel * Math.cos(lambda),
        y: center.y + rParallel * Math.sin(lambda),
        z: zParallel,
      };

      const proj = projectWorldPoint(pt, camera, w, h, scaleMultiplier);
      if (proj.isVisible) {
        if (first) {
          ctx.moveTo(proj.x, proj.y);
          first = false;
        } else {
          ctx.lineTo(proj.x, proj.y);
        }
      }
    }

    if (isEquator) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)'; // Bright Cyan for Equator
      ctx.lineWidth = 2.0;
      ctx.setLineDash([]);
      ctx.stroke();

      // Equator label
      const eqPt: Point3D = { x: center.x + R, y: center.y, z: center.z };
      const eqProj = projectWorldPoint(eqPt, camera, w, h, scaleMultiplier);
      if (eqProj.isVisible) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.fillText('Экватор', eqProj.x + 4, eqProj.y - 4);
      }
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'; // Slate 400 faint
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
    }
  }

  // Longitude lines (Meridians)
  const meridianCount = 12; // Every 30 degrees
  for (let m = 0; m < meridianCount; m++) {
    const lambda = (m / meridianCount) * Math.PI * 2;
    const isPrime = m === 0;

    ctx.beginPath();
    let first = true;

    for (let i = 0; i <= SEGMENTS; i++) {
      const phi = -Math.PI / 2 + (i / SEGMENTS) * Math.PI;
      const cosPhi = Math.cos(phi);
      const pt: Point3D = {
        x: center.x + R * cosPhi * Math.cos(lambda),
        y: center.y + R * cosPhi * Math.sin(lambda),
        z: center.z + R * Math.sin(phi),
      };

      const proj = projectWorldPoint(pt, camera, w, h, scaleMultiplier);
      if (proj.isVisible) {
        if (first) {
          ctx.moveTo(proj.x, proj.y);
          first = false;
        } else {
          ctx.lineTo(proj.x, proj.y);
        }
      }
    }

    if (isPrime) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Sky blue for prime meridian
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 5]);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws per-vertex spherical coordinate guides (latitude circle and longitude meridian arc).
 * - For active vertex: prominent, glowing curves with coordinate readout badges.
 * - For inactive vertices: subtle, delicate guide curves showing their positions on S²(O, R).
 * - Strictly derived from canonical Cartesian coordinates via cartesianToSpherical.
 * - Respects pole convention and longitude periodicity.
 */
function drawVertexCoordinateGuides(
  ctx: CanvasRenderingContext2D,
  state: CanonicalGeometryState,
  selectedVertexId: VertexId | null,
  camera: CameraState,
  width: number,
  height: number,
  scaleMultiplier: number,
  options: RenderOptions
): void {
  const O = state.sphere.center;
  const R = state.sphere.radius;
  if (R <= 0) return;

  // Determine which vertices to draw guides for
  const verticesToRender: VertexId[] = [];
  
  if (options.showAllVertexGuides) {
    for (const vId of CANONICAL_VERTICES) {
      if (vId !== selectedVertexId) {
        verticesToRender.push(vId);
      }
    }
  }
  if (selectedVertexId) {
    verticesToRender.push(selectedVertexId);
  }

  for (const vId of verticesToRender) {
    const isSelected = vId === selectedVertexId;
    const pt = state.vertices[vId];
    if (!pt) continue;

    const sph = cartesianToSpherical(state.sphere, pt);
    const color = VERTEX_COLORS[vId];

    // --- A. Latitude Parallel Circle ---
    // Radius of parallel circle at latitude phi: rParallel = R * cos(phi)
    // Height: zParallel = O.z + R * sin(phi)
    const phi = sph.phi;
    const rParallel = R * Math.cos(phi);
    const zParallel = O.z + R * Math.sin(phi);

    // If phi is not at extreme pole, draw the parallel circle
    if (Math.abs(rParallel) > 1e-5) {
      const LAT_SEGMENTS = 72;
      const parallelPoints: Array<{ proj: { x: number; y: number; isVisible: boolean }; isFront: boolean }> = [];

      for (let i = 0; i <= LAT_SEGMENTS; i++) {
        const theta = (i / LAT_SEGMENTS) * Math.PI * 2;
        const pLat: Point3D = {
          x: O.x + rParallel * Math.cos(theta),
          y: O.y + rParallel * Math.sin(theta),
          z: zParallel,
        };
        const proj = projectWorldPoint(pLat, camera, width, height, scaleMultiplier);
        const eye = worldToEye(pLat, camera);
        const isFront = eye.z <= camera.distance;
        parallelPoints.push({ proj, isFront });
      }

      drawSphericalCurve(ctx, parallelPoints, isSelected ? color.primary : color.light, isSelected ? 2.2 : 0.8, isSelected);
    }

    // --- B. Longitude Meridian Arc ---
    // Arc connecting South Pole (O.z - R) through vertex to North Pole (O.z + R) at angle lambda
    const lambda = sph.lambda;
    const LON_SEGMENTS = 48;
    const meridianPoints: Array<{ proj: { x: number; y: number; isVisible: boolean }; isFront: boolean }> = [];

    for (let i = 0; i <= LON_SEGMENTS; i++) {
      const phiPrime = -Math.PI / 2 + (i / LON_SEGMENTS) * Math.PI;
      const cosP = Math.cos(phiPrime);
      const pLon: Point3D = {
        x: O.x + R * cosP * Math.cos(lambda),
        y: O.y + R * cosP * Math.sin(lambda),
        z: O.z + R * Math.sin(phiPrime),
      };
      const proj = projectWorldPoint(pLon, camera, width, height, scaleMultiplier);
      const eye = worldToEye(pLon, camera);
      const isFront = eye.z <= camera.distance;
      meridianPoints.push({ proj, isFront });
    }

    drawSphericalCurve(ctx, meridianPoints, isSelected ? color.primary : color.light, isSelected ? 2.2 : 0.8, isSelected);

    // --- C. Labels and Callout for Active Vertex ---
    if (isSelected) {
      drawActiveVertexCoordinateBadge(ctx, pt, vId, sph, camera, width, height, scaleMultiplier, color);
    }
  }
}

/**
 * Draws a spherical curve with front/back occlusion handling for honest 3D perception.
 */
function drawSphericalCurve(
  ctx: CanvasRenderingContext2D,
  points: Array<{ proj: { x: number; y: number; isVisible: boolean }; isFront: boolean }>,
  strokeColor: string,
  lineWidth: number,
  isProminent: boolean
): void {
  ctx.save();

  // 1. Draw back hemisphere segments (occluded by sphere interior: subtle / dashed)
  ctx.beginPath();
  let firstBack = true;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (!pt.isFront && pt.proj.isVisible) {
      if (firstBack) {
        ctx.moveTo(pt.proj.x, pt.proj.y);
        firstBack = false;
      } else {
        ctx.lineTo(pt.proj.x, pt.proj.y);
      }
    } else {
      firstBack = true;
    }
  }
  ctx.strokeStyle = strokeColor;
  ctx.globalAlpha = isProminent ? 0.35 : 0.12;
  ctx.lineWidth = Math.max(0.6, lineWidth * 0.5);
  ctx.setLineDash([2, 4]);
  ctx.stroke();

  // 2. Draw front hemisphere segments (facing viewer: solid / glowing)
  ctx.beginPath();
  let firstFront = true;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.isFront && pt.proj.isVisible) {
      if (firstFront) {
        ctx.moveTo(pt.proj.x, pt.proj.y);
        firstFront = false;
      } else {
        ctx.lineTo(pt.proj.x, pt.proj.y);
      }
    } else {
      firstFront = true;
    }
  }
  ctx.strokeStyle = strokeColor;
  ctx.globalAlpha = isProminent ? 0.95 : 0.28;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(isProminent ? [] : [3, 4]);
  if (isProminent) {
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 6;
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders a crisp on-screen coordinate badge for the selected vertex.
 */
function drawActiveVertexCoordinateBadge(
  ctx: CanvasRenderingContext2D,
  vertexPt: Point3D,
  vId: VertexId,
  sph: { phi: number; lambda: number },
  camera: CameraState,
  width: number,
  height: number,
  scaleMultiplier: number,
  color: { primary: string; light: string; glow: string }
): void {
  const proj = projectWorldPoint(vertexPt, camera, width, height, scaleMultiplier);
  if (!proj.isVisible) return;

  const phiDeg = (sph.phi * 180) / Math.PI;
  const lamDeg = (sph.lambda * 180) / Math.PI;
  const phiSign = phiDeg >= 0 ? '+' : '';
  const phiText = `φ = ${phiSign}${phiDeg.toFixed(1)}°`;
  const lamText = `λ = ${lamDeg.toFixed(1)}°`;

  ctx.save();

  // Position badge slightly offset from vertex
  const badgeWidth = 96;
  const badgeHeight = 40;
  const badgeX = Math.min(width - badgeWidth - 10, Math.max(10, proj.x + 20));
  const badgeY = Math.min(height - badgeHeight - 10, Math.max(10, proj.y - 20));

  // Small pointer dashed line from vertex to badge
  ctx.beginPath();
  ctx.moveTo(proj.x, proj.y);
  ctx.lineTo(badgeX, badgeY + badgeHeight / 2);
  ctx.strokeStyle = color.primary;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  ctx.setLineDash([2, 2]);
  ctx.stroke();

  // Badge background card
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#090d16'; // Deep slate
  ctx.strokeStyle = color.primary;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = color.glow;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6);
  ctx.fill();
  ctx.stroke();

  // Reset shadow for crisp text
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;

  // Vertex indicator dot and ID
  ctx.beginPath();
  ctx.arc(badgeX + 11, badgeY + 13, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color.primary;
  ctx.fill();

  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(vId, badgeX + 20, badgeY + 13);

  // Coordinate text: phi (latitude)
  ctx.font = '9px monospace';
  ctx.fillStyle = '#38bdf8'; // Sky blue for phi
  ctx.fillText(phiText, badgeX + 34, badgeY + 13);

  // Coordinate text: lambda (longitude)
  ctx.fillStyle = '#34d399'; // Emerald for lambda
  ctx.fillText(lamText, badgeX + 20, badgeY + 28);

  ctx.restore();
}

/**
 * Draws a triangular planar face of the tetrahedron.
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  pA: { x: number; y: number },
  pB: { x: number; y: number },
  pC: { x: number; y: number },
  faceId: FaceId,
  faceMetric: ComprehensiveGeometryMetrics['faces'][FaceId],
  isAffected: boolean,
  isSelected: boolean,
  hasSelection: boolean
): void {
  ctx.save();

  ctx.beginPath();
  ctx.moveTo(pA.x, pA.y);
  ctx.lineTo(pB.x, pB.y);
  ctx.lineTo(pC.x, pC.y);
  ctx.closePath();

  if (faceMetric.isDegenerate) {
    // Face degeneracy warning
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (isSelected) {
    // Directly selected face
    ctx.fillStyle = 'rgba(245, 158, 11, 0.45)'; // Vibrant Amber
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
  } else if (isAffected) {
    // Affected face (incident to moved vertex)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'; // Amber highlight
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.5;
  } else if (hasSelection) {
    // Invariant face (unaffected branch)
    ctx.fillStyle = 'rgba(71, 85, 105, 0.15)'; // Muted slate
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1.0;
  } else {
    // Default face shading with subtle color per face
    const colors: Record<FaceId, string> = {
      ABC: 'rgba(56, 189, 248, 0.2)',  // Cyan
      ABD: 'rgba(129, 140, 248, 0.2)', // Indigo
      ACD: 'rgba(236, 72, 153, 0.2)',  // Pink
      BCD: 'rgba(52, 211, 153, 0.2)',  // Emerald
    };
    ctx.fillStyle = colors[faceId] || 'rgba(99, 102, 241, 0.2)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.0;
  }

  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a straight Euclidean edge (chord inside the sphere).
 */
function drawEdge(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  edgeId: EdgeId,
  length: number,
  isAffected: boolean,
  isSelected: boolean,
  hasSelection: boolean
): void {
  ctx.save();

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);

  if (isSelected) {
    // Directly selected edge
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
  } else if (isAffected) {
    // Affected edge: warm amber glowing chord
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.0;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 6;
  } else if (hasSelection) {
    // Unaffected edge: cool muted invariant
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
  } else {
    // Default edge
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 3;
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a vertex handle with persistent semantic label (A, B, C, D).
 */
function drawVertex(
  ctx: CanvasRenderingContext2D,
  proj: { x: number; y: number },
  id: VertexId,
  isSelected: boolean,
  isAffected: boolean,
  isHovered: boolean,
  showLabel: boolean
): void {
  ctx.save();

  const color = VERTEX_COLORS[id];
  const radius = isSelected ? 11 : isHovered ? 9 : 7.5;

  // Outer halo when selected or hovered
  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.3)' : color.light;
    ctx.fill();

    ctx.strokeStyle = isSelected ? '#f59e0b' : color.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Vertex Node Core
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = isSelected ? '#f59e0b' : color.primary;
  ctx.shadowColor = isSelected ? '#f59e0b' : color.glow;
  ctx.shadowBlur = isSelected ? 12 : 8;
  ctx.fill();

  // Inner highlight dot
  ctx.beginPath();
  ctx.arc(proj.x - radius * 0.25, proj.y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();

  ctx.restore();

  // Persistent Semantic Label (A, B, C, D)
  if (showLabel) {
    ctx.save();
    const labelX = proj.x + 14;
    const labelY = proj.y - 12;

    // Label badge background
    ctx.beginPath();
    ctx.arc(labelX, labelY, 11, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#f59e0b' : '#0f172a';
    ctx.strokeStyle = isSelected ? '#ffffff' : color.primary;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Label character
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
    ctx.fillText(id, labelX, labelY);

    ctx.restore();
  }
}

/**
 * Draws Centroid G indicator.
 */
function drawCentroid(ctx: CanvasRenderingContext2D, proj: { x: number; y: number }): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('G (центроид)', proj.x + 6, proj.y + 3);
  ctx.restore();
}

/**
 * Draws North/South Pole marker.
 */
function drawPole(
  ctx: CanvasRenderingContext2D,
  proj: { x: number; y: number },
  label: string,
  color: string
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.font = '10px sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(label, proj.x + 6, proj.y - 4);
  ctx.restore();
}

/**
 * Fixed Global XYZ Reference Frame Widget.
 * Shows world axes from current camera perspective.
 * Does NOT rotate with vertices; remains fixed in world space.
 */
export function drawGlobalCoordinateTriad(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  center: { x: number; y: number }
): void {
  ctx.save();

  const length = 32;

  // Background disk for triad
  ctx.beginPath();
  ctx.arc(center.x, center.y, 42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
  ctx.lineWidth = 1.0;
  ctx.fill();
  ctx.stroke();

  const axes: Array<{ vec: Point3D; label: string; color: string }> = [
    { vec: { x: 1, y: 0, z: 0 }, label: 'X', color: '#ef4444' }, // Red
    { vec: { x: 0, y: 1, z: 0 }, label: 'Y', color: '#10b981' }, // Green
    { vec: { x: 0, y: 0, z: 1 }, label: 'Z', color: '#38bdf8' }, // Blue (Up / Pole)
  ];

  // Project each axis and sort by depth
  const projectedAxes = axes.map((a) => ({
    ...a,
    proj: projectTriadPoint(a.vec, camera, center, length),
  }));

  projectedAxes.sort((a, b) => a.proj.depth - b.proj.depth);

  for (const axis of projectedAxes) {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(axis.proj.x, axis.proj.y);
    ctx.strokeStyle = axis.color;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Axis Tip Circle
    ctx.beginPath();
    ctx.arc(axis.proj.x, axis.proj.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = axis.color;
    ctx.fill();

    // Label
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = axis.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const offsetX = (axis.proj.x - center.x) * 0.3;
    const offsetY = (axis.proj.y - center.y) * 0.3;
    ctx.fillText(axis.label, axis.proj.x + offsetX, axis.proj.y + offsetY);
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(center.x, center.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();

  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('Мировые оси XYZ', center.x, center.y + 34);

  ctx.restore();
}

/**
 * Visual banner displayed if tetrahedron approaches or reaches degeneracy.
 */
function drawDegeneracyWarning(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.save();
  const bannerWidth = 320;
  const bannerHeight = 32;
  const x = (width - bannerWidth) / 2;
  const y = 16;

  ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(x, y, bannerWidth, bannerHeight, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠ Внимание: Геометрическая вырожденность (Vs ≈ 0)', width / 2, y + bannerHeight / 2);

  ctx.restore();
}
