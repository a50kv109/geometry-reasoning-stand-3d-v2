/**
 * LEARNING & EXPLANATION PANEL (Dependencies & Reasoning - Workstation Sidebar Edition)
 * 
 * Generates dynamic educational explanations from the semantic causal dependency graph.
 * Explains:
 * - 5. Dependencies: Direct effects (incident edges and faces) vs Invariant elements (unaffected elements)
 * - 6. Learning / Explanation: Educational narrative and geometric principles in clear Russian.
 */

import React from 'react';
import { CausalAnalysis, SelectedElement } from '../visualization/causalModel';
import { CanonicalGeometryState } from '../core/types';
import { cartesianToSpherical } from '../core/representation';
import { 
  GraduationCap, 
  GitBranch, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  Compass,
} from 'lucide-react';

interface LearningPanelProps {
  causal: CausalAnalysis;
  selectedElement: SelectedElement;
  state?: CanonicalGeometryState;
}

export const LearningPanel: React.FC<LearningPanelProps> = ({
  causal,
  selectedElement,
  state,
}) => {
  // Derive spherical coordinates for the selected vertex if available
  let vertexCoords: { phiDeg: number; lamDeg: number; phiStr: string; lamStr: string } | null = null;
  if (state && selectedElement.type === 'VERTEX' && state.vertices[selectedElement.id]) {
    const pt = state.vertices[selectedElement.id];
    const sph = cartesianToSpherical(state.sphere, pt);
    const phiDeg = (sph.phi * 180) / Math.PI;
    const lamDeg = (sph.lambda * 180) / Math.PI;
    const sign = phiDeg >= 0 ? '+' : '';
    vertexCoords = {
      phiDeg,
      lamDeg,
      phiStr: `${sign}${phiDeg.toFixed(1)}°`,
      lamStr: `${lamDeg.toFixed(1)}°`,
    };
  }

  return (
    <div id="learning-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-col gap-3 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            5. Зависимости и 6. Обучение
          </h3>
        </div>
        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {causal.title}
        </span>
      </div>

      {/* 6. Human-Readable Explanation / Summary */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
          Геометрический смысл:
        </span>
        <p className="text-xs text-slate-300 leading-relaxed">
          {causal.summary}
        </p>
      </div>

      {/* Per-Vertex Coordinate Guides Educational Narrative (M1.7) */}
      {selectedElement.type === 'VERTEX' && vertexCoords && (
        <div id="vertex-coordinate-guide-card" className="bg-slate-950/80 p-3 rounded-lg border border-sky-500/30 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Координатные направляющие вершины {selectedElement.id}</span>
            </div>
            <span className="text-[10px] font-mono bg-sky-500/10 px-2 py-0.5 rounded text-sky-300 border border-sky-500/20">
              φ = {vertexCoords.phiStr}, λ = {vertexCoords.lamStr}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>
              Вершина <strong className="text-amber-400 font-semibold">{selectedElement.id}</strong> находится на широте <code className="text-sky-300 font-mono font-bold">φ = {vertexCoords.phiStr}</code> и долготе <code className="text-emerald-300 font-mono font-bold">λ = {vertexCoords.lamStr}</code>.
            </p>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Меридиан (линия долготы λ):</strong> проходит через вершину {selectedElement.id} и оба полюса сферы (Северный N и Южный S).</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">•</span>
                <span><strong>Параллель (линия широты φ):</strong> проходит через вершину {selectedElement.id} параллельно плоскости экватора и перпендикулярна оси вращения Z.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span>Координатные кривые пересекаются строго в точке {selectedElement.id}, образуя наглядный локальный координатный репер на сфере.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.1. Direct Effects (Incident Elements that change) */}
      {causal.directEffects.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Непосредственно изменяются:</span>
          </div>
          <ul className="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-lg border border-amber-500/20 text-xs">
            {causal.directEffects.map((text, i) => (
              <li key={i} className="flex items-start gap-1.5 text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5.2. Invariant Elements (Unaffected Branch) */}
      {causal.invariantElements.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Не затрагиваются (инварианты):</span>
          </div>
          <ul className="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-lg border border-emerald-500/20 text-xs">
            {causal.invariantElements.map((text, i) => (
              <li key={i} className="flex items-start gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span className="text-[11px] leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Principle Note */}
      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5 leading-snug">
          <strong className="text-slate-300">Принцип причинной связи:</strong>
          <span>
            При перемещении вершины изменяются ровно 3 инцидентных ребра и 3 инцидентные грани. Противоположная грань остаётся фиксированной.
          </span>
        </div>
      </div>
    </div>
  );
};
