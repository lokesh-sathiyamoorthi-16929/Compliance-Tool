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

const themeScore = (controls: Control[]): number => {
  return controls.reduce((score, c) => {
    const text = `${c.family} ${c.title}`.toLowerCase();
    return (
      score +
      THEME_KEYWORDS.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0)
    );
  }, 0);
};

export const buildFrameworkSummary = (frameworks: Framework[]) => {
  return frameworks.map((framework) => {
    const controls = controlsByFrameworkId[framework.id] ?? [];
    const productCoverageCounts = new Map<string, number>();

    controls.forEach((control) => {
      control.manageEngineProducts
        .filter((mapping) => mapping.primary)
        .forEach((mapping) => {
          productCoverageCounts.set(
            mapping.productId,
            (productCoverageCounts.get(mapping.productId) ?? 0) + 1
          );
        });
    });

    const topProducts = Array.from(productCoverageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([productId]) => getProductById(productId)?.shortName ?? productId);

    return {
      framework,
      totalControls: controls.length,
      primaryProductCount: productCoverageCounts.size,
      topProducts,
    };
  });
};

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
    .map(([theme, matrix]) => ({
      theme,
      matrix,
      overlapCount: Object.values(matrix).filter((count) => count > 0).length,
    }))
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, 10);
};

export const buildOverlapNarratives = (frameworks: Framework[]) => {
  const summaries = frameworks.map((framework) => ({
    framework,
    controls: controlsByFrameworkId[framework.id] ?? [],
  }));

  const narratives: string[] = [];

  for (let i = 0; i < summaries.length; i += 1) {
    for (let j = i + 1; j < summaries.length; j += 1) {
      const a = summaries[i];
      const b = summaries[j];
      const aThemes = themeScore(a.controls);
      const bThemes = themeScore(b.controls);
      const aligned = Math.min(aThemes, bThemes);
      narratives.push(
        `Theme alignment score ${aligned}: ${a.framework.name} and ${b.framework.name} overlap across shared technical requirement themes.`
      );
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

  const rows = Array.from(coverageByProduct.entries()).map(([productId, matrix]) => {
    const total = Object.values(matrix).reduce((sum, value) => sum + value, 0);
    return {
      productId,
      productName: getProductById(productId)?.shortName ?? productId,
      total,
      matrix,
    };
  });

  return rows.sort((a, b) => b.total - a.total);
};
