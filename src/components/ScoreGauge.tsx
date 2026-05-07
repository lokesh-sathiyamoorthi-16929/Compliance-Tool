interface Props {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 200 }: Props) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 40) return '#ef4444';
    if (s <= 65) return '#f97316';
    if (s <= 80) return '#eab308';
    if (s <= 94) return '#22c55e';
    return '#3b82f6';
  };

  const color = getColor(score);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
      >
        {/* Background track */}
        <path
          d={`M ${10} ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={16}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${10} ${center} A ${radius} ${radius} 0 0 1 ${size - 10} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
        >
          {score}%
        </text>
        {/* Label */}
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          fontSize={size * 0.07}
          fill="#64748b"
          fontWeight="500"
        >
          Compliance Score
        </text>
      </svg>
    </div>
  );
}
