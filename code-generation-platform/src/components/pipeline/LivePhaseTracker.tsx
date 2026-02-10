/**
 * Live Phase Tracker Component
 * 
 * Shows real-time updates as the EGRR pipeline executes each phase.
 * Displays phase status, progress, and results in a beautiful animated UI.
 */

import React from 'react';
import { 
  Search, 
  Code2, 
  Play, 
  ClipboardCheck, 
  GitBranch,
  CheckCircle2,
  Loader2,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';

// Phase configuration
const PHASES = [
  { key: 'retrieval', name: 'Retrieval', icon: Search, color: 'blue' },
  { key: 'generation', name: 'Generation', icon: Code2, color: 'purple' },
  { key: 'execution', name: 'Execution', icon: Play, color: 'green' },
  { key: 'review', name: 'Review', icon: ClipboardCheck, color: 'yellow' },
  { key: 'decision', name: 'Decision', icon: GitBranch, color: 'pink' },
] as const;

export interface PhaseStatus {
  status: 'pending' | 'running' | 'completed' | 'error';
  description?: string;
  result?: Record<string, unknown>;
  duration_ms?: number;
}

export interface IterationProgress {
  iteration: number;
  phases: Record<string, PhaseStatus>;
  decision?: string;
  completed: boolean;
  duration_ms?: number;
}

interface LivePhaseTrackerProps {
  currentIteration: number;
  maxIterations: number;
  iterations: IterationProgress[];
  currentPhase: string | null;
  pipelineStatus: 'idle' | 'running' | 'completed' | 'error';
  elapsedTime: number;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function PhaseIndicator({ 
  phase, 
  status, 
  isActive,
  result,
  duration
}: { 
  phase: typeof PHASES[number];
  status: PhaseStatus['status'];
  isActive: boolean;
  result?: Record<string, unknown>;
  duration?: number;
}) {
  const Icon = phase.icon;
  
  const colorClasses = {
    blue: {
      active: 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-blue-500/30',
      completed: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
      pending: 'bg-neutral-800/50 border-neutral-700 text-neutral-500',
      error: 'bg-red-500/10 border-red-500/50 text-red-400',
    },
    purple: {
      active: 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-purple-500/30',
      completed: 'bg-purple-500/10 border-purple-500/50 text-purple-400',
      pending: 'bg-neutral-800/50 border-neutral-700 text-neutral-500',
      error: 'bg-red-500/10 border-red-500/50 text-red-400',
    },
    green: {
      active: 'bg-green-500/20 border-green-500 text-green-400 shadow-green-500/30',
      completed: 'bg-green-500/10 border-green-500/50 text-green-400',
      pending: 'bg-neutral-800/50 border-neutral-700 text-neutral-500',
      error: 'bg-red-500/10 border-red-500/50 text-red-400',
    },
    yellow: {
      active: 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-yellow-500/30',
      completed: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
      pending: 'bg-neutral-800/50 border-neutral-700 text-neutral-500',
      error: 'bg-red-500/10 border-red-500/50 text-red-400',
    },
    pink: {
      active: 'bg-pink-500/20 border-pink-500 text-pink-400 shadow-pink-500/30',
      completed: 'bg-pink-500/10 border-pink-500/50 text-pink-400',
      pending: 'bg-neutral-800/50 border-neutral-700 text-neutral-500',
      error: 'bg-red-500/10 border-red-500/50 text-red-400',
    },
  };

  const getColorClass = () => {
    if (status === 'error') return colorClasses[phase.color].error;
    if (isActive && status === 'running') return colorClasses[phase.color].active;
    if (status === 'completed') return colorClasses[phase.color].completed;
    return colorClasses[phase.color].pending;
  };

  const renderStatusIcon = () => {
    if (status === 'running') return <Loader2 size={12} className="animate-spin" />;
    if (status === 'completed') return <CheckCircle2 size={12} />;
    if (status === 'error') return <XCircle size={12} />;
    return <Clock size={12} />;
  };

  return (
    <div className={`
      relative flex flex-col items-center p-3 rounded-lg border transition-all duration-300
      ${getColorClass()}
      ${isActive && status === 'running' ? 'shadow-lg scale-105' : ''}
    `}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} />
        <span className="text-xs font-medium">{phase.name}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] opacity-75">
        {renderStatusIcon()}
        {duration ? formatDuration(duration) : status}
      </div>
      {result && status === 'completed' && (
        <div className="mt-2 text-[9px] opacity-60 max-w-[100px] truncate">
          {phase.key === 'retrieval' && `${result.documents_retrieved} docs`}
          {phase.key === 'generation' && `${result.code_length} chars`}
          {phase.key === 'execution' && `${result.tests_passed}/${(result.tests_passed as number) + (result.tests_failed as number)} tests`}
          {phase.key === 'review' && `${Math.round((result.quality_score as number) * 100)}% quality`}
          {phase.key === 'decision' && String(result.decision)}
        </div>
      )}
    </div>
  );
}

function IterationCard({ iteration, isActive }: { iteration: IterationProgress; isActive: boolean }) {
  return (
    <div className={`
      rounded-xl border p-4 transition-all duration-300
      ${isActive 
        ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 border-blue-500/30 shadow-lg' 
        : 'bg-neutral-800/30 border-neutral-700/50'
      }
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${isActive 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
              : iteration.completed 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-neutral-700 text-neutral-400'
            }
          `}>
            {iteration.iteration}
          </div>
          <div>
            <span className="text-sm font-medium text-white">Iteration {iteration.iteration}</span>
            {iteration.duration_ms && (
              <span className="text-xs text-neutral-500 ml-2">
                {formatDuration(iteration.duration_ms)}
              </span>
            )}
          </div>
        </div>
        {iteration.decision && (
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${iteration.decision === 'TERMINATE_SUCCESS' 
              ? 'bg-green-500/20 text-green-400' 
              : iteration.decision === 'CONTINUE' 
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }
          `}>
            {iteration.decision.replace('TERMINATE_', '').replace('_', ' ')}
          </div>
        )}
      </div>
      
      {/* Phase Progress */}
      <div className="grid grid-cols-5 gap-2">
        {PHASES.map((phase) => {
          const phaseStatus = iteration.phases[phase.key] || { status: 'pending' as const };
          const isPhaseActive = isActive && phaseStatus.status === 'running';
          
          return (
            <PhaseIndicator
              key={phase.key}
              phase={phase}
              status={phaseStatus.status}
              isActive={isPhaseActive}
              result={phaseStatus.result}
              duration={phaseStatus.duration_ms}
            />
          );
        })}
      </div>
    </div>
  );
}

export function LivePhaseTracker({
  currentIteration,
  maxIterations,
  iterations,
  currentPhase,
  pipelineStatus,
  elapsedTime
}: LivePhaseTrackerProps) {
  if (pipelineStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
        <Play size={48} className="mb-4 opacity-30" />
        <p className="text-lg">Ready to run pipeline</p>
        <p className="text-sm mt-2">Click &quot;Run Pipeline&quot; to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg
            ${pipelineStatus === 'running' 
              ? 'bg-blue-500/20 text-blue-400' 
              : pipelineStatus === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }
          `}>
            {pipelineStatus === 'running' ? (
              <Loader2 size={20} className="animate-spin" />
            ) : pipelineStatus === 'completed' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {pipelineStatus === 'running' 
                ? `Running Iteration ${currentIteration}/${maxIterations}` 
                : pipelineStatus === 'completed'
                  ? 'Pipeline Complete'
                  : 'Pipeline Error'
              }
            </h3>
            {currentPhase && pipelineStatus === 'running' && (
              <p className="text-sm text-neutral-400">
                Current Phase: <span className="text-blue-400 capitalize">{currentPhase}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <Clock size={16} />
          <span className="font-mono text-sm">{formatDuration(elapsedTime)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ 
            width: `${(currentIteration / maxIterations) * 100}%`,
            opacity: pipelineStatus === 'running' ? 1 : 0.7
          }}
        />
        {pipelineStatus === 'running' && (
          <div 
            className="absolute inset-y-0 bg-white/20 animate-pulse"
            style={{ 
              left: `${((currentIteration - 1) / maxIterations) * 100}%`,
              width: `${(1 / maxIterations) * 100}%`
            }}
          />
        )}
      </div>

      {/* Iteration Cards */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {iterations.map((iteration) => (
          <IterationCard
            key={iteration.iteration}
            iteration={iteration}
            isActive={pipelineStatus === 'running' && iteration.iteration === currentIteration}
          />
        ))}
      </div>
    </div>
  );
}

export default LivePhaseTracker;
