/**
 * FEDOROV SYMMETRY STAND (FSS) — AGENT CONSOLE v0.1
 * Isolated AI Agent Gateway Workstation Component
 * 
 * Capabilities:
 * - Inspect Object Passport
 * - Run all 8 Gateway Commands (Presets + JSON Editor)
 * - Inspect Structured Responses & Mathematical Evidence Records
 * - Review Verification Verdicts (VERIFIED / REFUTED / INVALID_INPUT / UNSUPPORTED_OPERATION)
 * - Review Receiver-Owned Tolerances and Residuals
 * - Re-run Saved Experiments from the Ledger
 * - Optional explicit load of experiment state into human workstation viewport
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Sliders,
  Send,
  History,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Copy,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  CanonicalGeometryState,
  RepresentationState,
  GeometryValidationResult,
  VertexId,
  Point3D,
} from '../core/types';
import {
  createAgentGateway,
  AgentGateway,
} from '../core/agentGateway';
import {
  AgentGatewayCommand,
  AgentGatewayResponse,
  ExperimentLedgerEntry,
  EvidenceRecord,
  ObjectPassport,
  SymmetryPassport,
} from '../core/gatewayTypes';
import { createPoint3D } from '../core/geometryState';

interface AgentConsoleProps {
  canonical: CanonicalGeometryState;
  representation: RepresentationState;
  validation: GeometryValidationResult;
  onApplyStateToHumanScene?: (vertices: Record<VertexId, Point3D>) => void;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  canonical,
  onApplyStateToHumanScene,
}) => {
  // Authoritative Gateway instance initialized with current canonical state
  const gateway: AgentGateway = useMemo(() => {
    return createAgentGateway(canonical, 'FSS-POLYHEDRON-TETRA-001');
  }, [canonical]);

  // Expose to window for external scripting or devtools automation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__fssAgentGateway = gateway;
    }
  }, [gateway]);

  // UI state
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM_JSON' | 'PASSPORT' | 'LEDGER'>('PRESETS');
  const [lastResponse, setLastResponse] = useState<AgentGatewayResponse | null>(null);
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<ExperimentLedgerEntry | null>(null);
  const [passportData, setPassportData] = useState<ObjectPassport | null>(null);
  const [symmetryPassportData, setSymmetryPassportData] = useState<SymmetryPassport | null>(null);
  const [loadingSymmetry, setLoadingSymmetry] = useState(false);
  const [jsonInput, setJsonInput] = useState<string>(() => JSON.stringify({
    command: 'verify_claim',
    hypothesis: {
      predicate: 'IS_INVARIANT_UNDER_OPERATION',
      claimedValue: true,
      operationContext: {
        type: 'AXIS_ROTATION',
        axis: { x: 0, y: 0, z: 1 },
        angleDegrees: 120
      }
    }
  }, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load passport on mount
  useEffect(() => {
    const res = gateway.executeCommand({ command: 'inspect_passport' });
    if (res.success && res.data) {
      setPassportData(res.data);
    }
    const symRes = gateway.executeCommand({ command: 'inspect_symmetry_passport', evaluateFullGroup: true });
    if (symRes.success && symRes.data) {
      setSymmetryPassportData(symRes.data);
    }
  }, [gateway]);

  const loadSymmetryPassport = (fullGroup: boolean) => {
    setLoadingSymmetry(true);
    try {
      const res = gateway.executeCommand({
        command: 'inspect_symmetry_passport',
        evaluateFullGroup: fullGroup,
        evaluateGenerators: !fullGroup,
      });
      if (res.success && res.data) {
        setSymmetryPassportData(res.data);
        setLastResponse(res);
      }
    } finally {
      setLoadingSymmetry(false);
    }
  };

  // Runner helper
  const runCommand = (cmd: AgentGatewayCommand) => {
    const res = gateway.executeCommand(cmd);
    setLastResponse(res);
    if (res.evidence) {
      const ledger = gateway.getLedger();
      const last = ledger[ledger.length - 1];
      if (last) {
        setSelectedLedgerEntry(last);
      }
    }
  };

  const handleRunJson = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      runCommand(parsed);
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleCopyResponse = () => {
    if (lastResponse) {
      navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const ledger = gateway.getLedger();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col space-y-0 text-slate-200">
      {/* Header Bar */}
      <div className="bg-slate-950/80 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 tracking-wide">
                FSS Agent Gateway v0.1
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE GATEWAY
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Детерминированный входной шлюз AI-агента к геометрическому ядру
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'PRESETS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Команды MVP
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM_JSON')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'CUSTOM_JSON' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON Консоль
          </button>
          <button
            onClick={() => setActiveTab('PASSPORT')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'PASSPORT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Паспорт PGO-3D
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
              activeTab === 'LEDGER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Журнал ({ledger.length})</span>
          </button>
        </div>
      </div>

      {/* SSOT & Boundary Invariant Banner */}
      <div className="px-3.5 py-1.5 bg-indigo-950/30 border-b border-indigo-900/40 text-[10px] text-indigo-300 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            <strong>Граница верификации:</strong> Допуск задаётся оракулом стенда (Receiver-owned). Исходная сцена человека изолирована.
          </span>
        </div>
        <span className="font-mono text-[9px] text-indigo-400/80">
          OBJECT ≠ STATE ≠ CLAIM ≠ EVIDENCE
        </span>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-3">
        {/* TAB 1: PRESETS */}
        {activeTab === 'PRESETS' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Preset 1: Inspect Passport */}
              <button
                onClick={() => runCommand({ command: 'inspect_passport' })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    1. inspect_passport
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Паспорт объекта, топология, группы симметрии
                  </div>
                </div>
                <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 2: Get Canonical Snapshot */}
              <button
                onClick={() => runCommand({ command: 'get_canonical_snapshot' })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    2. get_canonical_snapshot
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Неизменяемый снимок канонического ядра ℝ³
                  </div>
                </div>
                <Sliders className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 3: Apply C_3 (120°) Rotation -> INVARIANT */}
              <button
                onClick={() => runCommand({
                  command: 'apply_symmetry_operation',
                  operation: {
                    type: 'AXIS_ROTATION',
                    axis: createPoint3D(0, 0, 1),
                    angleDegrees: 120,
                  }
                })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    3. Поворот C₃ (120° вокруг Z)
                  </div>
                  <div className="text-[10px] text-emerald-400/90">
                    Симметрия сохраняется (Инвариант T_d)
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 4: Apply Central Inversion -> BREAKING */}
              <button
                onClick={() => runCommand({
                  command: 'apply_symmetry_operation',
                  operation: {
                    type: 'CENTRAL_INVERSION',
                    center: createPoint3D(0, 0, 0),
                  }
                })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    4. Центральная инверсия i
                  </div>
                  <div className="text-[10px] text-amber-400/90">
                    Тетраэдр не инвариантен относительно центра
                  </div>
                </div>
                <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 5: Verify Hypothesis C_3 Invariance */}
              <button
                onClick={() => runCommand({
                  command: 'verify_claim',
                  hypothesis: {
                    predicate: 'IS_INVARIANT_UNDER_OPERATION',
                    claimedValue: true,
                    justification: 'Agent asserts C3 (120°) leaves regular tetrahedron invariant',
                    operationContext: {
                      type: 'AXIS_ROTATION',
                      axis: createPoint3D(0, 0, 1),
                      angleDegrees: 120,
                    }
                  }
                })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    5. Верификация гипотезы C₃
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Оракул подтверждает вердикт VERIFIED
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 6: Perturb Vertex & Verify (Symmetry Breaking) */}
              <button
                onClick={() => {
                  const perturbRes = gateway.executeCommand({
                    command: 'perturb_geometry',
                    vertexId: 'A',
                    offset: createPoint3D(0.15, 0, 0),
                  });
                  if (perturbRes.success && perturbRes.data?.resultingStateId) {
                    runCommand({
                      command: 'verify_claim',
                      targetStateId: perturbRes.data.resultingStateId,
                      hypothesis: {
                        predicate: 'IS_INVARIANT_UNDER_OPERATION',
                        claimedValue: true,
                        justification: 'Agent asserts perturbed state retains C3 rotation symmetry',
                        operationContext: {
                          type: 'AXIS_ROTATION',
                          axis: createPoint3D(0, 0, 1),
                          angleDegrees: 120,
                        }
                      }
                    });
                  }
                }}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300">
                    6. Эксперимент: Срыв симметрии
                  </div>
                  <div className="text-[10px] text-rose-400/90">
                    Возмущение вершины A → вердикт REFUTED
                  </div>
                </div>
                <XCircle className="w-4 h-4 text-rose-500 group-hover:text-rose-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 7: Construct Canonical Regular Tetrahedron */}
              <button
                onClick={() => runCommand({
                  command: 'construct_object',
                  constructionType: 'REGULAR_TETRAHEDRON',
                  params: { radius: 1.0, center: createPoint3D(0, 0, 0) }
                })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    7. construct_object (Регулярный)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Построение идеального тетраэдра R=1
                  </div>
                </div>
                <Play className="w-4 h-4 text-indigo-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 8: Query Metric Signed Volume */}
              <button
                onClick={() => runCommand({
                  command: 'query_metric',
                  metricName: 'signedVolume'
                })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition flex items-start justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                    8. query_metric (Объём V)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Детерминированный опрос знакового объёма
                  </div>
                </div>
                <Sliders className="w-4 h-4 text-indigo-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
              </button>

              {/* Preset 9: Inspect Symmetry Passport (Full Group T_d) */}
              <button
                onClick={() => runCommand({
                  command: 'inspect_symmetry_passport',
                  evaluateFullGroup: true,
                })}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition flex items-start justify-between group col-span-1 sm:col-span-2"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                    9. inspect_symmetry_passport (Полная группа T_d)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Верификация 24 изометрий точечной группы, центра инверсии и статуса Федорова
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM JSON CONSOLE */}
        {activeTab === 'CUSTOM_JSON' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Введите структурированную команду агента (дискриминированное объединение):</span>
              <button
                onClick={() => setJsonInput(JSON.stringify({
                  command: 'verify_claim',
                  hypothesis: {
                    predicate: 'IS_INVARIANT_UNDER_OPERATION',
                    claimedValue: true,
                    operationContext: {
                      type: 'AXIS_ROTATION',
                      axis: { x: 0, y: 0, z: 1 },
                      angleDegrees: 120
                    }
                  }
                }, null, 2))}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] underline"
              >
                Вставить шаблон
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-32 bg-slate-950 font-mono text-xs text-emerald-400 p-2.5 rounded-lg border border-slate-800 focus:border-indigo-500 focus:outline-none"
              spellCheck={false}
            />
            {jsonError && (
              <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800 p-2 rounded">
                {jsonError}
              </div>
            )}
            <button
              onClick={handleRunJson}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Выполнить команду через Agent Gateway</span>
            </button>
          </div>
        )}

        {/* TAB 3: OBJECT & SYMMETRY PASSPORTS */}
        {activeTab === 'PASSPORT' && (
          <div className="space-y-3">
            {/* 1. Object Passport (PGO-3D) */}
            {passportData && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-bold text-slate-100">{passportData.name}</span>
                    <span className="text-[10px] text-slate-400 block">Паспорт объекта (PGO-3D: Identity & Schema)</span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                    {passportData.objectId}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Топология:</span>{' '}
                    <span className="font-mono text-slate-200">
                      {passportData.topology.vertexLabels.length}V / {passportData.topology.edgeCount}E / {passportData.topology.faceCount}F (χ = {passportData.topology.eulerCharacteristic})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Макс. группа:</span>{' '}
                    <span className="font-mono text-amber-300">
                      {passportData.symmetryProfile.theoreticalMaxPointGroup}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span>Типичные генераторы:</span>
                  <ul className="list-disc list-inside mt-0.5 font-mono text-[10px] text-slate-300">
                    {passportData.symmetryProfile.typicalGenerators.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Активная сигнатура: {passportData.activeStateSignature}
                </div>
              </div>
            )}

            {/* 2. State-Specific Symmetry Passport (PSS-3D) */}
            {symmetryPassportData && (
              <div className="bg-slate-950 p-3 rounded-lg border border-amber-900/40 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-bold text-amber-300">Паспорт симметрии состояния (PSS-3D)</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      State: {symmetryPassportData.stateSignature.slice(0, 16)}...
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    symmetryPassportData.classificationStatus === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : symmetryPassportData.classificationStatus === 'PARTIALLY_VERIFIED'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}>
                    {symmetryPassportData.classificationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Шёнфлис:</span>
                    <span className="text-amber-300 font-bold">{symmetryPassportData.pointGroup.schoenflies}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Сингония:</span>
                    <span className="text-sky-300">{symmetryPassportData.pointGroup.system}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Порядок группы:</span>
                    <span className="text-emerald-300">{symmetryPassportData.pointGroup.order ?? '—'}</span>
                  </div>
                </div>

                <div className="text-[11px] flex items-center justify-between bg-slate-900/40 p-2 rounded border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Центр инверсии i:</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      symmetryPassportData.inversionCenter.exists
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950/60 text-rose-300 border-rose-800'
                    }`}>
                      {symmetryPassportData.inversionCenter.exists ? 'СУЩЕСТВУЕТ (VERIFIED)' : 'ОТСУТСТВУЕТ (REFUTED)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Полнота: {symmetryPassportData.pointGroup.completeness}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    Проверено операций: {symmetryPassportData.testedOperationsCount}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => loadSymmetryPassport(false)}
                      disabled={loadingSymmetry}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-750 transition"
                    >
                      Генераторы
                    </button>
                    <button
                      onClick={() => loadSymmetryPassport(true)}
                      disabled={loadingSymmetry}
                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium transition"
                    >
                      Полная группа (24 оп.)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXPERIMENT LEDGER */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {ledger.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                Журнал экспериментов пуст. Запустите любую команду или гипотезу.
              </div>
            ) : (
              ledger.map((entry) => (
                <div
                  key={entry.experimentId}
                  onClick={() => setSelectedLedgerEntry(entry)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedLedgerEntry?.experimentId === entry.experimentId
                      ? 'bg-slate-800 border-indigo-500 text-slate-100'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entry.verdict === 'VERIFIED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-mono text-[11px] font-semibold">{entry.commandName}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {entry.evidence.predicate}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    entry.verdict === 'VERIFIED'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800'
                  }`}>
                    {entry.verdict}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* EVIDENCE RECORD / LAST RESPONSE INSPECTOR */}
        {lastResponse && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Результат выполнения: {lastResponse.command}
                </span>
                {lastResponse.evidence && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    lastResponse.evidence.verdict === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    {lastResponse.evidence.verdict}
                  </span>
                )}
              </div>
              <button
                onClick={handleCopyResponse}
                className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 transition"
                title="Копировать JSON"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Скопировано!' : 'JSON'}</span>
              </button>
            </div>

            {/* If Evidence Record is present, show structured evidence card */}
            {lastResponse.evidence ? (
              <div className="space-y-1.5 text-xs">
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                  {lastResponse.evidence.explanation}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-850">
                    <span className="text-slate-500 block">Невязка (Residual):</span>
                    <span className="text-amber-300 text-xs">
                      {lastResponse.evidence.mathematicalEvidence.residual !== undefined
                        ? lastResponse.evidence.mathematicalEvidence.residual.toExponential(4)
                        : '0'}
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-850">
                    <span className="text-slate-500 block">Допуск оракула (ε):</span>
                    <span className="text-sky-300 text-xs">
                      {lastResponse.evidence.receiverTolerancePolicy.appliedEpsilon.toExponential(3)}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Правило допуска: {lastResponse.evidence.receiverTolerancePolicy.rule}
                </div>
              </div>
            ) : (
              <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-2 rounded overflow-x-auto max-h-40">
                {JSON.stringify(lastResponse.data ?? lastResponse.error, null, 2)}
              </pre>
            )}

            {/* Optional explicit action to load resulting state into human workstation viewport */}
            {lastResponse.data?.resultingStateId && onApplyStateToHumanScene && (
              <div className="pt-1 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Результирующее состояние эксперимента изолировано в памяти шлюза.
                </span>
                <button
                  onClick={() => {
                    const st = gateway.getState(lastResponse.data.resultingStateId);
                    if (st) {
                      onApplyStateToHumanScene(st.vertices);
                    }
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[10px] font-medium border border-slate-700 flex items-center gap-1 transition"
                >
                  <Eye className="w-3 h-3" />
                  <span>Показать в 3D сцене</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
