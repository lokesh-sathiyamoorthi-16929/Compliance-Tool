import type { Evidence } from '../../services/evidenceCollector';
import type { Attestation, Control } from '../../types';
import { getControlsByFrameworkId } from '../../data/controls';
import type { ControlEvidence } from './types';

function isAttestationActive(attestation: Attestation, nowIso: string): boolean {
  return new Date(attestation.expiresAt).getTime() >= new Date(nowIso).getTime();
}

function getAutomatedStatus(control: Control, evidence: Evidence | null): 'success' | 'failed' | 'unavailable' {
  if (!evidence) return 'unavailable';

  const hasTelemetry =
    evidence.logSources.count > 0 ||
    evidence.alerts.total > 0 ||
    evidence.incidents.total > 0 ||
    Object.keys(evidence.recentReportSamples).length > 0;

  if (!hasTelemetry) return 'failed';

  // Heuristic fallback for controls without explicit endpoint-to-control mappings yet.
  const controlText = `${control.id} ${control.title}`.toLowerCase();
  if (controlText.includes('audit') || controlText.includes('log')) {
    return evidence.logSources.count > 0 ? 'success' : 'failed';
  }
  if (controlText.includes('incident') || controlText.includes('response')) {
    return evidence.incidents.total > 0 || evidence.alerts.total > 0 ? 'success' : 'failed';
  }
  if (controlText.includes('access') || controlText.includes('auth')) {
    return Object.keys(evidence.recentReportSamples).length > 0 ? 'success' : 'failed';
  }

  return 'success';
}

export function mapEvidenceToControlEvidence(
  frameworkId: string,
  evidence: Evidence | null,
  attestations: Record<string, Attestation[]> = {},
  nowIso: string = new Date().toISOString(),
): ControlEvidence[] {
  const controls = getControlsByFrameworkId(frameworkId);

  return controls.map((control) => {
    const activeAttestations = (attestations[control.id] ?? []).filter((attestation) =>
      isAttestationActive(attestation, nowIso),
    );

    return {
      controlId: control.id,
      automated: [
        {
          source: 'log360',
          raw: evidence,
          status: getAutomatedStatus(control, evidence),
          collectedAt: evidence?.collectedAt ?? nowIso,
        },
      ],
      attestations: activeAttestations,
    };
  });
}

export function hasActiveAttestation(
  controlEvidence: ControlEvidence,
  level: number,
  nowIso: string = new Date().toISOString(),
): boolean {
  return controlEvidence.attestations.some(
    (attestation) => attestation.level === level && new Date(attestation.expiresAt).getTime() >= new Date(nowIso).getTime(),
  );
}
