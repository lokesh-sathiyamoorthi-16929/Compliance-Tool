# AD360 Control Mapping (ComplianceIQ)

| Control | Rule |
|---|---|
| HIPAA 164.308(a)(3)(ii)(C) — Termination procedures | L3 if stale-accounts-with-enabled-status ≤ 5 |
| HIPAA 164.308(a)(4) — Information access management | L3 if privileged-user count ≤ 10 AND every priv user has manager + recent logon |
| HIPAA 164.308(a)(5)(ii)(D) — Login monitoring | L3 if BAD_PASSWORD_COUNT spike < threshold (combined with Log360 audit if available) |
| HIPAA 164.310(d)(1) — Device & media controls | L3 if BitLocker-enabled % ≥ 90 |
| HIPAA 164.312(d) — Person/entity authentication | L3 if `SMART_CARD_FOR_INTERACTIVE_LOGIN` % among privileged users ≥ 50, otherwise L2 |
| ISO A.5.15 — Access control | L3 if privileged-user count ≤ 10 |
| ISO A.5.16 — Identity management | L3 if zero `PWD_NEV_EXP_FLAG=true` users with `ACCOUNT_STATUS=Enabled` |
| ISO A.5.18 — Access rights | L3 if every privileged group has `MANAGER` set |
| ISO A.8.7 — Protection against malware | L2 (BitLocker is partial proxy; explicit malware tooling needed for L3) |
