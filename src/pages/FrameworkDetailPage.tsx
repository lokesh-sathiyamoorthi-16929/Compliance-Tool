import { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plug, Filter, ShoppingCart, Info, ChevronDown, ChevronUp,
  ScrollText, UserCheck, Users, Network, Shield, Monitor, Key, Package2, X,
} from 'lucide-react';
import { getFrameworkById } from '../data/frameworks';
import { getControlsByFrameworkId } from '../data/controls';
import { getProductById } from '../data/manageEngineProducts';
import ControlCard from '../components/ControlCard';
import NotFoundPage from './NotFoundPage';

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

const BUNDLE_STYLES: Record<string, { badge: string; bar: string }> = {
  essential: { badge: 'bg-blue-600 text-white', bar: 'bg-blue-600' },
  recommended: { badge: 'bg-teal-500 text-white', bar: 'bg-teal-500' },
  complementary: { badge: 'bg-slate-400 text-white', bar: 'bg-slate-400' },
};

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

export default function FrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const framework = getFrameworkById(id ?? '');
  const controls = getControlsByFrameworkId(id ?? '');

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  if (!framework) return <NotFoundPage />;

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

  const visibleSpotlights = showAllProducts ? productSpotlights : productSpotlights.slice(0, 6);

  const applyProductFilter = (productId: string) => {
    setProductFilter(productId === productFilter ? 'all' : productId);
    controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeProduct = productFilter !== 'all' ? getProductById(productFilter) : null;
  const frameworkInsight = FRAMEWORK_INSIGHT[id ?? ''] ?? null;

  const LeftRailContent = (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <ShoppingCart className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-semibold text-slate-800 text-sm">Recommended Products</span>
        <div className="relative group ml-auto">
          <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
          <div className="absolute right-0 top-5 w-52 bg-slate-900 text-white text-xs rounded-lg p-2.5 invisible group-hover:visible z-10 shadow-lg">
            ManageEngine products that cover this framework's controls. Click any product to filter the controls list.
          </div>
        </div>
      </div>

      {productFilter !== 'all' && (
        <button type="button" onClick={() => setProductFilter('all')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          <X className="w-3 h-3" />
          Clear filter
        </button>
      )}

      {visibleSpotlights.map((spotlight) => {
        const ProductIcon = PRODUCT_ICONS[spotlight.product.id] ?? Package2;
        const bundleStyle = BUNDLE_STYLES[spotlight.bundle];
        const isActive = productFilter === spotlight.product.id;

        return (
          <div
            key={spotlight.product.id}
            className={`relative rounded-lg border cursor-pointer transition-all duration-150 overflow-hidden ${isActive ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'}`}
            onClick={() => applyProductFilter(spotlight.product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && applyProductFilter(spotlight.product.id)}
            aria-pressed={isActive}
          >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg" />}
            <div className={`p-3 ${isActive ? 'pl-4' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <ProductIcon className="w-4 h-4 shrink-0" style={{ color: spotlight.product.color }} />
                <span className="text-xs font-bold text-slate-900 leading-tight flex-1 min-w-0 truncate">{spotlight.product.shortName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${bundleStyle.badge}`}>
                  {spotlight.bundle[0].toUpperCase() + spotlight.bundle.slice(1)}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">
                Covers <span className="text-blue-700">{spotlight.coveredControls} / {spotlight.totalControls}</span> controls
              </p>
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>Avg coverage</span>
                  <span>{spotlight.averageCoverage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${bundleStyle.bar}`} style={{ width: `${spotlight.averageCoverage}%` }} />
                </div>
              </div>
              <a
                href={spotlight.product.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
              >
                Open product page ↗
              </a>
            </div>
          </div>
        );
      })}

      {productSpotlights.length > 6 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowAllProducts((prev) => !prev); }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 w-full text-left"
        >
          {showAllProducts ? '↑ Show fewer' : `Show all ${productSpotlights.length} products`}
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:flex lg:gap-0 -mx-4 lg:-mx-8">
      {/* LEFT RAIL (desktop only) */}
      {productSpotlights.length > 0 && (
        <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200 bg-slate-50">
          <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {LeftRailContent}
          </div>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 space-y-5 px-4 lg:px-8 py-6">
        <Link to="/frameworks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Frameworks
        </Link>

        {/* Mobile accordion rail */}
        {productSpotlights.length > 0 && (
          <div className="lg:hidden card overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-800"
              onClick={() => setRailOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                Recommended ManageEngine Products · {productSpotlights.length} essential
              </span>
              {railOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {railOpen && <div className="border-t border-slate-200 bg-slate-50">{LeftRailContent}</div>}
          </div>
        )}

        {/* Framework header card */}
        <div className="card p-6" style={{ borderTop: `4px solid ${framework.color}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{framework.fullName}</h1>
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
              </div>
            </div>
            <Link to="/connections" className="btn-primary shrink-0">
              <Plug className="w-4 h-4" />
              Connect & Score
            </Link>
          </div>
        </div>

        {/* "What this means for you" banner */}
        {frameworkInsight && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>What this means for you:</strong> {frameworkInsight}
            </p>
          </div>
        )}

        {/* Active product filter banner */}
        {activeProduct && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-blue-800 font-medium flex-1">
              Filtered by <strong>{activeProduct.shortName}</strong> — showing {filtered.length} of {controls.length} controls
            </span>
            <button type="button" onClick={() => setProductFilter('all')} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}

        {/* Filters + controls */}
        <div ref={controlsRef} className="space-y-3">
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
                <ControlCard key={control.id} control={control} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
