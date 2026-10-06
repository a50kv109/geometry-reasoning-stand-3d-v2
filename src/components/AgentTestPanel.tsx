import React, { useState } from 'react';
import { Bot, CheckCircle2, XCircle, Play, ShieldAlert, Cpu } from 'lucide-react';
import { CanonicalGeometryState, RepresentationState, GeometryValidationResult, AgentClaim, AgentVerificationReport } from '../core/types';
import { createStandOracle } from '../core/agentInterface';
import { runSampleAgentSession } from '../core/agentSimulation';

interface AgentTestPanelProps {
  canonical: CanonicalGeometryState;
  representation: RepresentationState;
  validation: GeometryValidationResult;
}

export const AgentTestPanel: React.FC<AgentTestPanelProps> = ({
  canonical,
  representation,
  validation,
}) => {
  const [reports, setReports] = useState<readonly AgentVerificationReport[]>([]);
  const [customClaimType, setCustomClaimType] = useState<AgentClaim['type']>('EDGE_LENGTH');
  const [customTarget, setCustomTarget] = useState('AB');
  const [customValue, setCustomValue] = useState('1.632993');

  const oracle = createStandOracle(canonical, representation, validation);

  const handleRunSimulation = () => {
    const session = runSampleAgentSession(canonical);
    setReports(session.results);
  };

  const handleVerifyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedVal: number | boolean | string = customValue;
    if (customClaimType === 'IS_REGULAR' || customClaimType === 'IS_DEGENERATE' || customClaimType === 'POINT_ON_SPHERE') {
      parsedVal = customValue.toLowerCase() === 'true';
    } else if (customClaimType === 'EDGE_LENGTH' || customClaimType === 'FACE_AREA' || customClaimType === 'VOLUME') {
      parsedVal = parseFloat(customValue) || 0;
    }

    const claim: AgentClaim = {
      claimId: `custom-${Date.now()}`,
      type: customClaimType,
      target: customTarget.toUpperCase(),
      claimedValue: parsedVal,
      justification: 'Interactive user-submitted agent hypothesis'
    };

    const report = oracle.verifyClaim(claim);
    setReports(prev => [report, ...prev]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">Agent Boundary & Oracle Verification</h3>
        </div>
        <button
          onClick={handleRunSimulation}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Run Simulation Smoke</span>
        </button>
      </div>

      <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded border border-slate-800/80">
        <span className="font-semibold text-indigo-300">Architectural SSOT Invariant:</span> "Agent may be wrong. Stand must not." Claims are treated as untrusted hypotheses and strictly verified against canonical state.
      </div>

      <form onSubmit={handleVerifyCustom} className="grid grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded border border-slate-800">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Claim Type</label>
          <select
            value={customClaimType}
            onChange={(e) => setCustomClaimType(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
          >
            <option value="EDGE_LENGTH">Edge Length</option>
            <option value="FACE_AREA">Face Area</option>
            <option value="VOLUME">Signed Volume</option>
            <option value="IS_REGULAR">Is Regular</option>
            <option value="IS_DEGENERATE">Is Degenerate</option>
            <option value="ORIENTATION">Orientation</option>
            <option value="POINT_ON_SPHERE">Point on Sphere</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Target</label>
          <input
            type="text"
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
            placeholder="AB, ABC, ABCD, A"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Claimed Value</label>
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
            placeholder="e.g. 1.632993 or true"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 rounded px-2 py-1 text-xs font-medium transition"
          >
            Test Hypothesis
          </button>
        </div>
      </form>

      {reports.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <h4 className="text-xs font-medium text-slate-400">Verification Ledger ({reports.length})</h4>
          {reports.map((report) => (
            <div
              key={report.claimId}
              className={`p-2.5 rounded border text-xs flex items-start space-x-2.5 ${
                report.verified
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
              }`}
            >
              {report.verified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 overflow-hidden w-full">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>
                    [{report.type}] {report.target}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      report.verified ? 'bg-emerald-900/60 text-emerald-200' : 'bg-rose-900/60 text-rose-200'
                    }`}
                  >
                    {report.epistemicVerdict}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Claimed: <span className="font-mono text-slate-200">{String(report.claimedValue)}</span> | Ground Truth: <span className="font-mono text-slate-200">{typeof report.groundTruthValue === 'number' ? report.groundTruthValue.toFixed(6) : String(report.groundTruthValue)}</span>
                </div>
                <div className="text-[10px] text-slate-400">{report.explanation}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
