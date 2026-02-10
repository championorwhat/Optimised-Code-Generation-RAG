/**
 * EGRR Pipeline Run Page
 * 
 * Main page for running the EGRR (Execution-Grounded Retrieval Refinement) pipeline.
 * Features:
 * - Query input
 * - Real-time iteration visualization
 * - Final result display with code
 */

'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { IterationTimeline } from '@/components/pipeline/IterationTimeline';
import { PipelineResult } from '@/components/pipeline/PipelineResult';
import { egrrAPI } from '@/services/egrr';
import { EGRRRunState } from '@/types';
import { 
  PlayCircle, 
  Loader2, 
  Database,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const EXAMPLE_QUERIES = [
  "Write a function to validate email addresses using regex with proper error handling",
  "Create a binary search function that handles edge cases and returns the index",
  "Implement a function to safely parse JSON with error handling and default values",
  "Write a function to hash passwords securely using bcrypt with salt",
  "Create a retry decorator with exponential backoff for network requests",
];

export default function EGRRRunPage() {
  const [query, setQuery] = useState('');
  const [maxIterations, setMaxIterations] = useState(5);
  const [runState, setRunState] = useState<EGRRRunState>({
    status: 'idle',
    currentIteration: 0,
    currentPhase: null,
    result: null,
    error: null,
    startTime: null,
  });

  const handleRun = useCallback(async () => {
    if (!query.trim()) return;

    setRunState({
      status: 'running',
      currentIteration: 1,
      currentPhase: 'retrieval',
      result: null,
      error: null,
      startTime: new Date(),
    });

    try {
      const response = await egrrAPI.generate({
        query: query.trim(),
        language: 'python',
        max_iterations: maxIterations,
        use_rag: true,
      });

      setRunState({
        status: 'completed',
        currentIteration: response.iterations,
        currentPhase: null,
        result: response,
        error: null,
        startTime: runState.startTime,
      });
    } catch (error) {
      setRunState({
        status: 'error',
        currentIteration: 0,
        currentPhase: null,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
        startTime: null,
      });
    }
  }, [query, maxIterations, runState.startTime]);

  const handleReset = () => {
    setRunState({
      status: 'idle',
      currentIteration: 0,
      currentPhase: null,
      result: null,
      error: null,
      startTime: null,
    });
    setQuery('');
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar title="EGRR Pipeline" />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Error Alert */}
            {runState.error && (
              <Alert
                variant="error"
                title="Pipeline Error"
                message={runState.error}
                dismissible
                onDismiss={() => setRunState(prev => ({ ...prev, error: null }))}
              />
            )}

            {/* Success Alert */}
            {runState.status === 'completed' && runState.result?.status === 'success' && (
              <Alert
                variant="success"
                title="Pipeline Completed Successfully"
                message={`Generated working code in ${runState.result.iterations} iteration(s) with ${((runState.result.coverage || 0) * 100).toFixed(0)}% test coverage.`}
              />
            )}

            {/* Input Section */}
            {runState.status !== 'completed' && (
              <Card
                title="Code Generation Query"
                subtitle="Describe what you want the code to do"
              >
                <div className="space-y-4">
                  <div>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Example: Write a function to validate email addresses with proper error handling..."
                      className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={runState.status === 'running'}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-neutral-500">
                        {query.length} characters
                      </span>
                      <span className="text-xs text-neutral-500">
                        Language: Python (auto-detected)
                      </span>
                    </div>
                  </div>

                  {/* Example Queries */}
                  <div>
                    <p className="text-sm text-neutral-400 mb-2">Try an example:</p>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_QUERIES.slice(0, 3).map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExampleClick(example)}
                          className="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-colors"
                          disabled={runState.status === 'running'}
                        >
                          {example.slice(0, 50)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="flex items-center gap-6 pt-2 border-t border-neutral-700">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-neutral-400">Max Iterations:</label>
                      <select
                        value={maxIterations}
                        onChange={(e) => setMaxIterations(Number(e.target.value))}
                        className="bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-white text-sm"
                        disabled={runState.status === 'running'}
                      >
                        {[1, 2, 3, 4, 5, 7, 10].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Database size={14} />
                      <span>RAG Enabled</span>
                    </div>
                  </div>

                  {/* Run Button */}
                  <Button
                    onClick={handleRun}
                    disabled={!query.trim() || runState.status === 'running'}
                    isLoading={runState.status === 'running'}
                    loadingText="Running Pipeline..."
                    fullWidth
                    size="lg"
                    icon={runState.status === 'running' ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                  >
                    Run EGRR Pipeline
                  </Button>
                </div>
              </Card>
            )}

            {/* Running/Completed State */}
            {(runState.status === 'running' || runState.status === 'completed') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Iteration Timeline */}
                <Card
                  title="Iteration Timeline"
                  subtitle="Watch the pipeline refine the code"
                  className="h-fit"
                >
                  {runState.result ? (
                    <IterationTimeline
                      iterations={runState.result.iteration_details}
                      currentIteration={runState.currentIteration}
                      isRunning={runState.status === 'running'}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
                      <p className="text-neutral-400">
                        Running iteration {runState.currentIteration}...
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Current phase: {runState.currentPhase || 'Starting'}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Right: Result or Loading */}
                <div className="space-y-6">
                  {runState.status === 'completed' && runState.result ? (
                    <>
                      <PipelineResult result={runState.result} />
                      <Button
                        onClick={handleReset}
                        variant="secondary"
                        fullWidth
                        icon={<RotateCcw size={16} />}
                      >
                        Start New Run
                      </Button>
                    </>
                  ) : (
                    <Card title="Generation in Progress">
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-400 opacity-30" />
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
                        </div>
                        <p className="text-lg text-white mt-6">
                          Generating Code...
                        </p>
                        <p className="text-sm text-neutral-400 mt-2">
                          The EGRR pipeline is iterating to produce optimal code
                        </p>
                        <div className="flex items-center gap-4 mt-6 text-sm text-neutral-500">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Retrieval</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span>Generation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-neutral-600" />
                            <span>Execution</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Idle State - How it works */}
            {runState.status === 'idle' && (
              <Card
                title="How EGRR Works"
                subtitle="Execution-Grounded Retrieval Refinement Pipeline"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { phase: '1. Retrieval', desc: 'Search code patterns from corpus', color: 'text-purple-400' },
                    { phase: '2. Generation', desc: 'LLM generates initial code', color: 'text-blue-400' },
                    { phase: '3. Execution', desc: 'Run tests in sandbox', color: 'text-green-400' },
                    { phase: '4. Re-Retrieval', desc: 'Find patterns for errors', color: 'text-orange-400' },
                    { phase: '5. Review', desc: 'Analyze code quality', color: 'text-pink-400' },
                    { phase: '6. Decision', desc: 'Continue or terminate', color: 'text-cyan-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-neutral-800 rounded-lg p-4 text-center">
                      <div className={`text-sm font-semibold ${item.color} mb-2`}>
                        {item.phase}
                      </div>
                      <p className="text-xs text-neutral-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Iterative Refinement</p>
                      <p className="text-sm text-blue-200/70 mt-1">
                        The pipeline iterates through phases, using execution feedback to retrieve 
                        better patterns and refine the code until all tests pass or max iterations reached.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
