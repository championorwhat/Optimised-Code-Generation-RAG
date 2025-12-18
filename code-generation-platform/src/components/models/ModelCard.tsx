/* src/components/models/ModelCard.tsx */

import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Model } from '@/types';
import { DollarSign, Zap, Settings, Trash2 } from 'lucide-react';

interface ModelCardProps {
  model: Model;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onConfigure?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ModelCard({
  model,
  isSelected,
  onSelect,
  onConfigure,
  onDelete,
}: ModelCardProps) {
  return (
    <Card
      hover
      className={
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : ''
      }
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-100">{model.name}</h3>
          <p className="text-sm text-neutral-500">{model.provider}</p>
        </div>
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={(e) => {
            e.stopPropagation();
            onSelect?.(model.id);
          }}
          className="w-5 h-5 cursor-pointer accent-blue-500"
        />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400 flex items-center gap-1">
            <DollarSign size={14} /> Cost
          </span>
          <span className="font-mono font-semibold text-neutral-100">
            ${model.costPerToken.toFixed(6)}/token
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-400 flex items-center gap-1">
            <Zap size={14} /> Latency
          </span>
          <span className="font-mono font-semibold text-neutral-100">
            {model.avgLatency}ms
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-400">Pass Rate</span>
            <span className="font-mono font-semibold text-blue-400">
              {model.passRate}%
            </span>
          </div>
          <ProgressBar value={model.passRate} variant="primary" />
        </div>

        <div className="text-xs text-neutral-500">
          {model.totalRuns} total runs
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Settings size={14} />}
          onClick={() => onConfigure?.(model.id)}
          className="flex-1"
        >
          Configure
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => onDelete?.(model.id)}
        />
      </div>
    </Card>
  );
}
