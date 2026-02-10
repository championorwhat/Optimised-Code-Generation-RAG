/**
 * IterationTimeline Component
 * 
 * Displays a visual timeline of all iterations in the EGRR pipeline,
 * showing the progression through phases and key metrics for each iteration.
 */

'use client';

import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Search,
  Code,
  Play,
  FileSearch,
  GitBranch,
  AlertTriangle
} from 'lucide-react';
import { IterationDetail, EGRRPhase } from '@/types';
import { formatDuration, getStatusBadgeVariant } from '@/services/egrr';
import { Badge } from '@/components/common/Badge';

interface IterationTimelineProps {
  iterations: IterationDetail[];
  currentIteration?: number;
  isRunning?: boolean;
}

const PHASE_ORDER: EGRRPhase[] = ['retrieval', 'generation', 'execution', 'review', 'decision'];

const PHASE_ICONS: Record<EGRRPhase, React.ReactNode> = {
  retrieval: <Search size={16} />,
  generation: <Code size={16} />,
  execution: <Play size={16} />,
  review: <FileSearch size={16} />,
  decision: <GitBranch size={16} />,
};

// Phase descriptions for tooltips
// Retrieval: Searching code patterns from corpus
// Generation: Generating code using LLM
// Execution: Running tests in sandbox
// Review: Analyzing code quality
// Decision: Determining next action

export function IterationTimeline({ iterations, currentIteration, isRunning }: IterationTimelineProps) {
  const [expandedIterations, setExpandedIterations] = useState<Set<number>>(
    new Set(iterations.length > 0 ? [iterations.length] : []) // Expand last iteration by default
  );

  const toggleIteration = (iterNum: number) => {
    setExpandedIterations((prev) => {
      const next = new Set(prev);
      if (next.has(iterNum)) {
        next.delete(iterNum);
      } else {
        next.add(iterNum);
      }
      return next;
    });
  };

  const getIterationStatusIcon = (iteration: IterationDetail) => {
    if (iteration.decision === 'TERMINATE_SUCCESS') {
      return <CheckCircle className="text-green-400" size={20} />;
    } else if (iteration.decision === 'TERMINATE_MAX_ITERATIONS') {
      return <AlertTriangle className="text-yellow-400" size={20} />;
    } else if (iteration.decision === 'CONTINUE') {
      return <Clock className="text-blue-400" size={20} />;
    }
    return <Clock className="text-neutral-400" size={20} />;
  };

  const getIterationSummary = (iteration: IterationDetail): string => {
    const { tests_passed, tests_failed, coverage, critical_issues } = iteration;
    const parts: string[] = [];
    
    if (tests_passed + tests_failed > 0) {
      parts.push(`${tests_passed}/${tests_passed + tests_failed} tests`);
    }
    if (coverage > 0) {
      parts.push(`${(coverage * 100).toFixed(0)}% coverage`);
    }
    if (critical_issues.length > 0) {
      parts.push(`${critical_issues.length} issues`);
    }
    
    return parts.join(' • ') || 'Processing...';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Pipeline Iterations</h3>
        <span className="text-sm text-neutral-400">
          {iterations.length} iteration{iterations.length !== 1 ? 's' : ''}
          {isRunning && (
            <span className="ml-2 text-blue-400 animate-pulse">• Running...</span>
          )}
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-700" />

        {iterations.map((iteration, index) => {
          const isExpanded = expandedIterations.has(iteration.iteration_number);
          const isLast = index === iterations.length - 1;
          const isCurrent = isRunning && iteration.iteration_number === currentIteration;

          return (
            <div key={iteration.iteration_number} className="relative pb-6 last:pb-0">
              {/* Timeline dot */}
              <div className={`absolute left-3 w-4 h-4 rounded-full border-2 z-10 
                ${isCurrent ? 'bg-blue-500 border-blue-400 animate-pulse' : 
                  isLast && !isRunning ? 'bg-green-500 border-green-400' : 
                  'bg-neutral-800 border-neutral-600'}`} 
              />

              {/* Iteration card */}
              <div className="ml-12">
                <div 
                  className={`bg-neutral-800 rounded-lg border transition-all cursor-pointer
                    ${isCurrent ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 
                      isLast && !isRunning ? 'border-green-500/30' : 'border-neutral-700'}
                    hover:border-neutral-600`}
                  onClick={() => toggleIteration(iteration.iteration_number)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {getIterationStatusIcon(iteration)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            Iteration {iteration.iteration_number}
                          </span>
                          {iteration.decision && (
                            <Badge 
                              label={iteration.decision.replace('TERMINATE_', '').replace('_', ' ')}
                              variant={getStatusBadgeVariant(iteration.decision)}
                              size="sm"
                            />
                          )}
                        </div>
                        <p className="text-sm text-neutral-400">
                          {getIterationSummary(iteration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-neutral-500">
                        {formatDuration(iteration.duration_ms)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-neutral-400" />
                      ) : (
                        <ChevronRight size={18} className="text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-neutral-700 p-4 space-y-4">
                      {/* Phase cards */}
                      <div className="grid grid-cols-5 gap-2">
                        {PHASE_ORDER.map((phase) => {
                          const phaseResult = iteration.phase_results[phase];
                          const hasData = phaseResult && Object.keys(phaseResult).length > 0;
                          
                          return (
                            <div 
                              key={phase}
                              className={`p-3 rounded-lg border text-center
                                ${hasData ? 'bg-neutral-700/50 border-neutral-600' : 'bg-neutral-800/50 border-neutral-700/50 opacity-50'}`}
                            >
                              <div className="flex justify-center mb-2 text-neutral-300">
                                {PHASE_ICONS[phase]}
                              </div>
                              <div className="text-xs font-medium text-neutral-300 capitalize">
                                {phase}
                              </div>
                              {hasData && phaseResult?.duration_ms && (
                                <div className="text-xs text-neutral-500 mt-1">
                                  {formatDuration(phaseResult.duration_ms)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Retrieval */}
                        {iteration.phase_results.retrieval && (
                          <div className="bg-neutral-900/50 rounded-lg p-3">
                            <div className="text-xs text-neutral-500 mb-1">Retrieved Patterns</div>
                            <div className="text-lg font-semibold text-white">
                              {iteration.phase_results.retrieval.documents_retrieved}
                            </div>
                          </div>
                        )}

                        {/* Execution */}
                        <div className="bg-neutral-900/50 rounded-lg p-3">
                          <div className="text-xs text-neutral-500 mb-1">Tests</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-green-400">
                              {iteration.tests_passed}
                            </span>
                            <span className="text-neutral-500">/</span>
                            <span className="text-lg font-semibold text-red-400">
                              {iteration.tests_failed}
                            </span>
                          </div>
                        </div>

                        {/* Coverage */}
                        <div className="bg-neutral-900/50 rounded-lg p-3">
                          <div className="text-xs text-neutral-500 mb-1">Coverage</div>
                          <div className={`text-lg font-semibold ${
                            iteration.coverage >= 0.8 ? 'text-green-400' :
                            iteration.coverage >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {(iteration.coverage * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Quality Score */}
                        {iteration.phase_results.review && (
                          <div className="bg-neutral-900/50 rounded-lg p-3">
                            <div className="text-xs text-neutral-500 mb-1">Quality Score</div>
                            <div className={`text-lg font-semibold ${
                              iteration.phase_results.review.quality_score >= 0.8 ? 'text-green-400' :
                              iteration.phase_results.review.quality_score >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {(iteration.phase_results.review.quality_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Critical Issues */}
                      {iteration.critical_issues.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-400 mb-2">
                            <XCircle size={16} />
                            <span className="text-sm font-medium">Critical Issues</span>
                          </div>
                          <ul className="space-y-1">
                            {iteration.critical_issues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-red-300">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Decision rationale */}
                      {iteration.phase_results.decision?.rationale && (
                        <div className="bg-neutral-900/50 rounded-lg p-3">
                          <div className="text-xs text-neutral-500 mb-1">Decision Rationale</div>
                          <p className="text-sm text-neutral-300">
                            {iteration.phase_results.decision.rationale}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Running indicator */}
        {isRunning && (
          <div className="relative pb-6">
            <div className="absolute left-3 w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-400 z-10 animate-pulse" />
            <div className="ml-12 bg-neutral-800/50 rounded-lg border border-blue-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent" />
                <span className="text-blue-400">Processing iteration {(currentIteration || 0) + 1}...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IterationTimeline;
