import { ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  stepNumber: number;
  totalSteps: number;
  completed?: boolean;
}

export default function WizardStep({
  title,
  description,
  children,
  stepNumber,
  totalSteps,
  completed = false,
}: Props) {
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">
            Step {stepNumber} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-blue-600">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
            completed
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {completed ? <CheckCircle className="w-5 h-5" /> : stepNumber}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 text-sm mt-0.5">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
