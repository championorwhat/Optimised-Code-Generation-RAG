/* src/components/testing/TestResultCard.tsx */

import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { TestResult } from '@/types';
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

interface TestResultCardProps {
  result: TestResult;
  onExpand?: () => void;
  expanded?: boolean;
  showDetails?: boolean;
}

export function TestResultCard({
  result,
  onExpand,
  expanded = false,
  showDetails,
}: TestResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const statusIcon =
    result.status === 'pass' ? (
      <CheckCircle size={18} className="text-green-400" />
    ) : (
      <AlertCircle size={18} className="text-red-400" />
    );

  const statusColor =
    result.status === 'pass'
      ? 'bg-green-500/10 border-green-500/20'
      : 'bg-red-500/10 border-red-500/20';

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border transition-all',
        statusColor
      )}
    >
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          onExpand?.();
        }}
        className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3 flex-1">
          {statusIcon}
          <div>
            <p className="font-medium text-white">{result.name}</p>
            <p className="text-xs text-neutral-400">
              {result.duration}ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            label={result.status.toUpperCase()}
            variant={result.status === 'pass' ? 'success' : 'danger'}
            size="sm"
          />
          <ChevronDown
            size={18}
            className={clsx(
              'transition-transform',
              isExpanded ? 'rotate-180' : ''
            )}
          />
        </div>
      </button>

      {isExpanded && showDetails && result.errorMessage && (
        <div className="mt-3 pt-3 border-t border-neutral-700">
          <p className="text-sm text-neutral-300">{result.errorMessage}</p>
          {result.stackTrace && (
            <pre className="mt-2 text-xs bg-neutral-900 p-2 rounded overflow-x-auto">
              {result.stackTrace}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
