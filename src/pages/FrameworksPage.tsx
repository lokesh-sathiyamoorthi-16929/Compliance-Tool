import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Wand2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { determineApplicableFrameworks } from '../utils/applicabilityEngine';
import FrameworkCard from '../components/FrameworkCard';

export default function FrameworksPage() {
  const { wizardAnswers } = useAppStore();
  const { mandatory, recommended } = determineApplicableFrameworks(wizardAnswers);
  const totalFrameworks = mandatory.length + recommended.length;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Compliance Frameworks</h1>
            <p className="text-slate-500 mt-1">
              Based on your business profile: {wizardAnswers.industry ?? 'general'} industry,{' '}
              {wizardAnswers.country}
            </p>
          </div>
          <Link to="/wizard" className="btn-secondary">
            <Wand2 className="w-4 h-4" />
            Retake Wizard
          </Link>
        </div>

        {totalFrameworks > 0 && (
          <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>Based on your profile, {totalFrameworks} {totalFrameworks === 1 ? 'framework applies' : 'frameworks apply'} to your organization.</strong>{' '}
              {mandatory.length > 0 && <span>{mandatory.length} {mandatory.length === 1 ? 'is' : 'are'} mandatory</span>}
              {mandatory.length > 0 && recommended.length > 0 && ' and '}
              {recommended.length > 0 && <span>{recommended.length} {recommended.length === 1 ? 'is' : 'are'} strongly recommended</span>}.
            </p>
          </div>
        )}
      </div>

      {mandatory.length === 0 && recommended.length === 0 && (
        <div className="card p-8 text-center">
          <Wand2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No profile yet</h2>
          <p className="text-slate-500 mb-4">Complete the wizard to see your applicable frameworks.</p>
          <Link to="/wizard" className="btn-primary">Start the Wizard</Link>
        </div>
      )}

      {mandatory.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900">Mandatory Frameworks</h2>
            <span className="text-sm font-medium px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
              {mandatory.length} required
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            These frameworks are legally required based on your industry, data types, and geography. Non-compliance carries legal and financial penalties.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mandatory.map((fw) => (
              <FrameworkCard key={fw.id} framework={fw} isMandatory={true} />
            ))}
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Recommended Frameworks</h2>
            <span className="text-sm font-medium px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              {recommended.length} recommended
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            These frameworks are industry best practices recommended for all organizations regardless of industry.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommended.map((fw) => (
              <FrameworkCard key={fw.id} framework={fw} isMandatory={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
