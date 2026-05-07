import { ShieldCheck } from 'lucide-react';
import type { Framework } from '../types';

interface Props {
  framework: Framework;
}

export default function ValidationBadge({ framework }: Props) {
  const isVerified = framework.validationStatus === 'sme_validated';

  return (
    <span className="relative inline-flex group">
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
          isVerified
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        {isVerified ? <ShieldCheck className="w-3 h-3" /> : null}
        {isVerified ? 'Verified ✓' : 'Interpretation'}
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 top-6 w-72 bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20">
        This framework&apos;s controls and mappings are based on Marcus Hale&apos;s interpretation of
        public standards. SME validation pending.
      </span>
    </span>
  );
}
