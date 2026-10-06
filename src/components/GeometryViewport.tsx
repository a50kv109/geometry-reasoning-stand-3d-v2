/**
 * GEOMETRY VIEWPORT COMPONENT (Human Visual Workbench)
 * 
 * Dominant 3D viewport displaying:
 * - Sphere S^2(O, R)
 * - Four vertices A, B, C, D
 * - Six Euclidean edges
 * - Four planar triangular faces
 * - Spherical coordinate grid (parallels, meridians, equator, poles)
 * - Fixed world XYZ coordinate frame
 * - Interactive camera and direct on-sphere vertex manipulation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanonicalGeometryState, VertexId, Point3D } from '../core/types';
import { CANONICAL_VERTICES } from '../core/topology';
import { ComprehensiveGeometryMetrics } from '../core/metrics';
import { cartesianToSpherical, sphericalToCartesian } from '../core/representation';
import { CameraState, INITIAL_CAMERA, projectWorldPoint, raycastScreenToSphere } from '../visualization/camera';
import { CausalAnalysis, SelectedElement } from '../visualization/causalModel';
import { renderScene, RenderOptions, DEFAULT_RENDER_OPTIONS } from '../visualization/renderer3d';
import { 
  Rotate3d, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Eye, 
  Maximize2,
  Grid,
  Layers,
  CircleDot,
  Scaling,
  Maximize
} from 'lucide-react';

interface GeometryViewportProps {
  state: CanonicalGeometryState;
  metrics: ComprehensiveGeometryMetrics;
  causal: CausalAnalysis;
  selectedElement: SelectedElement;
  onSelectElement: (element: SelectedElement) => void;
  onUpdateVertex: (id: VertexId, newPoint: Point3D) => void;
}

export const GeometryViewport: React.FC<GeometryViewportProps> = ({
  state,
  metrics,
  causal,
  selectedElement,
  onSelectElement,
  onUpdateVertex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera State (Strictly Visualization State - NEVER mutates Canonical Geometry)
  const [camera, setCamera] = useState<CameraState>(INITIAL_CAMERA);
  const [renderOptions, setRenderOptions] = useState<RenderOptions>(DEFAULT_RENDER_OPTIONS);
  const [hoveredVertexId, setHoveredVertexId] = useState<VertexId | null>(null);

  // Mouse interaction state
  const isDraggingCameraRef = useRef(false);
  const isDraggingVertexRef = useRef<VertexId | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderScene(
      ctx,
      canvas.width,
      canvas.height,
      state,
      metrics,
      causal,
      camera,
      hoveredVertexId,
      renderOptions
    );
  }, [state, metrics, causal, camera, hoveredVertexId, renderOptions]);

  // Handle Resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      draw();
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);

    return () => observer.disconnect();
  }, [draw]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Helper: Find which vertex (if any) is under the screen coordinates (x, y)
  const findVertexAtScreen = (screenX: number, screenY: number): VertexId | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const R = state.sphere.radius;
    const visualScale = renderOptions.visualScale ?? 1.0;
    const targetPixelRadius = Math.min(rect.width, rect.height) * 0.32 * visualScale;
    const scaleMultiplier = targetPixelRadius / (R || 1);

    let closestVertex: VertexId | null = null;
    let minDistance = 18; // 18px threshold

    for (const id of CANONICAL_VERTICES) {
      const p = state.vertices[id];
      const proj = projectWorldPoint(p, camera, rect.width, rect.height, scaleMultiplier);
      const dist = Math.hypot(proj.x - screenX, proj.y - screenY);
      if (dist < minDistance) {
        minDistance = dist;
        closestVertex = id;
      }
    }

    return closestVertex;
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastMousePosRef.current = { x, y };

    // Check if clicked on a vertex
    const clickedVertex = findVertexAtScreen(x, y);
    if (clickedVertex) {
      isDraggingVertexRef.current = clickedVertex;
      onSelectElement({ type: 'VERTEX', id: clickedVertex });
    } else {
      // Start camera rotation
      isDraggingCameraRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - lastMousePosRef.current.x;
    const dy = y - lastMousePosRef.current.y;
    lastMousePosRef.current = { x, y };

    // 1. Direct Vertex Dragging on Sphere Surface
    if (isDraggingVertexRef.current) {
      const vId = isDraggingVertexRef.current;
      const R = state.sphere.radius;
      const visualScale = renderOptions.visualScale ?? 1.0;
      const targetPixelRadius = Math.min(rect.width, rect.height) * 0.32 * visualScale;
      const scaleMultiplier = targetPixelRadius / (R || 1);

      // Attempt raycast from screen to sphere
      let targetPoint = raycastScreenToSphere(
        x,
        y,
        R,
        state.sphere.center,
        camera,
        rect.width,
        rect.height,
        scaleMultiplier
      );

      // If ray misses sphere, fall back to rotating existing spherical coordinates by mouse delta
      if (targetPoint) {
        // Enforce strict mathematical normalization to sphere surface
        const currentCoord = cartesianToSpherical(state.sphere, targetPoint);
        const snappedPoint = sphericalToCartesian(state.sphere, currentCoord);
        onUpdateVertex(vId, snappedPoint);
      } else {
        // Horizon fallback: perturb longitude and latitude proportionally
        try {
          const oldCoord = cartesianToSpherical(state.sphere, state.vertices[vId]);
          const newLambda = (oldCoord.lambda + dx * 0.01 + Math.PI * 2) % (Math.PI * 2);
          const newPhi = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, oldCoord.phi - dy * 0.01));
          const newPoint = sphericalToCartesian(state.sphere, { phi: newPhi, lambda: newLambda });
          onUpdateVertex(vId, newPoint);
        } catch {
          // Ignore fallback error
        }
      }
      return;
    }

    // 2. Camera Orbit Dragging
    if (isDraggingCameraRef.current) {
      setCamera((prev) => {
        const newAzimuth = (prev.azimuth - dx * 0.008 + Math.PI * 2) % (Math.PI * 2);
        // Clamp elevation to avoid pole flipping
        const newElevation = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, prev.elevation + dy * 0.008));
        return {
          ...prev,
          azimuth: newAzimuth,
          elevation: newElevation,
        };
      });
      return;
    }

    // 3. Hover detection when not dragging
    const hovered = findVertexAtScreen(x, y);
    if (hovered !== hoveredVertexId) {
      setHoveredVertexId(hovered);
    }
  };

  const handleMouseUp = () => {
    isDraggingCameraRef.current = false;
    isDraggingVertexRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.4;
    setCamera((prev) => ({
      ...prev,
      distance: Math.max(180, Math.min(800, prev.distance + zoomDelta)),
    }));
  };

  // Camera Presets
  const resetCamera = () => setCamera(INITIAL_CAMERA);
  const setTopView = () => setCamera(prev => ({ ...prev, azimuth: 0, elevation: Math.PI / 2 - 0.05 }));
  const setFrontView = () => setCamera(prev => ({ ...prev, azimuth: 0, elevation: 0 }));
  const setIsometricView = () => setCamera(prev => ({ ...prev, azimuth: Math.PI / 4, elevation: Math.PI / 6 }));

  return (
    <div 
      id="geometry-viewport-container" 
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
    >
      {/* 3D Canvas */}
      <canvas
        id="geometry-3d-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left: Informational Header Badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
          <CircleDot className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Сфера S²(O, R = {state.sphere.radius.toFixed(2)})
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-semibold text-amber-400">
            Тетраэдр ABCD
          </span>
        </div>

        {/* Selected vertex tag */}
        {selectedElement?.type === 'VERTEX' && (
          <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/50 px-3 py-1 rounded-md text-xs text-amber-200">
            Активная вершина: <strong className="text-amber-400 font-bold">{selectedElement.id}</strong> (перемещайте курсором или ползунками)
          </div>
        )}
      </div>

      {/* Top Right: Viewport Display Toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg">
        <button
          id="toggle-vertex-guides-btn"
          title={renderOptions.showVertexGuides ? 'Скрыть координатные направляющие вершин' : 'Показать координатные направляющие (параллели и меридианы вершин)'}
          onClick={() => setRenderOptions(o => ({ ...o, showVertexGuides: !o.showVertexGuides }))}
          className={`p-1.5 rounded text-xs transition-colors ${
            renderOptions.showVertexGuides ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        {renderOptions.showVertexGuides && (
          <button
            id="toggle-all-guides-btn"
            title={renderOptions.showAllVertexGuides ? 'Показывать направляющие только для активной вершины' : 'Показывать сетку для всех 4 вершин (A, B, C, D)'}
            onClick={() => setRenderOptions(o => ({ ...o, showAllVertexGuides: !o.showAllVertexGuides }))}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              renderOptions.showAllVertexGuides ? 'bg-slate-800 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {renderOptions.showAllVertexGuides ? 'Все' : 'Активная'}
          </button>
        )}

        <div className="h-4 w-[1px] bg-slate-800" />

        <button
          id="toggle-grid-btn"
          title="Сетка сферы (меридианы и параллели)"
          onClick={() => setRenderOptions(o => ({ ...o, showGrid: !o.showGrid }))}
          className={`p-1.5 rounded text-xs transition-colors ${
            renderOptions.showGrid ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          id="toggle-faces-btn"
          title="Грани тетраэдра"
          onClick={() => setRenderOptions(o => ({ ...o, showFaces: !o.showFaces }))}
          className={`p-1.5 rounded text-xs transition-colors ${
            renderOptions.showFaces ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          id="toggle-labels-btn"
          title="Метки вершин (A, B, C, D)"
          onClick={() => setRenderOptions(o => ({ ...o, showLabels: !o.showLabels }))}
          className={`p-1.5 rounded text-xs transition-colors ${
            renderOptions.showLabels ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Left: Geometric Visual Scale Control Toolbar (M1.7) */}
      <div 
        id="scale-control-toolbar"
        className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-xl z-10"
      >
        <div className="flex items-center gap-1 px-1.5 text-xs text-slate-400 font-medium">
          <Scaling className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Масштаб:</span>
        </div>

        <button
          id="scale-fit-btn"
          onClick={() => {
            setRenderOptions(o => ({ ...o, visualScale: 1.0 }));
            resetCamera();
          }}
          title="Подогнать геометрию по размеру (100% + сброс камеры)"
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors flex items-center gap-1"
        >
          <Maximize className="w-3 h-3 text-sky-400" />
          <span>Fit</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700" />

        <button
          id="scale-100-btn"
          onClick={() => setRenderOptions(o => ({ ...o, visualScale: 1.0 }))}
          title="Установить масштаб геометрии 100%"
          className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
            (renderOptions.visualScale ?? 1.0) === 1.0
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          100%
        </button>

        <button
          id="scale-75-btn"
          onClick={() => setRenderOptions(o => ({ ...o, visualScale: 0.75 }))}
          title="Установить масштаб геометрии 75%"
          className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
            (renderOptions.visualScale ?? 1.0) === 0.75
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          75%
        </button>

        <button
          id="scale-50-btn"
          onClick={() => setRenderOptions(o => ({ ...o, visualScale: 0.5 }))}
          title="Установить масштаб геометрии 50%"
          className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
            (renderOptions.visualScale ?? 1.0) === 0.5
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          50%
        </button>
      </div>

      {/* Bottom Right: Camera Controls Toolbar */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-xl">
        <button
          id="camera-reset-btn"
          onClick={resetCamera}
          title="Сбросить положение камеры"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
        >
          <Rotate3d className="w-3.5 h-3.5 text-sky-400" />
          <span>Сброс</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700" />

        <button
          id="camera-preset-iso-btn"
          onClick={setIsometricView}
          title="Изометрия"
          className="px-2 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 transition-colors"
        >
          Изо
        </button>
        <button
          id="camera-preset-front-btn"
          onClick={setFrontView}
          title="Вид спереди"
          className="px-2 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 transition-colors"
        >
          Спереди
        </button>
        <button
          id="camera-preset-top-btn"
          onClick={setTopView}
          title="Вид сверху"
          className="px-2 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 transition-colors"
        >
          Сверху
        </button>

        <div className="h-4 w-[1px] bg-slate-700" />

        <button
          id="camera-zoom-in-btn"
          onClick={() => setCamera(c => ({ ...c, distance: Math.max(180, c.distance - 40) }))}
          title="Приблизить"
          className="p-1 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          id="camera-zoom-out-btn"
          onClick={() => setCamera(c => ({ ...c, distance: Math.min(800, c.distance + 40) }))}
          title="Отдалить"
          className="p-1 rounded hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Center: Interaction Hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none text-[11px] text-slate-500 text-center">
        Вращение: левая кнопка мыши | Масштаб: колёсико | Перемещение вершины: захват узла A/B/C/D
      </div>
    </div>
  );
};
