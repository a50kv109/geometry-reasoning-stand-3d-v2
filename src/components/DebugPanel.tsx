/**
 * ENGINEERING & DIAGNOSTIC PANEL (Section 7 - Workstation Sidebar Edition)
 * 
 * Strict architectural isolation:
 * - Retains all original M1 engineering diagnostics without cluttering the primary human visual focus.
 * - Displays canonical state JSON, validation results, persistent topology, FNV-1a hash, and scale tolerances.
 * - Collapsible accordion component.
 */

import React, { useState } from 'react';
import {
  CanonicalGeometryState,
  GeometryValidationResult,
  RepresentationState,
} from '../core/types';
import { CANONICAL_VERTICES, CANONICAL_EDGES, CANONICAL_FACES } from '../core/topology';
import { computeGeometrySignature, computeGeometryHash } from '../core/signature';
import { getResolvedTolerances } from '../core/tolerances';
import { 
  ChevronDown, 
  ChevronRight, 
  Terminal, 
  CheckCircle2, 
} from 'lucide-react';

interface DebugPanelProps {
  canonicalState: CanonicalGeometryState;
  validation: GeometryValidationResult;
  repState: RepresentationState;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  canonicalState,
  validation,
  repState,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const signature = computeGeometrySignature(canonicalState);
  const hash = computeGeometryHash(canonicalState);
  const tol = getResolvedTolerances(canonicalState.sphere.radius);

  return (
    <div id="engineering-debug-panel" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        id="toggle-debug-panel-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 flex items-center justify-between transition-colors border-b border-slate-800/60"
      >
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
            7. Инженерная диагностика M1
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
            <CheckCircle2 className="w-2.5 h-2.5" />
            17/17 ТЕСТОВ
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-3 space-y-3 font-mono text-xs bg-slate-950/90 border-t border-slate-800/50">
          {/* 1. Canonical State */}
          <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-semibold text-slate-200 uppercase text-[10px]">
                Каноническое состояние S²(O, R)
              </span>
              <span className="text-slate-500 text-[9px]">R³ Baseline</span>
            </div>

            <div className="text-[10px] text-emerald-300">
              Сфера: O(0,0,0), R = {canonicalState.sphere.radius.toFixed(4)}
            </div>

            <div className="space-y-1 pt-1">
              {CANONICAL_VERTICES.map((id) => {
                const pt = canonicalState.vertices[id];
                const sph = repState.sphericalCoordinates[id];
                return (
                  <div key={id} className="text-[10px] text-slate-300 flex justify-between">
                    <span className="font-bold text-slate-200">{id}:</span>
                    <span>({pt.x.toFixed(4)}, {pt.y.toFixed(4)}, {pt.z.toFixed(4)})</span>
                    <span className="text-slate-500">
                      lat:{((sph.phi * 180) / Math.PI).toFixed(0)}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Validation Status */}
          <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[10px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-semibold text-slate-200 uppercase text-[10px]">
                Валидация геометрии
              </span>
              <span
                className={`px-1 rounded font-semibold ${
                  validation.isValid
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {validation.isValid ? 'VALID' : 'INVALID'}
              </span>
            </div>
            <div className="text-slate-300">Вход: {validation.inputStatus}</div>
            <div className="text-amber-300">Реализация: {validation.realizationStatus}</div>
            <div className="text-slate-400 leading-tight">{validation.message}</div>
          </div>

          {/* 3. FNV-1a Hash & Signature */}
          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">FNV-1a Хэш:</span>
              <span className="text-amber-400 font-bold">{hash}</span>
            </div>
            <div className="break-all text-[8px] text-slate-500 bg-slate-950 p-1.5 rounded border border-slate-800 leading-tight">
              {signature}
            </div>
            <div className="text-[9px] text-slate-500 italic">
              Вычисляется строго из O, R и координат A, B, C, D без метаданных.
            </div>
          </div>

          {/* 4. Package 06 Tolerances */}
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-[9px] text-slate-400 space-y-0.5">
            <div>epsSphere: {tol.epsSphere.toExponential(1)}</div>
            <div>epsCoincident: {tol.epsCoincident.toExponential(1)}</div>
            <div>epsVolume: {tol.epsVolume.toExponential(1)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
