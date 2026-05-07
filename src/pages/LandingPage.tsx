import { Link } from 'react-router-dom';
import { Compass, Map, BarChart3, ArrowRight, Shield, CheckCircle, Zap } from 'lucide-react';

const features = [
  {
    icon: Compass,
    title: 'Discover',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description:
      'Answer a quick questionnaire about your industry, data types, and geography. Our Applicability Engine maps your profile to the exact compliance frameworks that apply to your business.',
  },
  {
    icon: Map,
    title: 'Map',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    description:
      'Browse controls for HIPAA, PCI DSS, ISO 27001, and more. See exactly which ManageEngine product — Log360, ADAudit Plus, AD360 — addresses each control requirement.',
  },
  {
    icon: BarChart3,
    title: 'Score',
    color: 'text-green-600',
    bg: 'bg-green-50',
    description:
      'Get a real-time compliance posture score with maturity tier classification, gap analysis, and a prioritized remediation roadmap to reach 100%.',
  },
];

const stats = [
  { label: 'Compliance Frameworks', value: '12+' },
  { label: 'Control Mappings', value: '61+' },
  { label: 'ME Products Mapped', value: '10' },
  { label: 'ME Coverage (HIPAA)', value: '87%' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/40 border border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-medium text-blue-100 mb-6">
            <Zap className="w-4 h-4" />
            Powered by ManageEngine Product Suite
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            ComplianceIQ —<br />
            <span className="text-teal-400">Continuous Compliance</span><br />
            Posture Management
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Know exactly which IT compliance frameworks apply, which ManageEngine products cover them, and your posture score — in minutes, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/wizard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition-all duration-200 border border-white/20"
            >
              <BarChart3 className="w-5 h-5" />
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-blue-700">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Three Steps to Compliance Clarity
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              ComplianceIQ gives you a clear picture of where you stand — and what to do next.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, color, bg, description }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-all duration-200">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frameworks banner */}
      <section className="px-6 py-12 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Frameworks Covered
          </h2>
          <p className="text-slate-500 text-center mb-8">Fully mapped with ManageEngine product coverage</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              'HIPAA', 'PCI DSS v4.0.1', 'SOC 2 Type II', 'NIST CSF 2.0',
              'ISO 27001:2022', 'GDPR', 'CCPA/CPRA', 'SOX ITGCs',
              'NIST 800-171', 'CMMC 2.0', 'FERPA', 'GLBA',
            ].map((fw) => (
              <span
                key={fw}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-default"
              >
                {fw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">
            Know Your Compliance Posture Today
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Takes less than 5 minutes. Get your framework map, control coverage, and compliance score instantly.
          </p>
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg"
          >
            Start the Compliance Wizard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features list */}
      <section className="px-6 py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">What's Included in the MVP</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              '12 Compliance Frameworks with metadata',
              '61 Controls with full ME product mapping',
              'HIPAA & PCI DSS fully mapped (31 controls)',
              'Applicability Engine for your business profile',
              'Compliance Score Dashboard with charts',
              'Maturity Tier Classification (5 levels)',
              'Prioritized Remediation Roadmap',
              'Mock API connection for Log360 & AD360',
              'Responsive design — desktop & mobile',
              'GitHub Pages deployment ready',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
