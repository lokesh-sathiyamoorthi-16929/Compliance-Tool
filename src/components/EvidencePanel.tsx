import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { evidenceByPage, frameworkEvidence, type EvidenceSource } from '../data/evidenceSources';

const confidenceStyles = {
  verified: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  interpreted: 'bg-amber-100 text-amber-800 border border-amber-200',
  reference: 'bg-slate-100 text-slate-700 border border-slate-200',
} as const;

const confidenceLabels = {
  verified: 'Verified ✓',
  interpreted: 'Interpreted ⚠',
  reference: 'Reference',
} as const;

const sectionTitles: Record<EvidenceSource['type'], string> = {
  standard: 'Compliance Standards',
  product: 'ManageEngine Product References',
  methodology: 'Methodology Notes',
  verification: 'Verification Status',
};

const sectionIcons: Record<EvidenceSource['type'], typeof FileText> = {
  standard: FileText,
  product: ExternalLink,
  methodology: Lightbulb,
  verification: ShieldCheck,
};

function getPageKey(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/wizard')) return 'wizard';
  if (pathname === '/frameworks') return 'frameworks';
  if (pathname.startsWith('/frameworks/')) return 'framework-detail';
  if (pathname.startsWith('/connections')) return 'connections';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/compare')) return 'compare';
  return 'home';
}

function getFrameworkId(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return parts[0] === 'frameworks' ? parts[1] : undefined;
}

export default function EvidencePanel() {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  const sources = useMemo(() => {
    const pageKey = getPageKey(pathname);
    const base = evidenceByPage[pageKey] ?? evidenceByPage.home;
    const frameworkId = getFrameworkId(pathname);
    const frameworkSources = frameworkId ? frameworkEvidence[frameworkId] ?? [] : [];
    return [...base, ...frameworkSources];
  }, [pathname]);

  const grouped = useMemo(
    () =>
      sources.reduce<Record<EvidenceSource['type'], EvidenceSource[]>>(
        (acc, source) => {
          acc[source.type].push(source);
          return acc;
        },
        { standard: [], product: [], methodology: [], verification: [] },
      ),
    [sources],
  );

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-2 pb-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-700">Evidence &amp; Sources</p>
              <p className="text-xs text-slate-500">How we built this page · click to expand</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {sources.length} sources
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-slate-200 px-4 py-4 space-y-4">
            {(Object.keys(sectionTitles) as EvidenceSource['type'][]).map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const Icon = sectionIcons[type];

              return (
                <div key={type} className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    {sectionTitles[type]}
                  </h4>
                  <div className="space-y-2">
                    {items.map((source) => (
                      <div
                        key={`${type}-${source.title}`}
                        className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          {source.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-blue-700"
                            >
                              {source.title}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <p className="text-sm font-semibold text-slate-900">{source.title}</p>
                          )}
                          <p className="text-sm text-slate-600">{source.description}</p>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${confidenceStyles[source.confidence]}`}
                        >
                          {confidenceLabels[source.confidence]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
