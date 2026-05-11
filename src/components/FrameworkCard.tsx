import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { Framework } from '../types';
import ValidationBadge from './ValidationBadge';

interface Props {
  framework: Framework;
  isMandatory: boolean;
}

export default function FrameworkCard({ framework, isMandatory }: Props) {
  return (
    <div className="card p-5 hover:shadow-md transition-all duration-200 border-l-4 group"
      style={{ borderLeftColor: framework.color }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isMandatory ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" /> Mandatory
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <CheckCircle className="w-3 h-3" /> Recommended
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {(framework.rubric ?? 'legacy').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{framework.name}</h3>
            <ValidationBadge framework={framework} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{framework.description}</p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: framework.color + '15' }}
        >
          <Shield className="w-5 h-5" style={{ color: framework.color }} />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{framework.controlCount}</p>
          <p className="text-xs text-slate-500">Controls</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold" style={{ color: framework.color }}>
            {framework.meCoveragePercent}%
          </p>
          <p className="text-xs text-slate-500">ME Coverage</p>
        </div>
        <div className="ml-auto">
          <Link
            to={`/frameworks/${framework.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150"
            style={{
              backgroundColor: framework.color + '15',
              color: framework.color,
            }}
          >
            View Controls
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ME Coverage bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${framework.meCoveragePercent}%`,
              backgroundColor: framework.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
