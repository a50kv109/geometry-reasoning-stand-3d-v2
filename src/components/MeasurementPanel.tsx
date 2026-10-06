/**
 * MEASUREMENT PANEL (Geometric Measurements & State - Workstation Sidebar Edition)
 * 
 * Strict invariants:
 * - Displays derived geometric measurements without exposing raw implementation guts.
 * - Uses clear Russian educational terminology:
 *   Сфера, Центр, Радиус, Вершины, Рёбра, Грани, Объём, Площадь поверхности,
 *   Центроид, Широта, Долгота, Ориентация, Правильный, Вырожденный, Допустимый.
 * - Highlights affected vs invariant quantities according to current selection.
 */

import React from 'react';
import { CanonicalGeometryState } from '../core/types';
import { CANONICAL_VERTICES, CANONICAL_EDGES, CANONICAL_FACES } from '../core/topology';
import { ComprehensiveGeometryMetrics } from '../core/metrics';
import { cartesianToSpherical } from '../core/representation';
import { CausalAnalysis, SelectedElement } from '../visualization/causalModel';
import { VERTEX_COLORS } from '../visualization/renderer3d';
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';

interface MeasurementPanelProps {
  state: CanonicalGeometryState;
  metrics: ComprehensiveGeometryMetrics;
  causal: CausalAnalysis;
  selectedElement: SelectedElement;
  onSelectElement: (element: SelectedElement) => void;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  state,
  metrics,
  causal,
  selectedElement,
  onSelectElement,
}) => {
  const { sphere, vertices } = state;
  const { global, edges, faces } = metrics;

  return (
    <div id="measurement-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col gap-3.5 text-slate-200">
      {/* Panel Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            3. Измерения и 4. Состояние
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Сфера R = <strong className="text-sky-300 font-mono">{sphere.radius.toFixed(2)}</strong>
        </span>
      </div>

      {/* 4. GEOMETRIC STATE SUMMARY */}
      <div className="grid grid-cols-2 gap-2">
        {/* Volume */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-medium">Объём со знаком (V_s)</span>
          <span className="font-mono text-sm font-bold text-amber-300">
            {global.signedVolume.toFixed(4)}
          </span>
          <span className="text-[9px] text-slate-500">
            {global.orientation === 'POSITIVE' && 'Правая ориентация (+)'}
            {global.orientation === 'NEGATIVE' && 'Левая ориентация (-)'}
            {global.orientation === 'COPLANAR' && 'Вырожден (|Vs| ≈ 0)'}
          </span>
        </div>

        {/* Total Surface Area */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-medium">Площадь поверхности</span>
          <span className="font-mono text-sm font-bold text-sky-300">
            {global.totalSurfaceArea.toFixed(4)}
          </span>
          <span className="text-[9px] text-slate-500">Сумма 4 граней</span>
        </div>
      </div>

      {/* State & Regularity Badges */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
        <span className="text-[11px] text-slate-400">Геометрический статус:</span>
        <div className="flex items-center gap-1.5">
          {global.isRegular ? (
            <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              Правильный
            </span>
          ) : global.orientation === 'COPLANAR' ? (
            <span className="inline-flex items-center gap-1 text-red-300 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3" />
              Вырожденный
            </span>
          ) : (
            <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
              Произвольный
            </span>
          )}
        </div>
      </div>

      {/* Centroid coordinates */}
      <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-medium">Центроид G:</span>
        <div className="font-mono text-[11px] text-slate-300 flex items-center gap-2">
          <span>X: <strong className="text-red-400">{global.centroid.x.toFixed(2)}</strong></span>
          <span>Y: <strong className="text-emerald-400">{global.centroid.y.toFixed(2)}</strong></span>
          <span>Z: <strong className="text-sky-400">{global.centroid.z.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* 3.1. VERTICES (A, B, C, D) */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
          <span>Вершины (на сфере S²)</span>
          <span className="text-[9px] text-slate-500 font-normal">Кликните для выбора</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {CANONICAL_VERTICES.map((id) => {
            const pt = vertices[id];
            const sph = cartesianToSpherical(sphere, pt);
            const latDeg = (sph.phi * 180) / Math.PI;
            const lonDeg = (sph.lambda * 180) / Math.PI;

            const isSelected = selectedElement?.type === 'VERTEX' && selectedElement.id === id;
            const isAffected = causal.affectedVertices.has(id);
            const color = VERTEX_COLORS[id];

            return (
              <div
                key={id}
                id={`metric-vertex-${id}`}
                onClick={() => onSelectElement({ type: 'VERTEX', id })}
                className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col gap-0.5 ${
                  isSelected
                    ? 'bg-slate-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/50'
                    : isAffected
                    ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: color.primary }}
                    />
                    <strong className="font-bold text-white text-xs">{id}</strong>
                  </div>

                  {isSelected && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 uppercase font-mono">
                      Выбрана
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>φ:{latDeg.toFixed(0)}°</span>
                  <span>λ:{lonDeg.toFixed(0)}°</span>
                </div>

                <div className="font-mono text-[9px] text-slate-500 truncate">
                  ({pt.x.toFixed(2)}, {pt.y.toFixed(2)}, {pt.z.toFixed(2)})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.2. EDGES (6 Straight Euclidean Chords) */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
          <span>Рёбра тетраэдра (6 хорд)</span>
          <span className="text-[9px] text-slate-500 font-normal">Длина L</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {CANONICAL_EDGES.map((edge) => {
            const edgeMetric = edges[edge.id];
            const isSelected = selectedElement?.type === 'EDGE' && selectedElement.id === edge.id;
            const isAffected = causal.affectedEdges.has(edge.id);

            return (
              <div
                key={edge.id}
                id={`metric-edge-${edge.id}`}
                onClick={() => onSelectElement({ type: 'EDGE', id: edge.id })}
                className={`px-2 py-1 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                    : isAffected
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-100 hover:border-amber-400/60'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[11px]">{edge.id}</span>
                  {isAffected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                </div>
                <span className="font-mono font-bold text-sky-400 text-[11px]">
                  {edgeMetric ? edgeMetric.length.toFixed(2) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.3. FACES (4 Planar Triangles) */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
          <span>Грани (4 треугольника)</span>
          <span className="text-[9px] text-slate-500 font-normal">Площадь S</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {CANONICAL_FACES.map((face) => {
            const faceMetric = faces[face.id];
            const isSelected = selectedElement?.type === 'FACE' && selectedElement.id === face.id;
            const isAffected = causal.affectedFaces.has(face.id);

            return (
              <div
                key={face.id}
                id={`metric-face-${face.id}`}
                onClick={() => onSelectElement({ type: 'FACE', id: face.id })}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                    : isAffected
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-100 hover:border-amber-400/60'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <span>{face.id}</span>
                  {isAffected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                </div>

                <div className="font-mono text-[11px] text-sky-300 font-bold">
                  S = {faceMetric ? faceMetric.area.toFixed(3) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
