/**
 * 3D GEOMETRY REASONING STAND — WORKSTATION LAYOUT (M1.6 + Agent Boundary)
 * 
 * Strict architectural adherence:
 * - Two-column workstation layout:
 *   - Left (~65% width): Large persistent 3D Geometry Viewport filling vertical workspace.
 *   - Right (~35% width): Independently scrollable Reasoning & Measurement Panel.
 * - Zero wasted horizontal margins: uses the full available browser viewport.
 * - Browser-level document scroll eliminated on desktop screens.
 * - 3D viewport controls (rotation, zoom, presets, toggles) kept inside/adjacent to 3D canvas.
 * - Unified semantic selection state synchronized between 3D scene and information panel.
 * - Preserves authoritative M1 canonical geometry state and validation.
 * - Incorporates Agent Boundary & Oracle verification testing layer.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  createPoint3D,
  createSphere3D,
  createCanonicalGeometryState,
  validateGeometryState,
  deriveRepresentationState,
  computeDerivedMetrics,
  VertexId,
  Point3D,
} from './core';
import { analyzeCausalNeighborhood, SelectedElement } from './visualization/causalModel';
import { GeometryViewport } from './components/GeometryViewport';
import { MeasurementPanel } from './components/MeasurementPanel';
import { LearningPanel } from './components/LearningPanel';
import { VertexControlPanel } from './components/VertexControlPanel';
import { DebugPanel } from './components/DebugPanel';
import { AgentTestPanel } from './components/AgentTestPanel';
import { 
  Box, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers,
  Sliders,
  Orbit
} from 'lucide-react';

export default function App() {
  // Authoritative Canonical State: Sphere S²(O, R=1.0) and 4 persistent vertices A, B, C, D
  const [sphereRadius] = useState<number>(1.0);
  const [sphereCenter] = useState<Point3D>(() => createPoint3D(0, 0, 0));

  // Initial Configuration: Canonical Regular Tetrahedron on Unit Sphere R=1
  const [vertices, setVertices] = useState<Record<VertexId, Point3D>>(() => ({
    A: createPoint3D(0, 0, 1.0),
    B: createPoint3D((2 * Math.sqrt(2) / 3) * 1.0, 0, (-1 / 3) * 1.0),
    C: createPoint3D((-Math.sqrt(2) / 3) * 1.0, (-Math.sqrt(6) / 3) * 1.0, (-1 / 3) * 1.0),
    D: createPoint3D((-Math.sqrt(2) / 3) * 1.0, (Math.sqrt(6) / 3) * 1.0, (-1 / 3) * 1.0),
  }));

  // Selected Geometric Element (Vertex, Edge, Face, or Sphere)
  // Default to Vertex D to immediately demonstrate the causal dependency neighborhood
  const [selectedElement, setSelectedElement] = useState<SelectedElement>({ type: 'VERTEX', id: 'D' });

  // 1. Authoritative Canonical Geometry State (M1 Sole Source of Truth)
  const sphere = useMemo(() => createSphere3D(sphereCenter, sphereRadius), [sphereCenter, sphereRadius]);
  const canonicalState = useMemo(() => createCanonicalGeometryState(sphere, vertices), [sphere, vertices]);

  // 2. Deterministic Validation (M1.2)
  const validation = useMemo(() => validateGeometryState(sphere, vertices), [sphere, vertices]);

  // 3. Derived Comprehensive Metrics (Lengths, Areas, Volume, Centroid, Regularity)
  const metrics = useMemo(() => computeDerivedMetrics(canonicalState), [canonicalState]);

  // 4. Semantic Causal Dependency Analysis (Dynamic Causal Graph)
  const causal = useMemo(() => analyzeCausalNeighborhood(selectedElement), [selectedElement]);

  // 5. Representation State (Spherical coordinates derived on-demand)
  const repState = useMemo(() => deriveRepresentationState(canonicalState, 'CARTESIAN'), [canonicalState]);

  // Handler for vertex movement (preserves persistent identity and sphere membership)
  const handleUpdateVertex = useCallback((id: VertexId, newPoint: Point3D) => {
    setVertices((prev) => ({
      ...prev,
      [id]: newPoint,
    }));
  }, []);

  // Handler for preset configurations
  const handleApplyPreset = useCallback((_name: string, newVertices: Record<VertexId, Point3D>) => {
    setVertices(newVertices);
  }, []);

  // Active vertex for sliders (if selected element is a vertex, use it; else default to A)
  const activeVertexId: VertexId = selectedElement?.type === 'VERTEX' ? selectedElement.id : 'A';

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white font-sans">
      {/* Compact Top Header Bar */}
      <header className="h-12 shrink-0 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight whitespace-nowrap">
                3D Стенд геометрических рассуждений
              </h1>
              <span className="text-[9px] font-mono uppercase bg-slate-800 text-sky-400 px-1.5 py-0.2 rounded border border-slate-700 hidden sm:inline-block">
                M1.6 + Agent Stand
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden md:block">
              Вписанный тетраэдр в сферу S²(O, R) — рабочий геометрический инструмент
            </p>
          </div>
        </div>

        {/* Global Status Badges */}
        <div className="flex items-center gap-2 text-xs">
          {/* Active Vertex Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
            <Sliders className="w-3 h-3" />
            <span>Вершина {activeVertexId}</span>
          </div>

          {/* Geometric Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-medium ${
              validation.isValid && metrics.global.orientation !== 'COPLANAR'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : metrics.global.orientation === 'COPLANAR'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
            }`}
          >
            {validation.isValid && metrics.global.orientation !== 'COPLANAR' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {metrics.global.orientation === 'POSITIVE' && 'Правая ориентация'}
              {metrics.global.orientation === 'NEGATIVE' && 'Левая ориентация'}
              {metrics.global.orientation === 'COPLANAR' && 'Вырожденный (плоский)'}
            </span>
            <span className="sm:hidden">
              {metrics.global.orientation === 'POSITIVE' && 'Правая'}
              {metrics.global.orientation === 'NEGATIVE' && 'Левая'}
              {metrics.global.orientation === 'COPLANAR' && 'Плоский'}
            </span>
          </div>

          {/* Regularity Pill */}
          {metrics.global.isRegular && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px]">
              <Sparkles className="w-3 h-3" />
              <span>Правильный</span>
            </div>
          )}

          {/* LSM / LVG Badge */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[11px] font-mono">
            <Orbit className="w-3 h-3 text-sky-400" />
            <span>LSM / LVG</span>
          </div>
        </div>
      </header>

      {/* Main Workstation Layout (Desktop: 65% Viewport / 35% Sidebar) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full p-2 sm:p-2.5 gap-2.5 bg-slate-950">
        {/* LEFT COLUMN: 3D GEOMETRY VIEWPORT (PERSISTENT, ~65% WIDTH) */}
        <section 
          id="workstation-viewport-section"
          className="w-full lg:w-[65%] h-[440px] lg:h-full shrink-0 flex flex-col relative rounded-xl overflow-hidden shadow-2xl border border-slate-800/90"
        >
          <GeometryViewport
            state={canonicalState}
            metrics={metrics}
            causal={causal}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateVertex={handleUpdateVertex}
          />
        </section>

        {/* RIGHT COLUMN: INFORMATION & REASONING PANEL (INDEPENDENTLY SCROLLABLE, ~35% WIDTH) */}
        <aside 
          id="workstation-sidebar-section"
          className="w-full lg:w-[35%] flex-1 lg:h-full min-w-0 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl"
        >
          {/* Sidebar Top Header */}
          <div className="px-3.5 py-2 bg-slate-900/80 border-b border-slate-800/90 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Информационная панель и рассуждения</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Независимая прокрутка
            </span>
          </div>

          {/* Independently Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
            {/* 1. ACTIVE VERTEX & 2. POSITION CONTROLS */}
            <VertexControlPanel
              state={canonicalState}
              activeVertexId={activeVertexId}
              onSelectVertex={(id) => setSelectedElement({ type: 'VERTEX', id })}
              onUpdateVertex={handleUpdateVertex}
              onApplyPreset={handleApplyPreset}
            />

            {/* 3. GEOMETRIC MEASUREMENTS & 4. GEOMETRIC STATE */}
            <MeasurementPanel
              state={canonicalState}
              metrics={metrics}
              causal={causal}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
            />

            {/* 5. DEPENDENCIES & 6. EDUCATIONAL REASONING / EXPLANATION */}
            <LearningPanel
              causal={causal}
              selectedElement={selectedElement}
              state={canonicalState}
            />

            {/* 7. AGENT BOUNDARY & ORACLE VERIFICATION */}
            <AgentTestPanel
              canonical={canonicalState}
              representation={repState}
              validation={validation}
            />

            {/* 8. ENGINEERING DIAGNOSTICS (COLLAPSIBLE ACCORDION) */}
            <DebugPanel
              canonicalState={canonicalState}
              validation={validation}
              repState={repState}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}
