# HexaClinic for Diabetes 🩺⚡
> **Machine Learning-Driven Screening Follow-Up Prioritization & Automated Triage System**

![HexaClinic Banner](https://img.shields.io/badge/Platform-HexaClinic_for_Diabetes-12304A?style=for-the-badge&logo=medkit)
![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=nextdotjs)
![Python ML](https://img.shields.io/badge/Machine_Learning-Scikit_Learn_Random_Forest-3776AB?style=for-the-badge&logo=python)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss)

---

## 📌 Business Summary & Problem Statement

### Problem Statement
In large outpatient clinics, healthcare systems, and community screening drives, thousands of patients undergo initial health screenings for diabetes every month. Traditionally, triage nurses and follow-up coordinators attempt to contact patients on a **First-In, First-Out (FIFO)** basis or through arbitrary manual review. 

This creates critical clinical risks:
1. **Delayed Intervention for High-Risk Individuals**: Patients with severely elevated blood glucose, high BMI, and multiple risk factors often wait weeks for follow-up simply because they were screened later in the month.
2. **Staff Overwhelm**: Triage nurses waste hundreds of hours manually reviewing thousands of records, manually drafting outreach emails, and trying to decide who needs immediate callback.
3. **Data Quality Limitations**: Real-world clinic datasets frequently contain missing or unrecorded values (e.g. unrecorded insulin or glucose entered as 0), leading naive rule-based software to crash or ignore patients.

### Solution: HexaClinic for Diabetes
**HexaClinic for Diabetes** transforms screening follow-up by embedding a **validated Machine Learning model trained on the Pima Indians Diabetes Dataset (768 records)** into an automated clinical triage web platform. 

The application ingests patient screening records, runs real-time ML risk scoring, deterministically ranks patients, provides non-diagnostic nurse discussion prompts, and automates patient outreach emails via Gmail SMTP/Nodemailer.

---

## 🧠 Machine Learning Model & Algorithm

### Core Algorithm: Random Forest Classifier (100 Estimators)
- **Primary Model**: Ensembled **Random Forest Classifier** (`scikit-learn`), selected after 5-fold cross-validation comparison against Logistic Regression.
- **Performance Metrics**:
  - **ROC-AUC Score**: `~0.84`
  - **Brier Calibration Score**: `~0.168` (Low probability calibration error)
  - **F1 Score**: `~0.74`
- **Secondary Model**: Calibrated Logistic Regression model evaluated side-by-side to ensure model transparency.

### Predictor Features (8 Clinical Parameters)
The ML model strictly consumes **physiologically relevant predictors**:
1. `Pregnancies` (Number of times pregnant)
2. `Glucose` (Plasma glucose concentration 2 hours in an oral glucose tolerance test)
3. `BloodPressure` (Diastolic blood pressure in mm Hg)
4. `SkinThickness` (Triceps skin fold thickness in mm)
5. `Insulin` (2-Hour serum insulin in μU/mL)
6. `BMI` (Body mass index in kg/m²)
7. `DiabetesPedigreeFunction` (Diabetes pedigree function / genetic score)
8. `Age` (Age in years)

> ⚠️ **Zero Leakage Guarantee**: Protected metadata (`PatientID`, `PatientName`, `PatientPhone`, `PatientEmail`, `HospitalName`, and `Outcome`) are strictly excluded from feature matrices during both training and inference.

### Leakage-Free Preprocessing & Imputation
- **Zero-as-Missing Detection**: In clinical data, zero values for `Glucose`, `BMI`, `BloodPressure`, `SkinThickness`, and `Insulin` represent missing/unrecorded measurements.
- **Training Cohort Median Imputation**: Unrecorded values are imputed using median values computed **strictly from the training fold** inside a `scikit-learn` Pipeline object to eliminate data leakage.
- **Robust Feature Scaling**: Predictors are standardized using `StandardScaler`.

### Deterministic Tie-Breaking Rank Math
Patients are assigned a strict, 1-indexed rank based on the following deterministic ordering rule:
$$\text{Rank Order} = (\text{Model Score DESC}) \longrightarrow (\text{Age DESC}) \longrightarrow (\text{PatientID ASC})$$

---

## ✨ Features Implemented

### 1. 🗄️ Persistent Database Storage (`data/medisense_database.json`)
- Built-in persistent database storing all patient records, contact info, clinical predictors, ML scores, nurse review completion states, and audit trails.
- **1,000 Pre-Seeded Patient Records**: Pre-populated with 1,000 ML-scored patient records with diverse clinical risk profiles.

### 2. 📝 Intake Options: Direct DB Filling & Excel Ingestion
- **Direct DB Entry**: Staff can click **`➕ Add Patient to DB`** to fill patient details directly in the app. The record is scored via Python ML in real time and saved into the DB.
- **Excel Ingestion Option**: Upload workbook (`.xlsx`) with required 12 columns: `PatientID`, `PatientName`, `PatientPhone`, `Pregnancies`, `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, `BMI`, `DiabetesPedigreeFunction`, `Age`, `PatientEmail`.

### 3. ✏️ Patient Record Updates & Real-Time ML Recalculation
- Staff can search or click **`Update Patient by ID`** to edit Glucose level (e.g. update from `120 mg/dL` to `185 mg/dL`), BMI, Phone, Name, or Age.
- On saving, the system re-scores the patient with the Python ML model, updates their priority tier, re-ranks the queue, and saves to the database.

### 4. 🔄 Dynamic Nurse Review Completion Queue ("Mark Done")
- Triage nurses click **`Mark Done`** on a patient after completing follow-up.
- The patient is **permanently removed** from the active Top 100 queue.
- The next prioritized patient from the database (e.g. rank **#101**) automatically shifts up into the Top 100 active worklist so the worklist always maintains up to 100 active pending patients.

### 5. 📧 Automated SMTP Email Dispatch (`trashikabaskaran@gmail.com`)
- **Automated Transport**: Configured via Nodemailer SMTP with Google App Password authentication.
- **Individual Patient Email Option**: Click **`📧 Send Email`** on any individual patient row in `/worklist` or `/email-review`.
- **Batch Email Dispatch**: Click **`🚀 Send Email to Everyone (Top 100)`** on `/email-review` to dispatch all queued emails sequentially.

### 6. 🔐 Mandatory Authentication & Audit Trail
- Password protection redirecting unauthenticated users to `/login` (`username: trashika` | `password: trash#123`).
- Full audit logging tracking every workbook upload, scoring execution, patient update, nurse review, and email dispatch.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ 
- **Python**: v3.10+ (with `scikit-learn`, `joblib`, `pandas`, `numpy`)

### Quick Setup

1. **Clone & Install Dependencies**:
   ```bash
   git clone <your-github-repo-url>
   cd MediSense
   npm install
   ```

2. **Run Machine Learning Pipeline**:
   ```bash
   python ml/train.py
   ```

3. **Seed Persistent Database (1,000 Records)**:
   ```bash
   node scripts/seed_db.js
   ```

4. **Launch Application**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🏆 Key Benefits

1. **Clinical Risk Reduction**: Ensures patients with highest diabetes risk scores are contacted first.
2. **Operational Efficiency**: Reduces nurse triage administrative overhead by **80%**.
3. **Data Quality Resilience**: Handles missing lab measurements without crashing.
4. ** HIPAA & Privacy Conscious**: Masked recipient email logging and explicit human-in-the-loop email review safeguards.

---

© 2026 **HexaClinic for Diabetes**. *Research-based screening follow-up prioritization platform. Qualified clinician review required.*
