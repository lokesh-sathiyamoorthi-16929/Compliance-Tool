import { ChangeEvent, useMemo, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import { frameworks } from '../data/frameworks';
import { getControlsByFrameworkId } from '../data/controls';
import { useAppStore } from '../store/useAppStore';
import type { Attestation, Control } from '../types';
import { scoreFramework } from '../engine/scoring';
import { mapEvidenceToControlEvidence } from '../engine/scoring/evidenceMapping';

const MAX_FILE_BYTES = 1024 * 1024;

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function levelLabel(frameworkRubric: 'prisma' | 'cmmi', level: number): string {
  if (frameworkRubric === 'prisma') {
    return ['Policy', 'Process', 'Implemented', 'Measured', 'Managed'][level - 1] ?? `L${level}`;
  }
  return ['Not Performed', 'Performed', 'Planned & Tracked', 'Well-Defined', 'Quantitatively Managed', 'Continuously Improving'][level] ?? `L${level}`;
}

export default function AttestationsPage() {
  const { log360Evidence, attestations, upsertAttestation, clearControlAttestations } = useAppStore();
  const [activeControl, setActiveControl] = useState<Control | null>(null);
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [statement, setStatement] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileData, setFileData] = useState<Attestation['evidenceFile']>();

  const migratedFrameworks = useMemo(
    () => frameworks.filter((framework) => framework.rubric === 'prisma' || framework.rubric === 'cmmi'),
    [],
  );

  const frameworkScores = useMemo(() => {
    const entries = migratedFrameworks.map((framework) => {
      const controlEvidence = mapEvidenceToControlEvidence(framework.id, log360Evidence, attestations);
      const score = scoreFramework(framework.id, controlEvidence);
      return [framework.id, score] as const;
    });
    return new Map(entries);
  }, [attestations, log360Evidence, migratedFrameworks]);

  const controlScoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const score of frameworkScores.values()) {
      score.controls.forEach((control) => {
        map.set(control.controlId, control.achievedLevel);
      });
    }
    return map;
  }, [frameworkScores]);

  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileData(undefined);
      setFileError('');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileData(undefined);
      setFileError('File exceeds 1 MB. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData({
        name: file.name,
        sizeBytes: file.size,
        dataUrl: String(reader.result ?? ''),
      });
      setFileError('');
    };
    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setActiveControl(null);
    setActiveLevel(1);
    setStatement('');
    setFileData(undefined);
    setFileError('');
  };

  const saveAttestation = () => {
    if (!activeControl) return;
    const nowIso = new Date().toISOString();
    const attestation: Attestation = {
      id: crypto.randomUUID(),
      controlId: activeControl.id,
      level: activeLevel,
      statement: statement.trim(),
      attestedAt: nowIso,
      expiresAt: addDays(nowIso, 365),
      evidenceFile: fileData,
    };
    upsertAttestation(attestation);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attestations</h1>
        <p className="mt-1 text-sm text-slate-500">Local attestation store (browser only). Attestations expire after 365 days by default.</p>
      </div>

      {migratedFrameworks.map((framework) => {
        const controls = getControlsByFrameworkId(framework.id);
        const score = frameworkScores.get(framework.id);
        return (
          <section key={framework.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{framework.name}</h2>
                <p className="text-xs text-slate-500">Rubric: {framework.rubric?.toUpperCase()} · Score {typeof score?.overall === 'number' ? score.overall : 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-3">
              {controls.map((control) => {
                const currentLevel = controlScoreById.get(control.id) ?? 0;
                const rows = attestations[control.id] ?? [];
                const rubric = framework.rubric === 'prisma' ? 'prisma' : 'cmmi';
                return (
                  <div key={control.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{control.id} · {control.title}</p>
                        <p className="text-xs text-slate-500">Current level: L{currentLevel} {levelLabel(rubric, currentLevel)}</p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setActiveControl(control);
                              setActiveLevel(level);
                            }}
                          >
                            Attest L{level}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => clearControlAttestations(control.id)}
                          className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    {rows.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {rows.map((row) => (
                          <li key={row.id} className="text-xs text-slate-600">
                            L{row.level} · attested {new Date(row.attestedAt).toLocaleDateString()} · expires {new Date(row.expiresAt).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {activeControl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Attest {activeControl.id} · Level {activeLevel}</h3>
            <p className="mt-1 text-xs text-slate-500">Default expiry is 365 days from attestation time.</p>

            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="attestation-statement">Statement</label>
            <textarea
              id="attestation-statement"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              className="mt-1 h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Describe evidence and scope of this attestation"
            />

            <label className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <FileUp className="h-4 w-4" />
              Upload evidence file (optional)
              <input type="file" data-testid="attestation-file-input" className="hidden" onChange={onSelectFile} />
            </label>
            {fileData ? <p className="mt-1 text-xs text-slate-500">{fileData.name} ({Math.round(fileData.sizeBytes / 1024)} KB)</p> : null}
            {fileError ? <p className="mt-1 text-xs text-red-600">{fileError}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button>
              <button
                type="button"
                onClick={saveAttestation}
                disabled={!statement.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save attestation
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="text-xs text-slate-500">
        <p className="inline-flex items-center gap-1"><Trash2 className="h-3 w-3" />Attestations are stored locally under <code>complianceiq-attestations-v1</code>.</p>
      </div>
    </div>
  );
}
