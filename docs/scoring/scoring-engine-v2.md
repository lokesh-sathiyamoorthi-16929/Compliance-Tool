# Scoring Engine v2

## Why we changed scoring

The previous flat 4-metric model was useful operationally, but it did not map cleanly to auditor maturity expectations for HIPAA and ISO 27001. Scoring Engine v2 adds framework-specific maturity rubrics:

- HIPAA uses HITRUST PRISMA-style 5-level maturity weighting
- ISO 27001:2022 uses CMMI 0-5 maturity levels aligned to Annex A themes

References:
- HITRUST PRISMA maturity model guidance
- ISO/IEC 27001:2022 Annex A control structure
- ISO/IEC 21827 (CMMI/SPICE lineage)

## PRISMA scoring (HIPAA)

Per control:
- L1 Policy: 15
- L2 Process: 20
- L3 Implemented: 40
- L4 Measured: 10
- L5 Managed: 15

Required controls missing L3 are hard fails (`hardFail=true`, score forced to 0). Addressable controls can satisfy L3 with a documented justification attestation.

Worked example:
- Policy + Process + Implemented only ⇒ 75
- All levels achieved ⇒ 100
- Required control with no implemented evidence ⇒ 0 and hard fail

## CMMI scoring (ISO 27001)

Per control maturity:
- L0 Not Performed
- L1 Performed Informally
- L2 Planned & Tracked
- L3 Well-Defined
- L4 Quantitatively Managed
- L5 Continuously Improving

Normalization: `(level / 5) * 100`

Worked example:
- L3 control ⇒ 60 normalized
- L5 control ⇒ 100 normalized

Aggregation is by Annex A themes (Organizational, People, Physical, Technological), then equal-weight average across themes.

## Evidence sources

Automated maturity evidence comes from existing Log360 telemetry in `log360Evidence` (log sources, alerts, incidents, report sampling). Human-only maturity claims (policy/process/measurement/managed) are provided via attestations.

## Attestations

Attestations are explicit user assertions used where APIs cannot prove maturity depth (policy, process, measured, managed). Current implementation is browser-local only:

- Zustand slice in `useAppStore.attestations`
- localStorage key: `complianceiq-attestations-v1`
- default expiry: `attestedAt + 365 days`
- optional evidence file stored as data URL with 1 MB cap warning

Future phases will move attestations to backend multi-user storage.

## Frameworks not yet migrated

Still on `rubric: "legacy"`:
- PCI DSS
- SOC 2
- NIST CSF
- GDPR

Roadmap: migrate additional frameworks in follow-up PRs once rubric-specific mappings are finalized.
