export default function Disclaimer() {
  return (
    <div className="bg-slate-100 border-t border-slate-200 px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          ComplianceIQ — Informational Tool, Not Legal Advice
        </h3>
        <div className="text-xs text-slate-500 leading-relaxed space-y-2">
          <p>
            ComplianceIQ is provided for informational and evaluation purposes only. It is not a
            substitute for professional legal, regulatory, or compliance advice.
          </p>
          <p>
            The compliance frameworks, controls, mappings, and ManageEngine product associations
            shown in this tool are interpretations based on publicly available standards
            documentation and product information. They have not been independently validated by
            certified auditors, regulators, or the relevant standards bodies. Coverage percentages,
            applicability rules, and posture scores are estimates and may contain inaccuracies.
          </p>
          <p>
            Customers remain solely responsible for determining and meeting their compliance
            obligations. Always consult qualified legal counsel, compliance officers, and certified
            auditors (e.g., HIPAA-certified consultants, PCI QSAs, CMMC Registered Practitioners,
            ISO 27001 lead auditors) before making compliance decisions.
          </p>
          <p>
            ManageEngine product mappings are illustrative and reflect general product capabilities.
            Specific implementations and supported features should be confirmed with ManageEngine
            sales/product teams and your internal IT team.
          </p>
          <p>
            © 2026 ManageEngine — A division of Zoho Corporation. ComplianceIQ is a
            research/preview product and is not yet a generally available offering.
          </p>
        </div>
      </div>
    </div>
  );
}
