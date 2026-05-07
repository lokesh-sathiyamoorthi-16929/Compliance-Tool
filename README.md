# ComplianceIQ — Compliance Posture Management Platform

[![Deploy to GitHub Pages](https://github.com/lokesh-sathiyamoorthi-16929/Compliance-Tool/actions/workflows/deploy.yml/badge.svg)](https://github.com/lokesh-sathiyamoorthi-16929/Compliance-Tool/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-ComplianceIQ-2563eb?style=for-the-badge)](https://lokesh-sathiyamoorthi-16929.github.io/Compliance-Tool/)

**ComplianceIQ** is a web-based Compliance Posture Management platform that helps organizations discover which IT compliance frameworks apply to them, map controls to ManageEngine products, and continuously score their compliance posture.

> **Demo Mode:** Runs with mock data and no backend required (this is how the public GitHub Pages deploy runs).

---

## 🔗 Live Demo

https://lokesh-sathiyamoorthi-16929.github.io/Compliance-Tool/

---

## ✨ What's New in V2

- Top-nav-only polished UI (sidebar removed)
- Framework detail product spotlight cards with one-click filtering
- New U.S. government frameworks: CMMC 2.0, NIST 800-171, NIST 800-53 Rev 5, CJIS v5.9, FedRAMP Moderate
- New **Compare Frameworks** page with overlap and shared product analysis
- Real PDF exports (Executive PDF + Auditor Report)
- GitHub Pages deployment hardening (production base path + SPA 404 fallback)

---

## 📸 Screenshots

| Landing Page | Wizard | Dashboard |
|---|---|---|
| _Hero, features, CTA_ | _8-step applicability wizard_ | _Score gauge, charts, remediation_ |

> Screenshots will be added after first deployment.

---

## 🎯 Three Core Modules

| Module | Description |
|--------|-------------|
| 🧭 **Discover** | Multi-step wizard maps your business profile (industry, data types, geography) to applicable compliance frameworks |
| 🗺️ **Map** | Browse controls for each framework — each control mapped to specific ManageEngine products with coverage percentages |
| 📊 **Score** | Real-time compliance score dashboard with maturity tiers, trend charts, and prioritized remediation roadmap |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router v6 | Client-side routing |
| Recharts | Charts and graphs |
| lucide-react | Icons |
| Zustand | State management |

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lokesh-sathiyamoorthi-16929/Compliance-Tool.git
cd Compliance-Tool

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

The development server starts at `http://localhost:5173/Compliance-Tool/`

---

## 🔌 Running with the Backend

Frontend: this repo (`Compliance-Tool`)  
Backend: [`lokesh-sathiyamoorthi-16929/Compliance-Tool-API`](https://github.com/lokesh-sathiyamoorthi-16929/Compliance-Tool-API)

PowerShell quickstart:

```powershell
# Terminal 1 - backend API
git clone https://github.com/lokesh-sathiyamoorthi-16929/Compliance-Tool-API.git
cd Compliance-Tool-API
docker-compose up -d
npm install
npm run dev

# Terminal 2 - frontend
cd ..\Compliance-Tool
copy .env.example .env
npm install
npm run dev
```

The frontend reads `VITE_API_BASE_URL` (default example: `http://localhost:3001`) and will require login before protected pages.

---

## 🧭 Demo Mode vs. Connected Mode

ComplianceIQ now supports two runtime modes:

- **Demo Mode** (default): enabled when `VITE_API_BASE_URL` is unset or `VITE_DEMO_MODE=true`  
  - No backend calls
  - No auth gate
  - Public GitHub Pages deployment uses this mode
- **Connected Mode**: enabled when `VITE_API_BASE_URL` is set and `VITE_DEMO_MODE` is not `true`  
  - Real backend auth (`/auth/login`, `/auth/register`, `/me`, refresh tokens)
  - Protected routes require sign-in
  - Connection indicator shows backend health in the beta banner

---

## 📂 Project Structure

```
Compliance-Tool/
├── .github/workflows/deploy.yml     # GitHub Pages deployment
├── public/favicon.svg               # Shield icon
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Router + routes
│   ├── index.css                    # Tailwind directives + utilities
│   ├── components/
│   │   ├── Layout.tsx               # Top nav + full-width content container
│   │   ├── Navbar.tsx               # Top navigation bar
│   │   ├── ScoreGauge.tsx           # SVG half-circle compliance score gauge
│   │   ├── MaturityBadge.tsx        # Color-coded maturity tier badge
│   │   ├── ControlCard.tsx          # Expandable control card with ME mapping
│   │   ├── FrameworkCard.tsx        # Framework summary card
│   │   ├── MEProductSpotlightCard.tsx # Framework detail product spotlight card
│   │   ├── RemediationItem.tsx      # Prioritized remediation action card
│   │   ├── WizardStep.tsx           # Reusable wizard step wrapper with progress bar
│   │   └── Disclaimer.tsx           # Legal disclaimer footer banner
│   ├── pages/
│   │   ├── LandingPage.tsx          # Hero, features, statistics, CTA
│   │   ├── WizardPage.tsx           # 8-step applicability wizard
│   │   ├── FrameworksPage.tsx       # Mandatory + recommended frameworks
│   │   ├── FrameworkDetailPage.tsx  # Control catalog with filters
│   │   ├── ConnectionsPage.tsx      # Mock Log360 + AD360 connection UI
│   │   ├── DashboardPage.tsx        # Score gauge, charts, remediation
│   │   ├── ComparePage.tsx          # Cross-framework comparison workspace
│   │   └── NotFoundPage.tsx         # 404 page
│   ├── data/
│   │   ├── frameworks.ts            # 15 framework metadata records
│   │   ├── manageEngineProducts.ts  # 10 ME product catalog entries
│   │   ├── industries.ts            # 10 industry options for wizard
│   │   ├── usStates.ts              # All 50 US states + DC
│   │   ├── mockScoreData.ts         # Mock compliance scores for HIPAA + PCI DSS
│   │   └── controls/
│   │       ├── hipaa.ts             # 15 HIPAA controls — fully mapped
│   │       ├── pcidss.ts            # 16 PCI DSS v4.0.1 controls — fully mapped
│   │       ├── soc2.ts              # 10 SOC 2 Type II controls
│   │       ├── nistcsf.ts           # 10 NIST CSF 2.0 controls
│   │       ├── iso27001.ts          # 10 ISO 27001:2022 controls
│   │       ├── cmmc.ts              # 12 CMMC 2.0 representative practices
│   │       ├── nist800171.ts        # 10 NIST 800-171 controls
│   │       ├── nist80053.ts         # 12 NIST 800-53 Rev 5 controls
│   │       ├── cjis.ts              # 10 CJIS v5.9 controls
│   │       └── fedramp.ts           # 10 FedRAMP Moderate controls
│   ├── store/
│   │   └── useAppStore.ts           # Zustand store (wizard, connections, framework)
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces and types
│   └── utils/
│       ├── applicabilityEngine.ts   # Wizard answers → applicable frameworks
│       ├── comparisonEngine.ts      # Cross-framework overlap and bundle logic
│       ├── pdfExport.ts             # Executive and auditor PDF generation
│       └── scoringEngine.ts         # Weighted scoring + maturity tier logic
```

---

## 🔍 Compare Frameworks

The `/compare` page lets teams pick 2–4 frameworks and analyze:

- Side-by-side framework metrics (controls, ME coverage, top products)
- Theme overlap matrix (audit, access, encryption, incident response, etc.)
- Shared ManageEngine product leverage across selected frameworks

This helps identify bundle candidates that maximize compliance coverage.

---

## 🧩 Key Concepts

### Applicability Engine

The `applicabilityEngine.ts` maps wizard answers to frameworks using rule-based logic:

| Rule | Framework |
|------|-----------|
| Industry = Healthcare AND data includes PHI | **HIPAA** (Mandatory) |
| Data includes Payment Card Data | **PCI DSS** (Mandatory) |
| State = CA or customers include CA residents | **CCPA/CPRA** (Mandatory) |
| Customers include EU | **GDPR** (Mandatory) |
| Publicly traded = Yes | **SOX ITGCs** (Mandatory) |
| Industry = Education | **FERPA** (Mandatory) |
| Industry = Government Contractor or CUI data | **NIST 800-171 + CMMC** (Mandatory) |
| Industry = Financial | **GLBA** (Mandatory) |
| Always | **SOC 2, NIST CSF, ISO 27001** (Recommended) |

### Control Catalog

Each control follows a structured interface:

```typescript
interface Control {
  id: string;                   // e.g., "HIPAA-164.312(b)"
  frameworkId: string;
  family: string;               // e.g., "Technical Safeguards"
  title: string;
  description: string;
  category: 'Technical' | 'Administrative' | 'Physical' | 'Organizational';
  required: boolean;
  addressable?: boolean;
  weight: 1 | 2 | 3 | 4 | 5;  // importance weighting
  technicalRequirements: string[];
  manageEngineProducts: {
    productId: string;
    coverage: number;           // 0-100%
    features: string[];
    primary: boolean;
  }[];
  remediationSuggestions: string[];
  referenceUrl?: string;
  inItScope: boolean;
}
```

### Scoring Methodology

```
controlScore   = (passedChecks × weight) / (totalChecks × weight) × 100
familyScore    = weighted average of control scores in the family
frameworkScore = weighted average of family scores
```

### Maturity Tiers

| Score | Tier | Label | Color |
|-------|------|-------|-------|
| 0–40 | Tier 1 | Initial | 🔴 Red |
| 41–65 | Tier 2 | Developing | 🟠 Orange |
| 66–80 | Tier 3 | Defined | 🟡 Yellow |
| 81–94 | Tier 4 | Managed | 🟢 Green |
| 95–100 | Tier 5 | Optimized | 🔵 Blue |

---

## 📊 ManageEngine Products Mapped

| Product | Category | Primary Use Cases |
|---------|----------|-------------------|
| **Log360** | SIEM & Log Management | Audit logs, threat detection, UEBA, HIPAA/PCI DSS reports |
| **ADAudit Plus** | AD Auditing | AD change tracking, logon monitoring, privilege escalation |
| **ADManager Plus** | AD Management | User provisioning, access certification, SoD |
| **AD360** | IAM | MFA, SSO, identity governance, zero-trust |
| **DataSecurity Plus** | Data Security & DLP | PII/PHI discovery, file server DLP, ransomware detection |
| **Endpoint Central** | Endpoint Management | Patch management, MDM, configuration compliance |
| **PAM360** | Privileged Access | Session recording, break-glass access, JIT provisioning |
| **Password Manager Pro** | Secrets Management | Password vault, key rotation, certificate management |
| **Patch Manager Plus** | Patch Management | Automated patching for OS + 850+ third-party apps |
| **Vulnerability Manager Plus** | Vulnerability Management | CVE scanning, risk-based prioritization, remediation |

---

## 🗺️ Roadmap

### ✅ MVP + V2 (Current)
- 15 compliance frameworks with metadata
- HIPAA (15 controls) and PCI DSS v4.0.1 (16 controls) fully mapped to ManageEngine products
- SOC 2 Type II, NIST CSF 2.0, ISO 27001:2022 (10 controls each)
- CMMC 2.0, NIST 800-171, NIST 800-53 Rev 5, CJIS, and FedRAMP control catalogs
- Applicability Wizard with 8 steps
- Mock compliance score dashboard with charts
- Compare Frameworks page
- Executive and auditor PDF exports
- Simulated API connections for Log360 and AD360
- GitHub Pages deployment with SPA routing fallback

### 🔜 Phase 2B
- Real Log360 and AD360 API integration
- Live evidence collection from ManageEngine APIs
- Backend service (Node.js/Python) with PostgreSQL/TimescaleDB
- User authentication and multi-tenancy (MSP support)
- Evidence-based automated scoring
- Continuous monitoring with scheduled assessments
- Slack/Teams/email notifications for score changes

---

## 🌐 Deployment

### GitHub Pages

The included workflow (`.github/workflows/deploy.yml`) automatically deploys to GitHub Pages on push to `main`.

**URL:** `https://lokesh-sathiyamoorthi-16929.github.io/Compliance-Tool/`

### Vercel / Netlify

```bash
npm run build
# Deploy the ./dist directory
```

Set the base URL in `vite.config.ts`:
```typescript
base: '/'  // Change from '/Compliance-Tool/' for Vercel/Netlify
```

---

## ⚖️ Legal Disclaimer

ComplianceIQ is a demonstration tool providing general compliance guidance based on publicly available regulatory frameworks and standards. **This is not legal advice.** Compliance determinations, particularly for regulated industries (healthcare, financial services, government contracting), should be reviewed by qualified legal counsel and certified compliance professionals (CISA, CRISC, CISSP, CPA).

All compliance scores, assessments, and data shown in this MVP are based on mock data for demonstration purposes. No actual API connections or real compliance assessments are performed.

ManageEngine is a registered trademark of ZOHO Corporation. This tool is an independent demonstration platform and is not officially affiliated with or endorsed by ZOHO Corporation or ManageEngine.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built with ❤️ for the IT compliance community.*
