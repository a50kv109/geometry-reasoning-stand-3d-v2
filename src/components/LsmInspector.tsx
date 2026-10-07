/**
 * DYNAMIC 3D GEOMETRY REASONING STAND
 * Local Spherical Manifold (LSM) / LVG Inspector Component
 *
 * PHYSICAL GLOBE MODEL SPECIFICATION:
 * - Authoritative Principle:
 *   [ Geometry State = CONSTANT ] (Intrinsic S²(v) coordinates, u_ij, planar & solid angles are immutable)
 *   [ Observer View Orientation ] (The user turns the physical globe model in hands: Yaw / Pitch)
 * - Renders a physical globe on a stand:
 *   * North Pole (N) & South Pole (S) with axis pins and mounting bracket.
 *   * Equator (φ = 0°) and latitude parallels rigidly rotating with the globe.
 *   * Prime & longitudinal meridians rigidly rotating with the globe.
 *   * Incident direction vectors u_ij pinned at fixed spherical coordinates.
 *   * Great circle spherical triangle arcs connecting the three vectors.
 * - Controls:
 *   * Direct touch/mouse grab & drag: ↻ ГЛОБУС ↺
 *   * Horizontal slider: Азимут / Yaw (-180° .. +180°)
 *   * Vertical slider: Наклон оси / Pitch (-85° .. +85°)
 *   * Quick orientation presets: Спереди (0°), Полюс N (90°), Изометрия (35°/20°), Сброс
 *   * Metric readouts: Solid Angle Ω, det(G), Planar angles α_ij.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CanonicalGeometryState, VertexId } from '../core/types';
import { computeLVG, LVG } from '../core/lvg';
import { VERTEX_COLORS } from '../visualization/renderer3d';
import { RotateCcw, Eye, Compass, X } from 'lucide-react';

interface LsmInspectorProps {
  state: CanonicalGeometryState;
  activeVertexId: VertexId;
  onClose?: () => void;
  isFloating?: boolean;
}

export const LsmInspector: React.FC<LsmInspectorProps> = ({
  state,
  activeVertexId,
  onClose,
  isFloating = false,
}) => {
  // Purely computed LVG from canonical state — strictly invariant under viewing rotation
  const lvg: LVG = useMemo(() => {
    return computeLVG(state, activeVertexId);
  }, [state, activeVertexId]);

  // Mini canvas viewport size
  const CANVAS_WIDTH = 220;
  const CANVAS_HEIGHT = 200;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Observer View Orientation: turning the globe in hands (angles in degrees for UI, radians for rendering)
  const [yawDeg, setYawDeg] = useState<number>(35);
  const [pitchDeg, setPitchDeg] = useState<number>(20);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const resetOrientation = () => {
    setYawDeg(35);
    setPitchDeg(20);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setYawDeg((prev) => {
      let next = prev + dx * 0.8;
      // Wrap yaw to [-180, 180]
      if (next > 180) next -= 360;
      if (next < -180) next += 360;
      return Math.round(next * 10) / 10;
    });

    setPitchDeg((prev) => {
      // Clamp pitch to [-85, 85]
      const next = Math.max(-85, Math.min(85, prev - dy * 0.8));
      return Math.round(next * 10) / 10;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Render physical globe on stand
  const renderGlobeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2 - 4; // slight offset for base stand
    const rSphere = 60; // sphere radius in pixels

    ctx.clearRect(0, 0, width, height);

    // Orientation angles in radians
    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // Rigid transformation: intrinsic coordinate p -> screen (sx, sy, depth)
    const project = (x: number, y: number, z: number) => {
      // Rotation around Y (Yaw)
      const x1 = cosY * x + sinY * z;
      const y1 = y;
      const z1 = -sinY * x + cosY * z;

      // Rotation around X (Pitch)
      const x2 = x1;
      const y2 = cosP * y1 - sinP * z1;
      const z2 = sinP * y1 + cosP * z1;

      return {
        sx: cx + x2 * rSphere,
        sy: cy - y2 * rSphere,
        depth: z2,
      };
    };

    // 1. PHYSICAL STAND RENDERING
    // A: Base & Pedestal
    const baseBottomY = cy + rSphere + 32;
    const baseTopY = cy + rSphere + 26;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, baseBottomY, 34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(cx, baseTopY, 26, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vertical column support
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, baseTopY);
    ctx.lineTo(cx, cy + rSphere + 12);
    ctx.stroke();

    // B: Outer Meridian Mounting Arc (holding the globe poles)
    const rBracket = rSphere + 10;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Semi-circular bracket around left/back side
    ctx.arc(cx, cy, rBracket, Math.PI * 0.45, Math.PI * 1.55, false);
    ctx.stroke();

    // Axis pins connecting bracket to poles
    const pN = project(0, 1, 0);
    const pS = project(0, -1, 0);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    // Central axis rod passing through the globe
    ctx.beginPath();
    ctx.moveTo(pN.sx, pN.sy);
    ctx.lineTo(pS.sx, pS.sy);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.stroke();

    // 2. GLOBE SPHERE BODY
    // Ambient spherical gradient for 3D depth
    const grad = ctx.createRadialGradient(
      cx - rSphere * 0.35,
      cy - rSphere * 0.35,
      rSphere * 0.05,
      cx,
      cy,
      rSphere
    );
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.65, '#0f172a');
    grad.addColorStop(1, '#020617');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rSphere, 0, Math.PI * 2);
    ctx.fill();

    // Sphere rim border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. PARALLELS & MERIDIANS RIGIDLY ROTATING WITH THE GLOBE
    const drawParallel = (phiRad: number, isEquator: boolean = false) => {
      const cosPhi = Math.cos(phiRad);
      const sinPhi = Math.sin(phiRad);
      const steps = 48;
      ctx.beginPath();
      ctx.lineWidth = isEquator ? 1.5 : 0.8;
      ctx.strokeStyle = isEquator ? 'rgba(56, 189, 248, 0.7)' : 'rgba(100, 116, 139, 0.4)';
      if (!isEquator) ctx.setLineDash([2, 3]);
      else ctx.setLineDash([]);

      let started = false;
      for (let s = 0; s <= steps; s++) {
        const lon = (s / steps) * Math.PI * 2;
        const x = cosPhi * Math.cos(lon);
        const y = sinPhi;
        const z = cosPhi * Math.sin(lon);
        const pt = project(x, y, z);

        // Only draw front hemisphere for clean visual clarity
        if (pt.depth >= -0.05) {
          if (!started) {
            ctx.moveTo(pt.sx, pt.sy);
            started = true;
          } else {
            ctx.lineTo(pt.sx, pt.sy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw Parallels: Equator (0°), ±30°, ±60°
    drawParallel(0, true);
    drawParallel(Math.PI / 6, false);
    drawParallel(-Math.PI / 6, false);
    drawParallel(Math.PI / 3, false);
    drawParallel(-Math.PI / 3, false);

    // Draw Meridians: every 45°
    const drawMeridian = (lonRad: number, isPrime: boolean = false) => {
      const steps = 36;
      ctx.beginPath();
      ctx.lineWidth = isPrime ? 1.2 : 0.8;
      ctx.strokeStyle = isPrime ? 'rgba(245, 158, 11, 0.65)' : 'rgba(100, 116, 139, 0.35)';
      ctx.setLineDash([2, 2]);

      let started = false;
      for (let s = 0; s <= steps; s++) {
        const phi = -Math.PI / 2 + (s / steps) * Math.PI;
        const x = Math.cos(phi) * Math.cos(lonRad);
        const y = Math.sin(phi);
        const z = Math.cos(phi) * Math.sin(lonRad);
        const pt = project(x, y, z);

        if (pt.depth >= -0.05) {
          if (!started) {
            ctx.moveTo(pt.sx, pt.sy);
            started = true;
          } else {
            ctx.lineTo(pt.sx, pt.sy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawMeridian(0, true); // Prime meridian (amber hint)
    drawMeridian(Math.PI / 2, false);
    drawMeridian(Math.PI, false);
    drawMeridian((3 * Math.PI) / 2, false);

    // 4. NORTH & SOUTH POLES (N & S)
    if (pN.depth >= -0.2) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pN.sx, pN.sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('N', pN.sx + 5, pN.sy - 3);
    }
    if (pS.depth >= -0.2) {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(pS.sx, pS.sy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('S', pS.sx + 5, pS.sy + 8);
    }

    // 5. CENTER VERTEX ORIGIN MARKER
    ctx.fillStyle = VERTEX_COLORS[activeVertexId]?.primary || '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // 6. PROJECT INCIDENT DIRECTION VECTORS u_ij
    const projectedVectors: Array<{
      targetId: VertexId;
      u: { x: number; y: number; z: number };
      proj: { sx: number; sy: number; depth: number };
      color: string;
    }> = [];

    for (const targetId of lvg.incidentTargets) {
      const edge = lvg.incidentEdges[targetId];
      if (!edge) continue;
      const u = edge.unitDirection;
      const proj = project(u.x, u.y, u.z);
      projectedVectors.push({
        targetId,
        u,
        proj,
        color: VERTEX_COLORS[targetId]?.primary || '#94a3b8',
      });
    }

    // 7. SPHERICAL TRIANGLE ARCS (Great circle geodesics between vectors)
    if (projectedVectors.length === 3) {
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        const p1 = projectedVectors[i];
        const p2 = projectedVectors[(i + 1) % 3];

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        const steps = 20;
        let started = false;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          // SLERP interpolation between unit vectors
          const dot = Math.max(-1, Math.min(1, p1.u.x * p2.u.x + p1.u.y * p2.u.y + p1.u.z * p2.u.z));
          const theta = Math.acos(dot);
          let ix = p1.u.x;
          let iy = p1.u.y;
          let iz = p1.u.z;
          if (theta >= 1e-6) {
            const sinT = Math.sin(theta);
            const a = Math.sin((1 - t) * theta) / sinT;
            const b = Math.sin(t * theta) / sinT;
            ix = a * p1.u.x + b * p2.u.x;
            iy = a * p1.u.y + b * p2.u.y;
            iz = a * p1.u.z + b * p2.u.z;
          }
          const pt = project(ix, iy, iz);
          if (pt.depth >= -0.1) {
            if (!started) {
              ctx.moveTo(pt.sx, pt.sy);
              started = true;
            } else {
              ctx.lineTo(pt.sx, pt.sy);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
    }

    // 8. DIRECTION VECTORS & LANDMARK LABELS
    // Render back hemisphere items first, then front hemisphere
    const sortedVectors = [...projectedVectors].sort((a, b) => a.proj.depth - b.proj.depth);

    for (const item of sortedVectors) {
      const { targetId, proj, color } = item;
      const isFront = proj.depth >= 0;

      // Ray from vertex center to globe surface
      ctx.lineWidth = isFront ? 2 : 1;
      ctx.strokeStyle = isFront ? color : 'rgba(100, 116, 139, 0.3)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(proj.sx, proj.sy);
      ctx.stroke();

      // Pinned landmark point on globe
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(proj.sx, proj.sy, isFront ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Vector identifier
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = isFront ? '#f8fafc' : '#64748b';
      const offsetX = proj.sx > cx ? 6 : -24;
      const offsetY = proj.sy > cy ? 12 : -6;
      ctx.fillText(`u_${activeVertexId}${targetId}`, proj.sx + offsetX, proj.sy + offsetY);
    }
  }, [lvg, activeVertexId, yawDeg, pitchDeg]);

  useEffect(() => {
    renderGlobeCanvas();
  }, [renderGlobeCanvas]);

  return (
    <div
      id={`lsm-inspector-${activeVertexId}`}
      className={`flex flex-col gap-2.5 animate-fadeIn ${
        isFloating
          ? 'bg-slate-900/95 backdrop-blur-xl border border-sky-500/50 rounded-xl p-3.5 shadow-2xl ring-1 ring-sky-500/30'
          : 'bg-slate-950/90 border border-sky-900/60 rounded-xl p-3 shadow-lg'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-sky-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-sky-200 tracking-wide">
              Глобус локальной угловой геометрии — вершина {activeVertexId}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              LVG / LSM · {activeVertexId}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              lvg.isValid
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                : 'bg-rose-950/70 text-rose-300 border-rose-800/80'
            }`}
          >
            {lvg.degeneracy}
          </span>
          <button
            onClick={resetOrientation}
            title="Сбросить ориентацию глобуса"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Закрыть плавающий инспектор"
              className="p-1 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-200 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Principle Banner: State = const, View = orientation */}
      <div className="flex items-center justify-between bg-slate-900/90 px-2 py-1 rounded text-[9px] font-mono border border-slate-800">
        <span className="text-slate-400">
          Угловая геометрия S²({activeVertexId}) = <span className="text-emerald-400 font-bold">CONST</span>
        </span>
        <span className="text-sky-300">
          ↻ Вращение глобуса в руках
        </span>
      </div>

      {/* Main Canvas + Quick Vector Legend */}
      <div className="flex gap-2.5 items-center">
        {/* Interactive canvas for Physical Globe */}
        <div className="relative shrink-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="cursor-grab active:cursor-grabbing block touch-none"
            title="Угловой глобус вершины — зажмите и перетаскивайте курсором для поворота глобуса в руках"
          />
          <div className="absolute top-1 left-1.5 pointer-events-none text-[8px] font-mono text-slate-500">
            S²({activeVertexId})
          </div>
          <div className="absolute bottom-1 right-1.5 pointer-events-none text-[8px] font-mono text-sky-400/80">
            {yawDeg}° / {pitchDeg}°
          </div>
        </div>

        {/* Vector breakdown */}
        <div className="flex flex-col gap-1.5 text-[10px] font-mono grow">
          <div className="text-[10px] text-slate-400 font-sans font-semibold">
            Направляющие рёбер на глобусе:
          </div>
          {lvg.incidentTargets.map((targetId) => {
            const edge = lvg.incidentEdges[targetId];
            const color = VERTEX_COLORS[targetId]?.primary || '#94a3b8';
            return (
              <div
                key={targetId}
                className="flex flex-col bg-slate-900/80 p-1.5 rounded border border-slate-800/80"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold flex items-center gap-1" style={{ color }}>
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: color }}
                    />
                    u_{activeVertexId}
                    {targetId}
                  </span>
                  <span className="text-[9px] text-slate-400">|e| = {edge.length.toFixed(2)}</span>
                </div>
                <div className="text-[9px] text-slate-400 pt-0.5">
                  ({edge.unitDirection.x.toFixed(2)}, {edge.unitDirection.y.toFixed(2)},{' '}
                  {edge.unitDirection.z.toFixed(2)})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Globe Orientation Sliders (Azimuth / Yaw & Pitch) */}
      <div className="flex flex-col gap-1.5 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 text-[10px]">
        {/* Azimuth / Yaw Slider */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400 font-mono shrink-0">
            Азимут (горизонт):
          </span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={yawDeg}
            onChange={(e) => setYawDeg(Number(e.target.value))}
            className="w-full accent-sky-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            title="Горизонтальный поворот глобуса (Yaw)"
          />
          <span className="font-mono text-sky-300 font-bold w-10 text-right">
            {yawDeg > 0 ? `+${yawDeg}` : yawDeg}°
          </span>
        </div>

        {/* Pitch / Tilt Slider */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400 font-mono shrink-0">
            Наклон оси (Pitch):
          </span>
          <input
            type="range"
            min="-85"
            max="85"
            step="1"
            value={pitchDeg}
            onChange={(e) => setPitchDeg(Number(e.target.value))}
            className="w-full accent-sky-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            title="Вертикальный наклон оси глобуса (Pitch)"
          />
          <span className="font-mono text-sky-300 font-bold w-10 text-right">
            {pitchDeg > 0 ? `+${pitchDeg}` : pitchDeg}°
          </span>
        </div>

        {/* Quick Orientation Presets */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px] font-mono">
          <span className="text-slate-500 font-sans">Ракурс модели:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setYawDeg(0);
                setPitchDeg(0);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Вид спереди"
            >
              Спереди
            </button>
            <button
              onClick={() => {
                setYawDeg(0);
                setPitchDeg(85);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Вид на полюс N сверху"
            >
              Полюс N
            </button>
            <button
              onClick={() => {
                setYawDeg(35);
                setPitchDeg(20);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Классическая изометрия"
            >
              Изо
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid: Solid Angle, Gram Det, Planar Angles */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 flex flex-col gap-1">
          <span className="text-slate-400 text-[9px] font-sans">Телесный угол Ω (Solid Angle):</span>
          <span className="text-sky-300 font-bold text-xs">
            {lvg.solidAngle.toFixed(4)} <span className="text-[9px] text-slate-400 font-normal">ср (sr)</span>
          </span>
          <span className="text-[9px] text-slate-500 font-sans">
            {((lvg.solidAngle / (4 * Math.PI)) * 100).toFixed(1)}% сферы
          </span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 flex flex-col gap-1">
          <span className="text-slate-400 text-[9px] font-sans">Определитель Грама det(G):</span>
          <span className="text-emerald-400 font-bold text-xs">
            {lvg.gramDeterminant.toFixed(5)}
          </span>
          <span className="text-[9px] text-slate-500 font-sans">
            {lvg.orientation === 'POSITIVE'
              ? 'Правая (Vs > 0)'
              : lvg.orientation === 'NEGATIVE'
              ? 'Левая (Vs < 0)'
              : 'Компланарно'}
          </span>
        </div>
      </div>

      {/* Planar angles at vertex */}
      <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/80 flex flex-col gap-1 text-[10px]">
        <span className="text-slate-400 text-[9px] font-sans font-medium">
          Плоские углы при вершине {activeVertexId}:
        </span>
        <div className="grid grid-cols-3 gap-1 font-mono text-center">
          {Object.entries(lvg.planarAngles).map(([pair, rad]) => (
            <div key={pair} className="bg-slate-950 p-1 rounded border border-slate-800">
              <span className="text-[9px] text-slate-500 block">∠{pair}</span>
              <span className="text-amber-300 font-bold">{((rad * 180) / Math.PI).toFixed(1)}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
