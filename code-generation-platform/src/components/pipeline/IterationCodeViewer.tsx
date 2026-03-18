/**
 * IterationCodeViewer Component
 * 
 * Displays code for EACH iteration with:
 * - Iteration navigation tabs
 * - Monaco Editor for code display
 * - Status badges (New, Unchanged, Final, Error)
 * - Diff view for comparing iterations
 * - Phase summary panel
 */

'use client';

import { useState, useMemo } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import {
    Code,
    GitCompare,
    CheckCircle2,
    RefreshCw,
    Flag,
    AlertCircle,
    ChevronRight,
    Copy,
    Check,
    Search,
    Play,
    FileSearch,
    GitBranch,
    TestTube,
    Shield,
    Clock
} from 'lucide-react';
import { IterationDetail } from '@/types';
import { formatDuration } from '@/services/egrr';
import { Badge } from '@/components/common/Badge';

interface IterationCodeViewerProps {
    iterations: IterationDetail[];
    finalCode: string;
    finalExplanation?: string;
}

type CodeStatus = 'new' | 'unchanged' | 'optimized' | 'final' | 'error';

interface IterationCodeData {
    iteration: number;
    code: string;
    status: CodeStatus;
    explanation: string;
    hasChanges: boolean;
}

const STATUS_CONFIG: Record<CodeStatus, { label: string; icon: React.ReactNode; className: string }> = {
    new: {
        label: 'New Code Generated',
        icon: <Code size={14} />,
        className: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    unchanged: {
        label: 'Optimization Attempted – No Improvement',
        icon: <RefreshCw size={14} />,
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    optimized: {
        label: 'Code Optimized',
        icon: <CheckCircle2 size={14} />,
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    final: {
        label: 'Final Converged Code',
        icon: <Flag size={14} />,
        className: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    error: {
        label: 'Invalid Code (Sandbox Error)',
        icon: <AlertCircle size={14} />,
        className: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
};

export function IterationCodeViewer({ iterations, finalCode, finalExplanation }: IterationCodeViewerProps) {
    const [selectedIteration, setSelectedIteration] = useState(iterations.length);
    const [viewMode, setViewMode] = useState<'code' | 'diff'>('code');
    const [copied, setCopied] = useState(false);

    // Extract code from each iteration
    const iterationCodes = useMemo((): IterationCodeData[] => {
        const codes: IterationCodeData[] = [];
        let lastCode = '';

        for (let i = 0; i < iterations.length; i++) {
            const iter = iterations[i];
            const genResult = iter.phase_results?.generation;
            const execResult = iter.phase_results?.execution;

            // Get code from generation phase or use last known code
            const code = genResult?.code || lastCode || finalCode;
            const explanation = genResult?.explanation || '';

            // Determine status
            let status: CodeStatus;
            const isLastIteration = i === iterations.length - 1;
            const executionFailed = execResult?.status === 'failed' || iter.tests_failed > 0;
            const hasChanges = code !== lastCode && lastCode !== '';

            if (executionFailed && iter.tests_failed > 0) {
                status = 'error';
            } else if (i === 0) {
                status = 'new';
            } else if (!hasChanges) {
                status = 'unchanged';
            } else if (isLastIteration) {
                status = 'final';
            } else {
                status = 'optimized';
            }

            // Override: if this is the last iteration and successful, mark as final
            if (isLastIteration && (iter.decision === 'TERMINATE_SUCCESS' || iter.decision === 'TERMINATE_MAX_ITERATIONS')) {
                status = 'final';
            }

            codes.push({
                iteration: iter.iteration_number,
                code,
                status,
                explanation,
                hasChanges
            });

            lastCode = code;
        }

        return codes;
    }, [iterations, finalCode]);

    const currentIterData = iterationCodes[selectedIteration - 1] || {
        iteration: 1,
        code: finalCode,
        status: 'final' as CodeStatus,
        explanation: finalExplanation || '',
        hasChanges: false
    };

    const previousIterData = selectedIteration > 1 ? iterationCodes[selectedIteration - 2] : null;
    const currentIter = iterations[selectedIteration - 1];
    const statusConfig = STATUS_CONFIG[currentIterData.status];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(currentIterData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* Iteration Navigation */}
            <div className="flex items-center gap-2 flex-wrap">
                {iterationCodes.map((iterData, idx) => {
                    const isSelected = iterData.iteration === selectedIteration;
                    const isLast = idx === iterationCodes.length - 1;
                    const statusCfg = STATUS_CONFIG[iterData.status];

                    return (
                        <div key={iterData.iteration} className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedIteration(iterData.iteration)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isSelected
                                        ? 'bg-blue-500/20 border-blue-500/50 text-white'
                                        : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:border-neutral-600 hover:text-white'
                                    }`}
                            >
                                <span className="font-medium">Iteration {iterData.iteration}</span>
                                {isLast && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                                        ✓
                                    </span>
                                )}
                            </button>
                            {idx < iterationCodes.length - 1 && (
                                <ChevronRight size={16} className="text-neutral-600" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.className}`}>
                {statusConfig.icon}
                <span className="text-sm font-medium">{statusConfig.label}</span>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-neutral-700">
                <div className="flex">
                    <button
                        onClick={() => setViewMode('code')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'code'
                                ? 'text-blue-400 border-blue-400'
                                : 'text-neutral-400 border-transparent hover:text-white'
                            }`}
                    >
                        <Code size={16} />
                        Code
                    </button>
                    <button
                        onClick={() => setViewMode('diff')}
                        disabled={selectedIteration === 1}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'diff'
                                ? 'text-blue-400 border-blue-400'
                                : selectedIteration === 1
                                    ? 'text-neutral-600 border-transparent cursor-not-allowed'
                                    : 'text-neutral-400 border-transparent hover:text-white'
                            }`}
                    >
                        <GitCompare size={16} />
                        Diff from Previous
                    </button>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            {/* Code Editor / Diff View */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                {viewMode === 'code' ? (
                    <Editor
                        height="400px"
                        language="python"
                        value={currentIterData.code}
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 }
                        }}
                    />
                ) : previousIterData ? (
                    currentIterData.hasChanges ? (
                        <DiffEditor
                            height="400px"
                            language="python"
                            original={previousIterData.code}
                            modified={currentIterData.code}
                            theme="vs-dark"
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                renderSideBySide: true,
                                scrollBeyondLastLine: false,
                                automaticLayout: true
                            }}
                        />
                    ) : (
                        <div className="h-[400px] flex items-center justify-center text-neutral-400">
                            <div className="text-center">
                                <RefreshCw size={48} className="mx-auto mb-4 text-yellow-400/50" />
                                <p className="text-lg font-medium">No changes — optimal solution retained</p>
                                <p className="text-sm mt-1">The code from iteration {selectedIteration - 1} was kept as-is.</p>
                            </div>
                        </div>
                    )
                ) : null}
            </div>

            {/* Phase Summary Panel */}
            {currentIter && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Retrieval */}
                    {currentIter.phase_results?.retrieval && (
                        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Search size={16} />
                                <span className="text-sm font-medium">Retrieval</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {currentIter.phase_results.retrieval.documents_retrieved}
                            </div>
                            <p className="text-xs text-neutral-500">patterns found</p>
                        </div>
                    )}

                    {/* Execution */}
                    <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Play size={16} />
                            <span className="text-sm font-medium">Execution</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-400">{currentIter.tests_passed}</span>
                            <span className="text-neutral-500">/</span>
                            <span className="text-lg text-red-400">{currentIter.tests_failed}</span>
                        </div>
                        <p className="text-xs text-neutral-500">tests passed/failed</p>
                    </div>

                    {/* Review */}
                    {currentIter.phase_results?.review && (
                        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                            <div className="flex items-center gap-2 text-yellow-400 mb-2">
                                <FileSearch size={16} />
                                <span className="text-sm font-medium">Review</span>
                            </div>
                            <div className={`text-2xl font-bold ${currentIter.phase_results.review.quality_score >= 0.8 ? 'text-green-400' :
                                    currentIter.phase_results.review.quality_score >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {(currentIter.phase_results.review.quality_score * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-neutral-500">quality score</p>
                        </div>
                    )}

                    {/* Decision */}
                    {currentIter.phase_results?.decision && (
                        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <GitBranch size={16} />
                                <span className="text-sm font-medium">Decision</span>
                            </div>
                            <Badge
                                label={currentIter.decision?.replace('TERMINATE_', '').replace('_', ' ') || 'CONTINUE'}
                                variant={currentIter.decision?.includes('SUCCESS') ? 'success' :
                                    currentIter.decision?.includes('MAX') ? 'warning' : 'neutral'}
                                size="sm"
                            />
                            {currentIter.phase_results.decision.rationale && (
                                <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                                    {currentIter.phase_results.decision.rationale}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Explanation */}
            {currentIterData.explanation && (
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                    <h4 className="text-sm font-medium text-neutral-300 mb-2">Explanation</h4>
                    <p className="text-sm text-neutral-400 whitespace-pre-wrap">{currentIterData.explanation}</p>
                </div>
            )}
        </div>
    );
}

export default IterationCodeViewer;
