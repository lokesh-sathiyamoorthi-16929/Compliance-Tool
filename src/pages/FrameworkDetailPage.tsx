import { useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plug,
  Filter,
  ShoppingCart,
  Info,
  ScrollText,
  UserCheck,
  Users,
  Network,
  Shield,
  Monitor,
  Key,
  Package2,
  X,
  ExternalLink,
  FileDown,
} from 'lucide-react';
import { getFrameworkById } from '../data/frameworks';
import { getControlsByFrameworkId } from '../data/controls';
import { getProductById } from '../data/manageEngineProducts';
import ControlCard from '../components/ControlCard';
import ValidationBadge from '../components/ValidationBadge';
import NotFoundPage from './NotFoundPage';
import { useAppStore } from '../store/useAppStore';
import { scoreFramework } from '../engine/scoring';

const PRODUCT_ICONS: Record<string, typeof Package2> = {
  log360: ScrollText,
  adaudit: UserCheck,
  admanager: Users,
  ad360: Network,
  datasecurity: Shield,
  endpoint: Monitor,
  pam360: Key,
  pmp: Key,
  patchmanager: Monitor,
  vulnmanager: Shield,
};

const BUNDLE_DOT = {
  essential: 'bg-blue-600',
  recommended: 'bg-teal-500',
  complementary: 'bg-slate-400',
} as const;

const FRAMEWORK_INSIGHT: Record<string, string> = {
  hipaa: 'HIPAA applies because you handle Protected Health Information. The Security Rule requires administrative, physical, and technical safeguards — ManageEngine covers the technical layer.',
  pcidss: 'PCI DSS applies because you process payment card data. Maintain a secure network, protect cardholder data, and monitor access — Log360 and ADAudit Plus cover the monitoring layer.',
  soc2: 'SOC 2 applies if you provide services to other businesses. Your auditor will test these controls against the Trust Service Criteria — ManageEngine provides evidence-ready audit logs.',
  nistcsf: 'NIST CSF provides a risk-based framework to identify, protect, detect, respond, and recover from cybersecurity threats. Widely adopted as a baseline for any organization.',
  iso27001: 'ISO 27001 certification demonstrates your commitment to information security management. These controls form your ISMS baseline — ManageEngine addresses access, monitoring, and audit.',
  gdpr: 'GDPR applies because you process personal data of EU residents. Data protection by design and breach notification within 72 hours are key obligations.',
  ccpa: 'CCPA/CPRA applies because you collect personal information from California residents. Consumers have the right to know, delete, and opt out of sale of their data.',
  sox: 'SOX IT General Controls apply to publicly traded companies. Auditors will test change management, access controls, and operations — ManageEngine provides audit trails for all three.',
  nist800171: 'NIST 800-171 applies because you handle Controlled Unclassified Information (CUI) under a federal contract. These 110 practices form the minimum security baseline for DoD contractors.',
  cmmc: 'CMMC 2.0 applies because you are a defense contractor. Certification is required to bid on DoD contracts — these controls must be independently verified.',
  nist80053: 'NIST 800-53 Rev 5 applies to federal information systems and is widely adopted as a cloud security baseline. These controls are the foundation for FedRAMP and FISMA compliance.',
  cjis: 'CJIS applies because your organization accesses Criminal Justice Information. The FBI security policy mandates encryption, MFA, and comprehensive audit logging.',
  fedramp: 'FedRAMP applies because your cloud service serves U.S. government agencies. Authorization is required before agencies can use your service — these controls are the minimum baseline.',
  ferpa: 'FERPA applies because you maintain student education records. Records must be protected and parents/eligible students must have access rights.',
  glba: 'GLBA applies because you are a financial institution. The Safeguards Rule requires an information security program protecting customer financial data.',
};

const FRAMEWORK_INFOGRAPHICS: Record<string, string> = {
  hipaa: 'https://download.manageengine.com/images/hipaa-compliance-infographic.pdf?HIPAACompliance',
};

const TOOLTIP_OFFSET_PX = 8;
const TOOLTIP_WIDTH_PX = 264;

export default function FrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const framework = getFrameworkById(id ?? '');
  const controls = getControlsByFrameworkId(id ?? '');
  const { log360Evidence, connections, attestations, ad360Summary } = useAppStore();
  const log360Connected = connections.log360.connected;

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  if (!framework) return <NotFoundPage />;

  const frameworkScore =
    log360Evidence && connections.log360.connected
      ? scoreFramework(framework.id, log360Evidence, { attestations, ad360Summary, rubricOverride: framework.rubric })
      : null;
  const controlScoreById = new Map((frameworkScore?.controls ?? []).map((score) => [score.controlId, score]));

  const categories = ['all', ...Array.from(new Set(controls.map((c) => c.category)))];

  const productSpotlights = useMemo(() => {
    const rollup = new Map<string, { coveredControls: number; totalCoverage: number }>();

    controls.forEach((control) => {
      control.manageEngineProducts
        .filter((mapping) => mapping.primary)
        .forEach((mapping) => {
          const entry = rollup.get(mapping.productId) ?? { coveredControls: 0, totalCoverage: 0 };
          entry.coveredControls += 1;
          entry.totalCoverage += mapping.coverage;
          rollup.set(mapping.productId, entry);
        });
    });

    return Array.from(rollup.entries())
      .map(([productId, stats]) => {
        const product = getProductById(productId);
        if (!product) return null;

        const averageCoverage = Math.round(stats.totalCoverage / stats.coveredControls);
        const coverageRatio = controls.length === 0 ? 0 : (stats.coveredControls / controls.length) * 100;
        const bundle = coverageRatio >= 40 ? 'essential' : coverageRatio >= 20 ? 'recommended' : 'complementary';

        return { product, coveredControls: stats.coveredControls, totalControls: controls.length, averageCoverage, bundle } as const;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.coveredControls !== a.coveredControls ? b.coveredControls - a.coveredControls : b.averageCoverage - a.averageCoverage);
  }, [controls]);

  const filtered = controls.filter((c) => {
    const catMatch = categoryFilter === 'all' || c.category === categoryFilter;
    const scopeMatch = scopeFilter === 'all' || (scopeFilter === 'in-scope' && c.inItScope) || (scopeFilter === 'out-scope' && !c.inItScope);
    const productMatch = productFilter === 'all' || c.manageEngineProducts.some((m) => m.productId === productFilter);
    return catMatch && scopeMatch && productMatch;
  });

  const avgCoverage =
    controls.length === 0 ? 0
    : Math.round(controls.reduce((sum, c) => sum + c.manageEngineProducts.reduce((s, m) => s + (m.primary ? m.coverage : 0), 0), 0) / controls.length);

  const toggleProductFilter = (productId: string) => {
    setProductFilter(productId === productFilter ? 'all' : productId);
    setTimeout(() => controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleRowEnter = (productId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    enterTimerRef.current = window.setTimeout(() => {
      setTooltipPos({ top: rect.top, left: rect.right });
      setHoveredProductId(productId);
    }, 150);
  };

  const handleRowLeave = () => {
    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    leaveTimerRef.current = window.setTimeout(() => {
      setHoveredProductId(null);
      setTooltipPos(null);
    }, 200);
  };

  const handleTooltipEnter = () => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const activeProduct = productFilter !== 'all' ? getProductById(productFilter) : null;
  const frameworkInsight = FRAMEWORK_INSIGHT[id ?? ''] ?? null;
  const infographicUrl = FRAMEWORK_INFOGRAPHICS[id ?? ''] ?? null;

  const tooltipSpotlight = hoveredProductId ? productSpotlights.find((s) => s.product.id === hoveredProductId) : null;

  return (
    <div className="lg:flex lg:gap-0 -mx-4 lg:-mx-8">
      {/* ── Desktop product rail ── */}
      {productSpotlights.length > 0 && (
        <aside className="hidden lg:block w-[152px] shrink-0 border-r border-slate-200 bg-slate-50">
          <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-clean flex flex-col py-2">

            {/* Rail header */}
            <div className="flex items-center justify-between px-3 pb-2 mb-0.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Products</span>
              </div>
              <div className="relative group">
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" aria-label="About this panel" role="img" />
                <div className="absolute right-0 top-5 w-52 bg-slate-900 text-white text-xs rounded-lg p-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20 leading-relaxed">
                  ManageEngine products that help cover this framework&apos;s controls. Click any product to filter the controls list.
                </div>
              </div>
            </div>

            {/* Product rows */}
            <div className="flex flex-col">
              {productSpotlights.map((spotlight) => {
                const ProductIcon = PRODUCT_ICONS[spotlight.product.id] ?? Package2;
                const isActive = productFilter === spotlight.product.id;

                return (
                  <div
                    key={spotlight.product.id}
                    className="border-b border-slate-100 last:border-0"
                    onMouseEnter={(e) => handleRowEnter(spotlight.product.id, e)}
                    onMouseLeave={handleRowLeave}
                  >
                    <button
                      type="button"
                      onClick={() => toggleProductFilter(spotlight.product.id)}
                      className={`relative w-full px-2.5 py-2 transition-colors text-left flex flex-col ${
                        isActive ? 'bg-blue-50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      {isActive && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 rounded-r" />}
                      <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${BUNDLE_DOT[spotlight.bundle]}`} />
                      {/* Icon + name row */}
                      <div className="flex items-center gap-1.5 pr-4">
                        <ProductIcon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-600'}`} />
                        <span className={`text-xs leading-tight ${isActive ? 'text-blue-700 font-semibold' : 'text-slate-800 font-medium'}`}>
                          {spotlight.product.shortName}
                        </span>
                      </div>
                      {/* Control count */}
                      <span className="text-[11px] text-slate-500 mt-0.5 pl-[26px]">
                        {spotlight.coveredControls}/{spotlight.totalControls} controls
                      </span>
                      {/* Coverage bar */}
                      <div className="w-full h-[3px] bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${spotlight.averageCoverage}%` }} />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clear filter footer */}
            {productFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setProductFilter('all')}
                className="mt-2 mx-2 mb-1 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 py-1"
              >
                <X className="w-3 h-3" />
                Clear filter
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ── Fixed hover tooltip (desktop) ── */}
      {hoveredProductId && tooltipPos && tooltipSpotlight && (
        <div
          style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left + TOOLTIP_OFFSET_PX, zIndex: 50, width: TOOLTIP_WIDTH_PX }}
          className="bg-white border border-slate-200 rounded-xl shadow-lg p-4"
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleRowLeave}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-slate-900 text-sm leading-snug">{tooltipSpotlight.product.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white capitalize shrink-0 ${BUNDLE_DOT[tooltipSpotlight.bundle]}`}>
              {tooltipSpotlight.bundle}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Covers {tooltipSpotlight.coveredControls} / {tooltipSpotlight.totalControls} controls · {tooltipSpotlight.averageCoverage}% avg
          </p>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{tooltipSpotlight.product.description}</p>
          <p className="text-xs text-slate-400 mt-2">Click to filter controls →</p>
          <a
            href={tooltipSpotlight.product.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            Open product page <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-5 px-4 lg:px-8 py-6">
        <Link to="/frameworks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Frameworks
        </Link>

        {/* ── Mobile horizontal product strip ── */}
        {productSpotlights.length > 0 && (
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">Products</span>
              {productFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setProductFilter('all')}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700"
                >
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}
            </div>
            <div className="overflow-x-auto pb-2 scrollbar-clean">
              <div className="flex gap-2 min-w-max">
                {productSpotlights.map((spotlight) => {
                  const ProductIcon = PRODUCT_ICONS[spotlight.product.id] ?? Package2;
                  const isActive = productFilter === spotlight.product.id;
                  return (
                    <button
                      key={spotlight.product.id}
                      type="button"
                      onClick={() => toggleProductFilter(spotlight.product.id)}
                      className={`relative w-[80px] h-[60px] rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-0.5 pt-1 px-1 ${isActive ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${BUNDLE_DOT[spotlight.bundle]}`} />
                      <ProductIcon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-600'}`} />
                      <span className={`text-[10px] font-medium text-center leading-tight w-full truncate px-0.5 ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                        {spotlight.product.shortName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {spotlight.coveredControls}/{spotlight.totalControls}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="card p-6" style={{ borderTop: `4px solid ${framework.color}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{framework.fullName}</h1>
                <ValidationBadge framework={framework} />
              </div>
              <p className="text-slate-500 mt-1">{framework.description}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div>
                  <p className="text-xs text-slate-500">Total Controls</p>
                  <p className="text-2xl font-bold text-slate-900">{framework.controlCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ME Coverage</p>
                  <p className="text-2xl font-bold" style={{ color: framework.color }}>{framework.meCoveragePercent}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Avg Control Coverage</p>
                  <p className="text-2xl font-bold text-slate-900">{avgCoverage}%</p>
                </div>
                {frameworkScore ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-500">Rubric</p>
                      <p className="text-2xl font-bold text-slate-900">{frameworkScore.rubric.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">NIST Tier</p>
                      <p className="text-2xl font-bold text-slate-900">{frameworkScore.nistTier}</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <Link to={log360Connected ? '/dashboard' : '/connections'} className="btn-primary shrink-0">
              <Plug className="w-4 h-4" />
              {log360Connected ? 'Run Assessment' : 'Connect Log360 → Score'}
            </Link>
          </div>
        </div>

        {/* Infographic callout */}
        {infographicUrl && (
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <FileDown className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-slate-700 flex-1">
              Download the official ManageEngine <strong>{framework.name}</strong> compliance infographic
            </p>
            <a
              href={infographicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 shrink-0"
            >
              Download PDF <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {frameworkInsight && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>What this means for you:</strong> {frameworkInsight}
            </p>
          </div>
        )}

        {frameworkScore ? (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700">Maturity Heatmap</h3>
            <p className="mt-1 text-xs text-slate-500">Overall: {frameworkScore.overall} · Band: {frameworkScore.band}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="px-2 py-1 text-left">Control</th>
                    {(frameworkScore.rubric === 'prisma' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5]).map((level) => (
                      <th key={level} className="px-2 py-1 text-center">L{level}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frameworkScore.controls.map((control) => (
                    <tr key={control.controlId} className="border-t border-slate-100">
                      <td className="px-2 py-1 font-medium text-slate-700">{control.controlId}</td>
                      {control.levelBreakdown.map((level) => (
                        <td key={level.level} className="px-2 py-1">
                          <div className={`mx-auto h-5 w-5 rounded ${level.achieved ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {frameworkScore.partialBasisNote ? <p className="mt-2 text-xs text-slate-500">{frameworkScore.partialBasisNote}</p> : null}
          </div>
        ) : null}

        {activeProduct && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 transition-opacity duration-200">
            <span className="text-sm text-blue-800 font-medium flex-1">
              Filtered by <strong>{activeProduct.shortName}</strong> — showing {filtered.length} of {controls.length} controls
            </span>
            <button type="button" onClick={() => setProductFilter('all')} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}

        <div ref={controlsRef} className="space-y-3 scroll-mt-20">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${categoryFilter === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ id: 'all', label: 'All' }, { id: 'in-scope', label: 'IT Scope' }, { id: 'out-scope', label: 'Out of IT Scope' }].map(({ id: filterId, label }) => (
                <button
                  key={filterId}
                  onClick={() => setScopeFilter(filterId)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${scopeFilter === filterId ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {controls.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">
              <p>Controls for <strong>{framework.name}</strong> are coming in a future update.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Showing {filtered.length} of {controls.length} controls</p>
              {filtered.map((control) => (
                <ControlCard
                  key={control.id}
                  control={control}
                  score={controlScoreById.get(control.id)}
                  onAttest={() => navigate('/attestations')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
