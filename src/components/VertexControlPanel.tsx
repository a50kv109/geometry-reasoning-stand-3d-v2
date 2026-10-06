/**
 * VERTEX CONTROL PANEL (Interactive Surface Manipulation - Workstation Sidebar Edition)
 * 
 * Strict invariants:
 * - All four vertices A, B, C, D have equal interaction semantics (no privileged vertex).
 * - Every manipulation produces a valid point on sphere S^2(O, R).
 * - Preserves persistent vertex identities.
 * - Regular tetrahedron is explicitly marked as a SPECIAL STATE, not base object.
 */

import React from 'react';
import { CanonicalGeometryState, VertexId, Point3D } from '../core/types';
import { CANONICAL_VERTICES } from '../core/topology';
import { cartesianToSpherical, sphericalToCartesian } from '../core/representation';
import { createPoint3D, distance3D } from '../core/geometryState';
import { VERTEX_COLORS } from '../visualization/renderer3d';
import { Sliders, Sparkles, AlertTriangle, RefreshCw, Compass } from 'lucide-react';

interface VertexControlPanelProps {
  state: CanonicalGeometryState;
  activeVertexId: VertexId;
  onSelectVertex: (id: VertexId) => void;
  onUpdateVertex: (id: VertexId, newPoint: Point3D) => void;
  onApplyPreset: (name: string, vertices: Record<VertexId, Point3D>) => void;
}

export const VertexControlPanel: React.FC<VertexControlPanelProps> = ({
  state,
  activeVertexId,
  onSelectVertex,
  onUpdateVertex,
  onApplyPreset,
}) => {
  const currentPoint = state.vertices[activeVertexId];
  const R = state.sphere.radius;
  const currentSpherical = cartesianToSpherical(state.sphere, currentPoint);

  // Convert radians to degrees for human-friendly editing
  const latDeg = (currentSpherical.phi * 180) / Math.PI;
  const lonDeg = (currentSpherical.lambda * 180) / Math.PI;

  const handleLatitudeChange = (newLatDeg: number) => {
    // Clamp to [-90, 90]
    const clampedLat = Math.max(-90, Math.min(90, newLatDeg));
    const phi = (clampedLat * Math.PI) / 180;
    const newPt = sphericalToCartesian(state.sphere, { phi, lambda: currentSpherical.lambda });
    onUpdateVertex(activeVertexId, newPt);
  };

  const handleLongitudeChange = (newLonDeg: number) => {
    // Wrap to [0, 360)
    let normLon = newLonDeg % 360;
    if (normLon < 0) normLon += 360;
    const lambda = (normLon * Math.PI) / 180;
    const newPt = sphericalToCartesian(state.sphere, { phi: currentSpherical.phi, lambda });
    onUpdateVertex(activeVertexId, newPt);
  };

  // Preset Configurations
  const applyRegularTetrahedron = () => {
    const vertices: Record<VertexId, Point3D> = {
      A: createPoint3D(0, 0, R),
      B: createPoint3D((2 * Math.sqrt(2) / 3) * R, 0, (-1 / 3) * R),
      C: createPoint3D((-Math.sqrt(2) / 3) * R, (-Math.sqrt(6) / 3) * R, (-1 / 3) * R),
      D: createPoint3D((-Math.sqrt(2) / 3) * R, (Math.sqrt(6) / 3) * R, (-1 / 3) * R),
    };
    onApplyPreset('Правильный тетраэдр', vertices);
  };

  const applyInvertedOrientation = () => {
    const vertices: Record<VertexId, Point3D> = {
      A: createPoint3D(0, 0, R),
      B: createPoint3D((-Math.sqrt(2) / 3) * R, (-Math.sqrt(6) / 3) * R, (-1 / 3) * R),
      C: createPoint3D((2 * Math.sqrt(2) / 3) * R, 0, (-1 / 3) * R),
      D: createPoint3D((-Math.sqrt(2) / 3) * R, (Math.sqrt(6) / 3) * R, (-1 / 3) * R),
    };
    onApplyPreset('Отрицательная ориентация (левая)', vertices);
  };

  const applyCoplanarDegeneracy = () => {
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const vertices: Record<VertexId, Point3D> = {
      A: createPoint3D(R * Math.cos(angles[0]), R * Math.sin(angles[0]), 0),
      B: createPoint3D(R * Math.cos(angles[1]), R * Math.sin(angles[1]), 0),
      C: createPoint3D(R * Math.cos(angles[2]), R * Math.sin(angles[2]), 0),
      D: createPoint3D(R * Math.cos(angles[3]), R * Math.sin(angles[3]), 0),
    };
    onApplyPreset('Компланарная вырожденность', vertices);
  };

  const applyNearDegenerate = () => {
    const vertices: Record<VertexId, Point3D> = {
      A: createPoint3D(R, 0, 0),
      B: createPoint3D(0, R, 0),
      C: createPoint3D(-R, 0, 0),
      D: sphericalToCartesian(state.sphere, { phi: 0.04, lambda: (3 * Math.PI) / 2 }),
    };
    onApplyPreset('Околовырожденная конфигурация', vertices);
  };

  const distFromCenter = distance3D(currentPoint, state.sphere.center);
  const deviation = Math.abs(distFromCenter - R);

  return (
    <div id="vertex-control-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col gap-3.5">
      {/* 1. ACTIVE VERTEX SELECTOR TABS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              1. Активная вершина
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Равноправные вершины на S²
          </span>
        </div>

        {/* 4 Tabs: A, B, C, D */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {CANONICAL_VERTICES.map((id) => {
            const isSelected = activeVertexId === id;
            const color = VERTEX_COLORS[id];
            return (
              <button
                key={id}
                id={`select-vertex-tab-${id}`}
                onClick={() => onSelectVertex(id)}
                className={`py-1.5 px-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700 ring-1 ring-amber-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: color.primary }}
                />
                <span>{id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. POSITION CONTROLS (Spherical Lat/Lon + Cartesian R³) */}
      <div className="flex flex-col gap-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px]">
            2. Положение вершины {activeVertexId}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
            |P - O| = {R.toFixed(2)}
          </span>
        </div>

        {/* Latitude Control */}
        <div className="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium text-[11px]">Широта φ (Latitude)</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sky-400 font-bold text-xs">
                {latDeg.toFixed(1)}°
              </span>
              <span className="text-slate-500 text-[10px] font-mono">
                ({currentSpherical.phi.toFixed(2)} рад)
              </span>
            </div>
          </div>
          <input
            id="vertex-latitude-slider"
            type="range"
            min="-90"
            max="90"
            step="0.5"
            value={latDeg}
            onChange={(e) => handleLatitudeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 my-1"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>-90° (Южный полюс)</span>
            <span>0° (Экватор)</span>
            <span>+90° (Северный полюс)</span>
          </div>
        </div>

        {/* Longitude Control */}
        <div className="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium text-[11px]">Долгота λ (Longitude)</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sky-400 font-bold text-xs">
                {lonDeg.toFixed(1)}°
              </span>
              <span className="text-slate-500 text-[10px] font-mono">
                ({currentSpherical.lambda.toFixed(2)} рад)
              </span>
            </div>
          </div>
          <input
            id="vertex-longitude-slider"
            type="range"
            min="0"
            max="360"
            step="0.5"
            value={lonDeg}
            onChange={(e) => handleLongitudeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 my-1"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0°</span>
            <span>180°</span>
            <span>360°</span>
          </div>
        </div>

        {/* Cartesian Coordinates Readout */}
        <div className="grid grid-cols-3 gap-1.5 px-2.5 py-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-center">
          <div>
            <span className="text-slate-500 block text-[9px]">X</span>
            <span className="text-red-400 font-bold">{currentPoint.x.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">Y</span>
            <span className="text-emerald-400 font-bold">{currentPoint.y.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">Z</span>
            <span className="text-sky-400 font-bold">{currentPoint.z.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Preset Geometry Configurations */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            Геометрические пресеты:
          </span>
          <span className="text-[9px] text-slate-500">
            Базовый объект — произвольный
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            id="preset-regular-btn"
            onClick={applyRegularTetrahedron}
            title="Установить симметричный правильный тетраэдр"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Правильный</span>
          </button>

          <button
            id="preset-inverted-btn"
            onClick={applyInvertedOrientation}
            title="Переставить вершины для левой ориентации (Vs < 0)"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Левая (Vs &lt; 0)</span>
          </button>

          <button
            id="preset-coplanar-btn"
            onClick={applyCoplanarDegeneracy}
            title="Расположить вершины в плоскости экватора (Vs = 0)"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Вырожденный</span>
          </button>

          <button
            id="preset-near-deg-btn"
            onClick={applyNearDegenerate}
            title="Приблизить тетраэдр к вырождению для проверки порога"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Околовырожден.</span>
          </button>
        </div>
      </div>
    </div>
  );
};
