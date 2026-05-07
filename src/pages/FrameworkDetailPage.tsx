import { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plug, Filter } from 'lucide-react';
import { getFrameworkById } from '../data/frameworks';
import { getControlsByFrameworkId } from '../data/controls';
import { getProductById } from '../data/manageEngineProducts';
import ControlCard from '../components/ControlCard';
import MEProductSpotlightCard from '../components/MEProductSpotlightCard';
import NotFoundPage from './NotFoundPage';

export default function FrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const framework = getFrameworkById(id ?? '');
  const controls = getControlsByFrameworkId(id ?? '');

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [showAllProducts, setShowAllProducts] = useState(false);
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

        return {
          product,
          coveredControls: stats.coveredControls,
          totalControls: controls.length,
          averageCoverage,
          bundle,
        } as const;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (b.coveredControls !== a.coveredControls) {
          return b.coveredControls - a.coveredControls;
        }

        return b.averageCoverage - a.averageCoverage;
      });
  }, [controls]);

  const filtered = controls.filter((c) => {
    const catMatch = categoryFilter === 'all' || c.category === categoryFilter;
    const scopeMatch =
      scopeFilter === 'all' ||
      (scopeFilter === 'in-scope' && c.inItScope) ||
      (scopeFilter === 'out-scope' && !c.inItScope);
    const productMatch =
      productFilter === 'all' || c.manageEngineProducts.some((m) => m.productId === productFilter);

    return catMatch && scopeMatch && productMatch;
  });

  const avgCoverage =
    controls.length === 0
      ? 0
      : Math.round(
          controls.reduce(
            (sum, c) =>
              sum +
              c.manageEngineProducts.reduce((s, m) => s + (m.primary ? m.coverage : 0), 0),
            0
          ) / controls.length
        );

  const visibleSpotlights = showAllProducts ? productSpotlights : productSpotlights.slice(0, 6);

  const applyProductFilter = (productId: string) => {
    setProductFilter(productId);
    controlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <Link
        to="/frameworks"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Frameworks
      </Link>

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
                <p className="text-2xl font-bold" style={{ color: framework.color }}>
                  {framework.meCoveragePercent}%
                </p>
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

      {productSpotlights.length > 0 && (
        <section className="card p-6">
          <h2 className="text-xl font-bold text-slate-900">
            �� Recommended ManageEngine Products for {framework.name}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            {visibleSpotlights.map((spotlight) => (
              <MEProductSpotlightCard
                key={spotlight.product.id}
                spotlight={spotlight}
                onFilter={() => applyProductFilter(spotlight.product.id)}
              />
            ))}
          </div>
          {productSpotlights.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllProducts((prev) => !prev)}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {showAllProducts ? 'Show top products only' : 'Show all products'}
            </button>
          )}
        </section>
      )}

      <div ref={controlsRef} className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'in-scope', label: 'IT Scope' },
              { id: 'out-scope', label: 'Out of IT Scope' },
            ].map(({ id: filterId, label }) => (
              <button
                key={filterId}
                onClick={() => setScopeFilter(filterId)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  scopeFilter === filterId
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {productFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setProductFilter('all')}
              className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200"
            >
              Clear product filter
            </button>
          )}
        </div>

        {controls.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <p>
              Controls for <strong>{framework.name}</strong> are coming in a future update.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Showing {filtered.length} of {controls.length} controls
            </p>
            {filtered.map((control) => (
              <ControlCard key={control.id} control={control} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
