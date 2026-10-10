# MediSense - Diabetes Screening Follow-Up Prioritization Platform

MediSense is a full-stack clinical screening follow-up prioritization healthcare application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and a **Python / scikit-learn Machine Learning engine**. It enables clinical staff at partner hospitals (e.g., **HexaClinic**) to upload patient screening workbooks (~700 records), run leakage-safe ML prioritization scoring, review individualized non-diagnostic nurse discussion prompts and patient follow-up emails, and execute controlled, auditable bulk email communications.

---

> [!IMPORTANT]
> **Clinical Disclaimer**: "MediSense provides research-based screening follow-up prioritization, not a diagnosis. Scores depend on data quality and model limitations. Verify measurements and follow clinic protocol. Clinical decisions remain with qualified healthcare professionals."

---

## Key Features

1. **Machine Learning Pipeline (`ml/`)**:
   - Trained on the benchmark **Pima Indians Diabetes Dataset** (768 records, 8 clinical predictors, binary `Outcome`).
   - Leakage-safe preprocessing: replaces physiological zeros in `Glucose`, `BMI`, `BloodPressure`, `SkinThickness`, and `Insulin` with `NaN`, imputing medians fitted **strictly on training folds** during 5-Fold Stratified Cross-Validation.
   - Evaluated models: **Random Forest Classifier** (150 trees, ROC-AUC ~0.84, Brier Calibration ~0.168) and **Logistic Regression**.
   - Serialized artifacts saved in `ml/saved_models/`: `production_model.joblib`, `preprocessor.joblib`, `evaluation_report.json`, and `model_card.json`.
   - Strictly excludes `Outcome`, `PatientID`, and `PatientEmail` from predictor features.

2. **Excel Upload & Ingestion (`/upload`)**:
   - Ingests `.xlsx` files containing ~700 records.
   - Required columns: `PatientID`, `Pregnancies`, `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, `BMI`, `DiabetesPedigreeFunction`, `Age`, `PatientEmail`, and `HospitalName`.
   - Enforces single consistent `HospitalName` per workbook (e.g. `HexaClinic`).
   - Real-time pre-validation preview, RFC email syntax checking, duplicate detection, and missing/zero measurement warnings.
   - Downloadable standardized template (`/api/template`) and 1-click **700-record HexaClinic demo cohort loader**.

3. **Deterministic Prioritization & Worklist (`/worklist`)**:
   - Scores eligible uploaded records using real Python ML model probabilities.
   - Deterministic tie-breaking: `Model Score` DESC &rarr; `Age` DESC &rarr; `PatientID` ASC.
   - Filters by risk tier (`High Priority`, `Moderate Priority`, `Standard Follow-Up`), data quality status, and search parameters.
   - Expandable detail view displaying physiological predictors, nurse discussion prompts, and patient email previews.
   - Export Top 100, nurse prompts, patient messages, and delivery statuses to Excel (`.xlsx`).

4. **Individualized Non-Diagnostic Communication Engine**:
   - **Nurse Discussion Prompt**: Concise, tailored to recorded predictors and data quality flags. Directs nurse to review fasting status, lifestyle, and arrange physician consultation.
   - **Patient-Facing Email**: Warm, non-diagnostic invitation to schedule a routine consultation with a doctor at `HexaClinic`. Never reveals scores, diagnoses, or internal model labels.

5. **Automated Email Dispatch & Approval Workflow (`/email-review`)**:
   - Two-step clinical staff approval workflow before bulk dispatch.
   - Displays sender display name as `HospitalName` (e.g. `HexaClinic`).
   - Multi-mode support: **Preview / Test Sandbox Mode** or **Live Provider Delivery** (Resend / SMTP via environment variables).
   - Rate limiting (staggered queue ~5 emails/sec), exponential backoff retries, duplicate-send prevention, and masked email logs (`p***@domain.com`).

6. **Authentication & Audit Trail (`/settings`)**:
   - Pre-configured login credentials:
     - **Username**: `trashika`
     - **Password**: `trash#123`
   - Encrypted HTTP-only session cookies with `CLINICAL_TRIAGE_LEAD` role permissions.
   - Immutable audit logging tracking logins, uploads, scoring executions, batch approvals, email dispatches, and settings updates.

---

## Technical Architecture

```
MediSense/
├── ml/
│   ├── data/                  # Pima Indians Diabetes Dataset (768 records)
│   ├── saved_models/          # Model artifacts, evaluation report, & model card
│   ├── download_or_create_pima.py
│   ├── preprocessor.py        # LeakageSafePreprocessor (NaN replacement + median imputer)
│   ├── train.py               # Model training & stratified cross-validation
│   ├── infer.py               # Batch inference engine & tie-breaker
│   └── test_model.py          # ML unit & data leakage tests
├── src/
│   ├── app/                   # Next.js App Router (Overview, Upload, Worklist, Quality, Model, Email, Settings)
│   ├── components/            # Navbar, ClinicalDisclaimer
│   └── lib/                   # Types, Auth, Excel Validator, Scoring, Messages, Email Service, Store
├── public/
├── package.json
└── tailwind.config.ts
```

---

## Quick Start & Local Execution

### 1. Prerequisites
- **Node.js**: v18+ & **npm**: v9+
- **Python**: 3.10+ (with `numpy`, `pandas`, `scikit-learn`, `joblib`, `openpyxl`)

### 2. Install Dependencies & Run ML Training
```bash
# Install Python packages
py -m pip install numpy pandas scikit-learn openpyxl joblib

# Fetch dataset & train models
py ml/download_or_create_pima.py
py ml/train.py

# Run ML unit tests
py ml/test_model.py
```

### 3. Run Web Application
```bash
# Install Node dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Pre-Configured Staff Login
- **Username**: `trashika`
- **Password**: `trash#123`
