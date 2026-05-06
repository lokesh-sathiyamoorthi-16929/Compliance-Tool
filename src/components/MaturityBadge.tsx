import { getMaturityTier } from '../utils/scoringEngine';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function MaturityBadge({ score, size = 'md' }: Props) {
  const tier = getMaturityTier(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: tier.color + '20',
        color: tier.color,
        border: `1px solid ${tier.color}40`,
      }}
    >
      Tier {tier.tier} — {tier.label}
    </span>
  );
}
