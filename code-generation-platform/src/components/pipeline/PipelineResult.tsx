/**
 * PipelineResult Component
 * 
 * Displays the final result of the EGRR pipeline including:
 * - Generated code with syntax highlighting
 * - Summary statistics
 * - Explanation of the solution
 */

'use client';

import { useState } from 'react';
import { 
  Copy, 
  Check, 
  Download, 
  Code2, 
  TestTube, 
  Shield, 
  Clock,
  FileCode,
  TrendingUp
} from 'lucide-react';
import { EGRRGenerateResponse } from '@/types';
import { formatDuration } from '@/services/egrr';
import { Badge } from '@/components/common/Badge';

interface PipelineResultProps {
  result: EGRRGenerateResponse;
}

export function PipelineResult({ result }: PipelineResultProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'explanation'>('code');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_code.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusVariant = (): 'success' | 'warning' | 'danger' => {
    switch (result.status) {
      case 'success': return 'success';
      case 'partial': return 'warning';
      default: return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-xs">Status</span>
          </div>
          <Badge 
            label={result.status.toUpperCase()} 
            variant={getStatusVariant()} 
            size="md"
          />
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Clock size={16} />
            <span className="text-xs">Iterations</span>
          </div>
          <div className="text-2xl font-bold text-white">{result.iterations}</div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <TestTube size={16} />
            <span className="text-xs">Tests</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-400">{result.tests_passed || 0}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-lg text-red-400">{result.tests_failed || 0}</span>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Shield size={16} />
            <span className="text-xs">Coverage</span>
          </div>
          <div className={`text-2xl font-bold ${
            (result.coverage || 0) >= 0.8 ? 'text-green-400' :
            (result.coverage || 0) >= 0.5 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {((result.coverage || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Clock size={16} />
            <span className="text-xs">Duration</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(result.total_duration_ms)}
          </div>
        </div>
      </div>

      {/* Retrieved Patterns */}
      {result.retrieved_patterns.length > 0 && (
        <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 mb-3">
            <FileCode size={16} />
            <span className="text-sm font-medium">Retrieved Patterns</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.retrieved_patterns.map((pattern, idx) => (
              <Badge key={idx} label={pattern} variant="neutral" size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Code / Explanation Tabs */}
      <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'code'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-neutral-400 border-transparent hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Code2 size={16} />
                Generated Code
              </div>
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'explanation'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-neutral-400 border-transparent hover:text-white'
              }`}
            >
              Explanation
            </button>
          </div>

          {activeTab === 'code' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 text-neutral-400 hover:text-white rounded transition-colors"
                title="Copy code"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-neutral-400 hover:text-white rounded transition-colors"
                title="Download code"
              >
                <Download size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'code' ? (
            <div className="relative">
              <pre className="text-sm font-mono text-neutral-300 overflow-x-auto p-4 bg-neutral-900 rounded-lg max-h-150 overflow-y-auto">
                <code>{result.code}</code>
              </pre>
              <div className="absolute top-2 right-2 text-xs text-neutral-500">
                {result.code.split('\n').length} lines
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {result.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PipelineResult;
