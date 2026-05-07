import { ArrowUpRight, Package2 } from 'lucide-react';
import { MEProduct } from '../types';

interface ProductSpotlight {
  product: MEProduct;
  coveredControls: number;
  totalControls: number;
  averageCoverage: number;
  bundle: 'essential' | 'recommended' | 'complementary';
}

interface Props {
  spotlight: ProductSpotlight;
  onFilter: () => void;
}

const bundleClasses: Record<ProductSpotlight['bundle'], string> = {
  essential: 'bg-green-50 text-green-700 border-green-200',
  recommended: 'bg-blue-50 text-blue-700 border-blue-200',
  complementary: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function MEProductSpotlightCard({ spotlight, onFilter }: Props) {
  const { product, coveredControls, totalControls, averageCoverage, bundle } = spotlight;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package2 className="w-4 h-4" style={{ color: product.color }} />
            <h3 className="font-semibold text-slate-900">{product.name}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{product.category}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${bundleClasses[bundle]}`}>
          {bundle[0].toUpperCase() + bundle.slice(1)}
        </span>
      </div>

      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{product.description}</p>

      <p className="mt-3 text-lg font-bold text-slate-900">
        Covers <span className="text-blue-700">{coveredControls} / {totalControls}</span> controls
      </p>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Average Coverage</span>
          <span>{averageCoverage}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${averageCoverage}%`, backgroundColor: product.color }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onFilter} className="btn-secondary text-xs px-3 py-1.5">
          Filter controls by this product
        </button>
        <a
          href={product.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View product page
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
