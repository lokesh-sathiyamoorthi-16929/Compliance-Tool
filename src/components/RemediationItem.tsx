import { ArrowUp, Zap, Clock } from 'lucide-react';
import { RemediationAction } from '../types';

interface Props {
  action: RemediationAction;
  rank: number;
}

const priorityConfig = {
  critical: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical' },
  high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', label: 'High' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Medium' },
  low: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Low' },
};

const effortConfig = {
  low: { label: 'Low Effort', color: 'text-green-600' },
  medium: { label: 'Medium Effort', color: 'text-amber-600' },
  high: { label: 'High Effort', color: 'text-red-600' },
};

export default function RemediationItem({ action, rank }: Props) {
  const p = priorityConfig[action.priority];
  const e = effortConfig[action.effort];

  return (
    <div className={`card p-4 border-l-4 ${p.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${p.bg} ${p.color}`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${p.bg} ${p.color} ${p.border}`}>
              {p.label}
            </span>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {action.controlId}
            </span>
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">{action.controlTitle}</h4>
          <p className="text-sm text-slate-600 mt-1">{action.actionDescription}</p>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-bold">+{action.scoreGain}%</span>
              <span className="text-xs text-slate-500">score gain</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">{action.recommendedProduct}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className={`text-sm font-medium ${e.color}`}>{e.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
