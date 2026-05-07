import { Framework, Control } from '../types';
import { controlsByFrameworkId } from '../data/controls';
import { getProductById } from '../data/manageEngineProducts';

const THEME_KEYWORDS = [
  'access',
  'audit',
  'encrypt',
  'incident',
  'monitor',
  'config',
  'identity',
  'vulnerability',
  'risk',
] as const;

const normalizeTheme = (control: Control): string => {
  const text = `${control.family} ${control.title} ${control.description}`.toLowerCase();
  if (text.includes('audit')) return 'Audit Logging';
  if (text.includes('access') || text.includes('privilege')) return 'Access Control';
  if (text.includes('encrypt') || text.includes('crypt')) return 'Encryption';
  if (text.includes('incident') || text.includes('response')) return 'Incident Response';
  if (text.includes('monitor') || text.includes('detect') || text.includes('analytics')) return 'Monitoring & Detection';
  if (text.includes('config') || text.includes('baseline') || text.includes('patch')) return 'Configuration Management';
  if (text.includes('identity') || text.includes('auth')) return 'Identity & Authentication';
  if (text.includes('vulnerability')) return 'Vulnerability Management';
  if (text.includes('risk')) return 'Risk Assessment';
  return control.family;
};

const themeScore = (controls: Control[]): number =>
  controls.reduce((score, c) => {
    const text = `${c.family} ${c.title}`.toLowerCase();
    return score + THEME_KEYWORDS.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
  }, 0);

export const buildFrameworkSummary = (frameworks: Framework[]) =>
  frameworks.map((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    const productCoverageCounts = new Map<string, number>();
    controls.forEach((control) => {
      control.manageEngineProducts
        .filter((mapping) => mapping.primary)
        .forEach((mapping) => {
          productCoverageCounts.set(mapping.productId, (productCoverageCounts.get(mapping.productId) ?? 0) + 1);
        });
    });
    const topProducts = Array.from(productCoverageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([productId]) => getProductById(productId)?.shortName ?? productId);
    return { framework, totalControls: controls.length, primaryProductCount: productCoverageCounts.size, topProducts };
  });

export const buildThemeOverlap = (frameworks: Framework[]) => {
  const themeMatrix = new Map<string, Record<string, number>>();
  frameworks.forEach((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    controls.forEach((control) => {
      const theme = normalizeTheme(control);
      const row = themeMatrix.get(theme) ?? {};
      row[framework.id] = (row[framework.id] ?? 0) + 1;
      themeMatrix.set(theme, row);
    });
  });
  return Array.from(themeMatrix.entries())
    .map(([theme, matrix]) => ({ theme, matrix, overlapCount: Object.values(matrix).filter((count) => count > 0).length }))
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, 10);
};

export const buildOverlapNarratives = (frameworks: Framework[]) => {
  const summaries = frameworks.map((framework) => ({ framework, controls: controlsByFrameworkId[framework.id] ?? [] }));
  const narratives: string[] = [];
  for (let i = 0; i < summaries.length; i += 1) {
    for (let j = i + 1; j < summaries.length; j += 1) {
      const a = summaries[i];
      const b = summaries[j];
      const aThemes = themeScore(a.controls);
      const bThemes = themeScore(b.controls);
      const aligned = Math.min(aThemes, bThemes);
      narratives.push(`Theme alignment score ${aligned}: ${a.framework.name} and ${b.framework.name} overlap across shared technical requirement themes.`);
    }
  }
  return narratives;
};

export const buildSharedProductCoverage = (frameworks: Framework[]) => {
  const coverageByProduct = new Map<string, Record<string, number>>();
  frameworks.forEach((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    controls.forEach((control) => {
      const productIds = new Set(control.manageEngineProducts.map((m) => m.productId));
      productIds.forEach((productId) => {
        const row = coverageByProduct.get(productId) ?? {};
        row[framework.id] = (row[framework.id] ?? 0) + 1;
        coverageByProduct.set(productId, row);
      });
    });
  });
  const rows = Array.from(coverageByProduct.entries()).map(([productId, matrix]) => ({
    productId,
    productName: getProductById(productId)?.shortName ?? productId,
    total: Object.values(matrix).reduce((sum, value) => sum + value, 0),
    matrix,
  }));
  return rows.sort((a, b) => b.total - a.total);
};

/**
 * Computes overlap percentage:
 * For each theme that appears in MORE THAN ONE selected framework,
 * count those controls as "overlapping". Divide by total controls across all frameworks.
 * Formula: overlappingControls / totalControls * 100
 */
export const computeOverlapPercent = (frameworks: Framework[]): number => {
  if (frameworks.length < 2) return 0;
  const themeMatrix = new Map<string, Record<string, number>>();
  frameworks.forEach((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    controls.forEach((control) => {
      const theme = normalizeTheme(control);
      const row = themeMatrix.get(theme) ?? {};
      row[framework.id] = (row[framework.id] ?? 0) + 1;
      themeMatrix.set(theme, row);
    });
  });
  let totalControls = 0;
  let overlappingControls = 0;
  frameworks.forEach((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    totalControls += controls.length;
    controls.forEach((control) => {
      const theme = normalizeTheme(control);
      const matrix = themeMatrix.get(theme) ?? {};
      const frameworksWithTheme = Object.values(matrix).filter((count) => count > 0).length;
      if (frameworksWithTheme > 1) overlappingControls += 1;
    });
  });
  return totalControls === 0 ? 0 : Math.round((overlappingControls / totalControls) * 100);
};

/**
 * Effort reduction: instead of implementing all controls separately per framework,
 * unique themes represent the actual work items.
 * Returns { total: totalControlCount, unique: uniqueThemeCount }
 */
export const computeEffortReduction = (frameworks: Framework[]): { total: number; unique: number } => {
  const allThemes = new Set<string>();
  let totalControls = 0;
  frameworks.forEach((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    totalControls += controls.length;
    controls.forEach((control) => allThemes.add(normalizeTheme(control)));
  });
  return { total: totalControls, unique: allThemes.size };
};

/**
 * Bundle recommendation: greedy algorithm.
 * Pick the product that covers the most controls across all selected frameworks,
 * remove those controls from consideration, repeat until MAX_BUNDLE_SIZE products or >BUNDLE_COVERAGE_THRESHOLD coverage.
 */
const MAX_BUNDLE_SIZE = 5;
const BUNDLE_COVERAGE_THRESHOLD = 0.8;
export const buildBundleRecommendation = (frameworks: Framework[]): Array<{
  productId: string;
  productName: string;
  shortName: string;
  category: string;
  coverageCount: number;
  frameworkCount: number;
  coveragePercent: number;
  color: string;
  website: string;
}> => {
  // Build a set of (frameworkId, controlId) tuples to cover
  const allControlKeys = new Set<string>();
  const productToKeys = new Map<string, Set<string>>();

  frameworks.forEach((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    controls.forEach((control) => {
      const key = `${framework.id}::${control.id}`;
      allControlKeys.add(key);
      control.manageEngineProducts.forEach((mapping) => {
        const existing = productToKeys.get(mapping.productId) ?? new Set<string>();
        existing.add(key);
        productToKeys.set(mapping.productId, existing);
      });
    });
  });

  const remaining = new Set(allControlKeys);
  const selected: ReturnType<typeof buildBundleRecommendation> = [];
  const totalKeys = allControlKeys.size;

  for (let i = 0; i < MAX_BUNDLE_SIZE && remaining.size > 0; i++) {
    let bestProduct = '';
    let bestCount = 0;

    productToKeys.forEach((keys, productId) => {
      const coveredCount = Array.from(keys).filter((k) => remaining.has(k)).length;
      if (coveredCount > bestCount) {
        bestCount = coveredCount;
        bestProduct = productId;
      }
    });

    if (!bestProduct || bestCount === 0) break;

    const product = getProductById(bestProduct);
    if (!product) break;

    const coveredKeys = productToKeys.get(bestProduct) ?? new Set<string>();
    const coveredFrameworks = new Set(Array.from(coveredKeys).filter((k) => remaining.has(k)).map((k) => k.split('::')[0]));

    selected.push({
      productId: bestProduct,
      productName: product.name,
      shortName: product.shortName,
      category: product.category,
      coverageCount: bestCount,
      frameworkCount: coveredFrameworks.size,
      coveragePercent: Math.round((bestCount / totalKeys) * 100),
      color: product.color,
      website: product.website,
    });

    // Remove covered keys from remaining
    coveredKeys.forEach((k) => remaining.delete(k));

    // Check if coverage threshold reached
    if ((totalKeys - remaining.size) / totalKeys >= BUNDLE_COVERAGE_THRESHOLD) break;
  }

  return selected;
};
