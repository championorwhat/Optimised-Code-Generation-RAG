/**
 * EGRR Pipeline Page
 * 
 * Main interface for the Execution-Grounded Retrieval Refinement pipeline.
 * Shows real-time iteration progress with live phase tracking.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/common/Alert';
import { LivePhaseTracker, IterationProgress } from '@/components/pipeline/LivePhaseTracker';
import { PipelineResult } from '@/components/pipeline/PipelineResult';
import { IterationCodeViewer } from '@/components/pipeline/IterationCodeViewer';
import { egrrAPI, SSEEvent, formatDuration } from '@/services/egrr';
import { EGRRRunState, EGRRGenerateResponse, EGRRPhase, EGRRStatus } from '@/types';
import {
  Play,
  Loader2,
  Zap,
  Settings,
  Sparkles,
  Code2,
  Shield,
  Bug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  Timer,
  Activity,
  Server,
  StopCircle,
  Database
} from 'lucide-react';

// Prompt recommendations for quick start
const PROMPT_RECOMMENDATIONS = [
  {
    title: "Email Validator",
    description: "Validate email addresses with regex and error handling",
    prompt: "Write a Python function to validate email addresses. Include proper regex patterns, handle edge cases like empty strings and special characters, and return detailed validation results.",
    icon: Shield,
    category: "Validation"
  },
  {
    title: "Fibonacci with Memoization",
    description: "Optimized recursive algorithm",
    prompt: "Write a Python function to calculate Fibonacci numbers using memoization. Handle negative inputs, include both recursive and iterative approaches, and add proper docstrings.",
    icon: Zap,
    category: "Algorithm"
  },
  {
    title: "Safe File Reader",
    description: "File operations with proper error handling",
    prompt: "Write a Python function to safely read files with proper exception handling. Handle file not found, permission errors, encoding issues, and large files. Return structured results.",
    icon: Bug,
    category: "Error Handling"
  },
  {
    title: "SQL Injection Prevention",
    description: "Secure database query builder",
    prompt: "Write a Python function that safely constructs SQL queries to prevent SQL injection attacks. Use parameterized queries, validate inputs, and handle special characters properly.",
    icon: Shield,
    category: "Security"
  },
  {
    title: "Binary Search",
    description: "Efficient search implementation",
    prompt: "Write a Python binary search function that works on sorted lists. Handle edge cases like empty lists, single elements, and elements not found. Include both iterative and recursive versions.",
    icon: Code2,
    category: "Algorithm"
  },
  {
    title: "URL Validator",
    description: "Comprehensive URL validation",
    prompt: "Write a Python function to validate URLs. Check for valid protocols (http, https), proper domain format, handle query parameters, and validate against common URL patterns.",
    icon: Lightbulb,
    category: "Validation"
  }
];

export default function EGRRPipelinePage() {
  const [prompt, setPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(5);
  const [runState, setRunState] = useState<EGRRRunState>({
    status: 'idle',
    currentIteration: 0,
    currentPhase: null,
    result: null,
    error: null,
    startTime: null,
  });
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Streaming state
  const [iterations, setIterations] = useState<IterationProgress[]>([]);
  const [retrievedPatterns, setRetrievedPatterns] = useState<string[]>([]);
  const [useStreaming, setUseStreaming] = useState(false); // Default to non-streaming for reliability
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkBackendHealth = useCallback(async () => {
    try {
      const health = await egrrAPI.healthCheck();
      setBackendStatus(health.status === 'healthy' ? 'connected' : 'disconnected');
    } catch {
      setBackendStatus('disconnected');
    }
  }, []);

  // Check backend health on mount
  useEffect(() => {
    void (async () => {
      await checkBackendHealth();
    })();
  }, [checkBackendHealth]);

  // Timer for elapsed time during running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (runState.status === 'running' && runState.startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - runState.startTime!.getTime());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [runState.status, runState.startTime]);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    console.log('[SSE Event]', event.event, event.data);

    switch (event.event) {
      case 'pipeline_start':
        setIterations([]);
        setRetrievedPatterns([]);
        break;

      case 'iteration_start':
        const newIteration: IterationProgress = {
          iteration: event.data.iteration!,
          phases: {
            retrieval: { status: 'pending' },
            generation: { status: 'pending' },
            execution: { status: 'pending' },
            review: { status: 'pending' },
            decision: { status: 'pending' },
          },
          completed: false,
        };
        setIterations(prev => [...prev, newIteration]);
        setRunState(prev => ({ ...prev, currentIteration: event.data.iteration! }));
        break;

      case 'phase_start':
        setRunState(prev => ({
          ...prev,
          currentPhase: event.data.phase as EGRRPhase | null
        }));
        setIterations(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.phases[event.data.phase!] = {
              status: 'running',
              description: event.data.description,
            };
          }
          return updated;
        });
        break;

      case 'phase_complete':
        setIterations(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.phases[event.data.phase!] = {
              status: 'completed',
              result: event.data.result,
              duration_ms: event.data.duration_ms,
            };
          }
          return updated;
        });

        // Track retrieved patterns
        if (event.data.phase === 'retrieval' && event.data.result?.pattern_ids) {
          setRetrievedPatterns(prev => {
            const newPatterns = (event.data.result!.pattern_ids as string[]).filter(
              p => !prev.includes(p)
            );
            return [...prev, ...newPatterns];
          });
        }
        break;

      case 'iteration_complete':
        setIterations(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.completed = true;
            last.decision = event.data.decision;
            last.duration_ms = event.data.duration_ms;
          }
          return updated;
        });
        break;

      case 'pipeline_complete':
        const statusMap: Record<string, EGRRStatus> = {
          'success': 'success',
          'partial': 'partial',
          'failed': 'failed'
        };
        const result: EGRRGenerateResponse = {
          code: event.data.code || '',
          explanation: event.data.explanation || '',
          iterations: event.data.iterations || 0,
          status: statusMap[event.data.status || 'failed'] || 'failed',
          coverage: event.data.coverage || 0,
          tests_passed: event.data.tests_passed || 0,
          tests_failed: event.data.tests_failed || 0,
          iteration_details: [],
          total_duration_ms: event.data.total_duration_ms || 0,
          retrieved_patterns: event.data.retrieved_patterns || [],
        };

        setRunState({
          status: 'completed',
          currentIteration: event.data.iterations || 0,
          currentPhase: null,
          result,
          error: null,
          startTime: null,
        });
        break;
    }
  }, []);

  // Non-streaming handler - more reliable
  const handleRunPipelineNonStreaming = useCallback(async () => {
    if (!prompt.trim()) {
      setRunState(prev => ({ ...prev, error: 'Please enter a code generation prompt' }));
      return;
    }

    setElapsedTime(0);
    setIterations([]);
    setRetrievedPatterns([]);
    setRunState({
      status: 'running',
      currentIteration: 0,
      currentPhase: null,
      result: null,
      error: null,
      startTime: new Date(),
    });

    try {
      const result = await egrrAPI.generate({
        query: prompt,
        max_iterations: maxIterations,
        language: 'python',
        use_rag: true,
      });

      // Build iterations from result for display
      if (result.iteration_details) {
        const iters: IterationProgress[] = result.iteration_details.map(detail => ({
          iteration: detail.iteration_number,
          phases: {
            retrieval: { status: 'completed', result: detail.phase_results?.retrieval, duration_ms: detail.phase_results?.retrieval?.duration_ms },
            generation: { status: 'completed', result: detail.phase_results?.generation, duration_ms: detail.phase_results?.generation?.duration_ms },
            execution: { status: 'completed', result: detail.phase_results?.execution, duration_ms: detail.phase_results?.execution?.duration_ms },
            review: { status: 'completed', result: detail.phase_results?.review, duration_ms: detail.phase_results?.review?.duration_ms },
            decision: { status: 'completed', result: detail.phase_results?.decision, duration_ms: detail.phase_results?.decision?.duration_ms },
          },
          completed: true,
          decision: detail.decision || undefined,
          duration_ms: detail.duration_ms,
        }));
        setIterations(iters);
      }

      setRetrievedPatterns(result.retrieved_patterns || []);

      setRunState({
        status: 'completed',
        currentIteration: result.iterations,
        currentPhase: null,
        result,
        error: null,
        startTime: null,
      });
    } catch (error) {
      setRunState(prev => ({
        ...prev,
        status: 'error',
        error: (error as Error).message.includes('fetch')
          ? 'Cannot connect to backend. Please ensure the EGRR server is running on port 8000.'
          : (error as Error).message,
      }));
    }
  }, [prompt, maxIterations]);

  const handleRunPipeline = useCallback(() => {
    if (!prompt.trim()) {
      setRunState(prev => ({ ...prev, error: 'Please enter a code generation prompt' }));
      return;
    }

    // Use non-streaming by default for reliability
    if (!useStreaming) {
      handleRunPipelineNonStreaming();
      return;
    }

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setElapsedTime(0);
    setIterations([]);
    setRetrievedPatterns([]);
    setRunState({
      status: 'running',
      currentIteration: 0,
      currentPhase: null,
      result: null,
      error: null,
      startTime: new Date(),
    });

    // Start streaming
    abortControllerRef.current = egrrAPI.generateStream(
      {
        query: prompt,
        max_iterations: maxIterations,
        language: 'python',
        use_rag: true,
      },
      handleSSEEvent,
      (error) => {
        setRunState(prev => ({
          ...prev,
          status: 'error',
          error: error.message.includes('fetch')
            ? 'Cannot connect to backend. Please ensure the EGRR server is running on port 8000.'
            : error.message,
        }));
      },
      () => {
        console.log('[SSE] Stream completed');
      }
    );
  }, [prompt, maxIterations, handleSSEEvent, useStreaming, handleRunPipelineNonStreaming]);

  const handleStopPipeline = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setRunState(prev => ({
        ...prev,
        status: 'error',
        error: 'Pipeline was stopped by user',
      }));
    }
  }, []);

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setElapsedTime(0);
    setIterations([]);
    setRetrievedPatterns([]);
    setRunState({
      status: 'idle',
      currentIteration: 0,
      currentPhase: null,
      result: null,
      error: null,
      startTime: null,
    });
  };

  const handleSelectRecommendation = (rec: typeof PROMPT_RECOMMENDATIONS[0]) => {
    setPrompt(rec.prompt);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar title="EGRR Pipeline" />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Backend Status Alert */}
            {backendStatus === 'disconnected' && (
              <Alert
                variant="error"
                title="Backend Unavailable"
                message="Cannot connect to the EGRR pipeline backend. Make sure the server is running on port 8000 with: python -m uvicorn src.main:app --host 0.0.0.0 --port 8000"
                dismissible
                onDismiss={() => setBackendStatus('unknown')}
              />
            )}

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

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-8">
              <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      <Sparkles className="text-white" size={24} />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                      EGRR Pipeline
                    </h1>
                  </div>
                  <p className="text-neutral-400 text-lg max-w-xl">
                    Execution-Grounded Retrieval Refinement — Generate production-quality Python code
                    with iterative test-driven refinement
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${backendStatus === 'connected'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : backendStatus === 'disconnected'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-neutral-500/10 border-neutral-500/30 text-neutral-400'
                    }`}>
                    <Server size={16} />
                    <span className="text-sm font-medium">
                      {backendStatus === 'connected' ? 'Backend Connected' :
                        backendStatus === 'disconnected' ? 'Backend Offline' : 'Checking...'}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={checkBackendHealth}
                    icon={<RefreshCw size={14} />}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Input */}
              <div className="lg:col-span-1 space-y-4">
                {/* Prompt Input Card */}
                <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden">
                  <div className="p-4 border-b border-neutral-700/50 bg-neutral-800/30">
                    <div className="flex items-center gap-2">
                      <Code2 size={18} className="text-blue-400" />
                      <h3 className="font-semibold text-white">Code Generation Request</h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Describe what you want to build</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Write a function to validate email addresses with comprehensive error handling..."
                        className="w-full h-40 px-4 py-3 bg-neutral-900/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all text-sm"
                        disabled={runState.status === 'running'}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-neutral-500">{prompt.length} characters</span>
                        {prompt.length > 0 && (
                          <button
                            onClick={() => setPrompt('')}
                            className="text-xs text-neutral-400 hover:text-white transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Max Iterations */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Max Iterations: <span className="text-blue-400 font-bold">{maxIterations}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={maxIterations}
                        onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                        disabled={runState.status === 'running'}
                      />
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>Quick (1)</span>
                        <span>Thorough (10)</span>
                      </div>
                    </div>

                    {/* Pipeline Phases */}
                    <div className="bg-neutral-900/30 rounded-lg p-3 border border-neutral-700/30">
                      <div className="flex items-center gap-2 text-neutral-400 mb-2">
                        <Settings size={14} />
                        <span className="text-xs font-medium">Pipeline Phases</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Retrieval</span>
                        <span className="px-2 py-1 text-xs rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">Generation</span>
                        <span className="px-2 py-1 text-xs rounded-md bg-green-500/10 text-green-400 border border-green-500/20">Execution</span>
                        <span className="px-2 py-1 text-xs rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Review</span>
                        <span className="px-2 py-1 text-xs rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20">Decision</span>
                      </div>
                    </div>

                    {/* Run / Stop Button */}
                    {runState.status === 'idle' || runState.status === 'error' ? (
                      <Button
                        onClick={handleRunPipeline}
                        fullWidth
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-lg shadow-blue-500/25"
                        icon={<Zap size={18} />}
                      >
                        Run Pipeline
                      </Button>
                    ) : runState.status === 'running' ? (
                      <div className="space-y-3">
                        <Button
                          onClick={handleStopPipeline}
                          fullWidth
                          size="lg"
                          className="bg-red-600/80 hover:bg-red-600 border-red-500/30"
                          icon={<StopCircle size={18} />}
                        >
                          Stop Pipeline
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-blue-400">
                          <Timer size={14} />
                          <span className="text-sm font-mono">{formatDuration(elapsedTime)}</span>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleReset}
                        fullWidth
                        size="lg"
                        variant="secondary"
                        icon={<Play size={18} />}
                      >
                        New Run
                      </Button>
                    )}
                  </div>
                </div>

                {/* Retrieved Patterns Card */}
                {retrievedPatterns.length > 0 && (
                  <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database size={16} className="text-purple-400" />
                      <h3 className="font-medium text-white">Retrieved Patterns</h3>
                      <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                        {retrievedPatterns.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {retrievedPatterns.map((pattern, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-md bg-neutral-700/50 text-neutral-300 border border-neutral-600/30"
                        >
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Run Status Card */}
                {(runState.status === 'running' || runState.status === 'completed') && (
                  <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={16} className="text-green-400" />
                      <h3 className="font-medium text-white">Run Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-sm">Status</span>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${runState.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                          }`}>
                          {runState.status === 'completed' ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />}
                          {runState.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 text-sm">Iterations</span>
                        <span className="text-white font-bold">{runState.currentIteration}/{maxIterations}</span>
                      </div>
                      {runState.result && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Tests</span>
                            <span className="text-white">
                              <span className="text-green-400">{runState.result.tests_passed ?? 0}</span>
                              <span className="text-neutral-500">/</span>
                              <span className="text-red-400">{(runState.result.tests_failed ?? 0) + (runState.result.tests_passed ?? 0)}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Coverage</span>
                            <span className="text-white font-mono">{Math.round((runState.result.coverage ?? 0) * 100)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400 text-sm">Duration</span>
                            <span className="text-white font-mono text-sm">
                              {formatDuration(runState.result.total_duration_ms)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Live Tracker / Results / Recommendations */}
              <div className="lg:col-span-2 space-y-6">
                {/* Idle State - Show Recommendations */}
                {runState.status === 'idle' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Lightbulb size={18} className="text-yellow-400" />
                      <h3 className="font-semibold">Quick Start Recommendations</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PROMPT_RECOMMENDATIONS.map((rec, idx) => {
                        const IconComponent = rec.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectRecommendation(rec)}
                            className="group text-left p-4 bg-neutral-800/30 hover:bg-neutral-800/60 border border-neutral-700/50 hover:border-blue-500/50 rounded-xl transition-all duration-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                <IconComponent size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                                    {rec.title}
                                  </h4>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-700/50 text-neutral-400">
                                    {rec.category}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                                  {rec.description}
                                </p>
                              </div>
                              <ArrowRight size={16} className="text-neutral-600 group-hover:text-blue-400 transition-colors mt-1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Info Card */}
                    <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6 mt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                          <Sparkles size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">How EGRR Works</h4>
                          <ul className="space-y-2 text-sm text-neutral-400">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span><strong className="text-blue-300">Retrieval:</strong> Searches code patterns from the corpus</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <span><strong className="text-purple-300">Generation:</strong> LLM synthesizes code using patterns</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              <span><strong className="text-green-300">Execution:</strong> Runs tests in sandbox environment</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                              <span><strong className="text-yellow-300">Review:</strong> Analyzes quality and identifies issues</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                              <span><strong className="text-pink-300">Decision:</strong> Continues iteration or terminates</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Running State - Show Live Tracker */}
                {runState.status === 'running' && (
                  <div className="bg-neutral-800/30 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
                    <LivePhaseTracker
                      currentIteration={runState.currentIteration}
                      maxIterations={maxIterations}
                      iterations={iterations}
                      currentPhase={runState.currentPhase}
                      pipelineStatus="running"
                      elapsedTime={elapsedTime}
                    />
                  </div>
                )}

                {/* Completed State - Show Results */}
                {runState.status === 'completed' && runState.result && (
                  <>
                    {/* Live Tracker showing completed iterations */}
                    <div className="bg-neutral-800/30 backdrop-blur-sm rounded-xl border border-green-500/20 p-6">
                      <LivePhaseTracker
                        currentIteration={runState.currentIteration}
                        maxIterations={maxIterations}
                        iterations={iterations}
                        currentPhase={null}
                        pipelineStatus="completed"
                        elapsedTime={runState.result.total_duration_ms}
                      />
                    </div>

                    {/* Iteration Code Viewer */}
                    <div className="bg-neutral-800/30 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Code Per Iteration</h3>
                      <IterationCodeViewer
                        iterations={runState.result.iteration_details}
                        finalCode={runState.result.code}
                        finalExplanation={runState.result.explanation}
                      />
                    </div>

                    {/* Summary Statistics */}
                    <Card
                      title="Pipeline Summary"
                      className="bg-neutral-800/30 backdrop-blur-sm border-neutral-700/50"
                    >
                      <PipelineResult result={runState.result} />
                    </Card>
                  </>
                )}

                {/* Error State */}
                {runState.status === 'error' && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8">
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="p-4 rounded-full bg-red-500/10 mb-4">
                        <XCircle size={32} className="text-red-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Pipeline Failed
                      </h3>
                      <p className="text-neutral-400 text-center max-w-md mb-6">
                        {runState.error}
                      </p>

                      {/* Show partial progress if any */}
                      {iterations.length > 0 && (
                        <div className="w-full mb-6">
                          <LivePhaseTracker
                            currentIteration={runState.currentIteration || iterations.length}
                            maxIterations={maxIterations}
                            iterations={iterations}
                            currentPhase={null}
                            pipelineStatus="error"
                            elapsedTime={elapsedTime}
                          />
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button onClick={handleReset} variant="secondary">
                          Try Again
                        </Button>
                        <Button onClick={checkBackendHealth} variant="secondary" icon={<RefreshCw size={14} />}>
                          Check Backend
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
