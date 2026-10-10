"""
MediSense - Diabetes Risk Prioritization Inference Engine
Loads the saved Pima-trained model and preprocessing pipeline to score eligible uploaded records.
Never uses Outcome, PatientID, PatientName, PatientPhone, or PatientEmail as predictors.
Ranks records by descending score with deterministic tie-breaking.
Identifies data quality limitations (e.g. implausible zeros).
"""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import joblib
import numpy as np
import pandas as pd

from preprocessor import LeakageSafePreprocessor, FEATURE_COLS, ZERO_AS_MISSING_COLS

MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
MODEL_PATH = os.path.join(MODELS_DIR, "production_model.joblib")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.joblib")
LR_MODEL_PATH = os.path.join(MODELS_DIR, "logistic_regression_model.joblib")

class InferenceEngine:
    def __init__(self):
        if not os.path.exists(MODEL_PATH) or not os.path.exists(PREPROCESSOR_PATH):
            raise FileNotFoundError(
                f"Model artifacts not found in {MODELS_DIR}. Please run ml/train.py first."
            )
        self.model = joblib.load(MODEL_PATH)
        self.preprocessor = joblib.load(PREPROCESSOR_PATH)
        if os.path.exists(LR_MODEL_PATH):
            self.lr_model = joblib.load(LR_MODEL_PATH)
        else:
            self.lr_model = None

    def assess_record_quality(self, row):
        """
        Detects missing values, physiologically implausible zeros, and potential anomalies.
        """
        flags = []
        is_reliable = True

        for col in ZERO_AS_MISSING_COLS:
            val = row.get(col)
            if val is None or pd.isna(val) or val == 0:
                flags.append(f"Zero/missing {col} (imputed via clinic cohort median)")
                if col in ["Glucose", "BMI"]:
                    is_reliable = False

        if row.get("Glucose", 0) > 350:
            flags.append("Extreme Glucose measurement (>350 mg/dL)")
        if row.get("BMI", 0) > 65:
            flags.append("Extreme BMI measurement (>65)")
        if row.get("Age", 0) < 18 or row.get("Age", 0) > 110:
            flags.append(f"Unusual adult age ({row.get('Age')} yrs)")

        return {
            "flags": flags,
            "is_reliable": is_reliable,
            "flag_count": len(flags)
        }

    def score_records(self, records):
        if not records:
            return []

        df = pd.DataFrame(records)
        
        for col in FEATURE_COLS:
            if col not in df.columns:
                df[col] = 0.0
            else:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

        # Preprocess features strictly WITHOUT PatientID, PatientName, PatientPhone, PatientEmail, HospitalName, or Outcome
        X = df[FEATURE_COLS]
        X_proc = self.preprocessor.transform(X)

        # Real model probability scores
        scores = self.model.predict_proba(X_proc)[:, 1]
        lr_scores = self.lr_model.predict_proba(X_proc)[:, 1] if self.lr_model else scores

        scored_records = []
        for i, row in df.iterrows():
            quality = self.assess_record_quality(row)
            rec_id = str(row.get("PatientID", f"REC_{i+1}"))
            rec_name = str(row.get("PatientName", f"Patient {rec_id}"))
            rec_phone = str(row.get("PatientPhone", "+1-555-0199"))
            email = str(row.get("PatientEmail", ""))
            hospital = str(row.get("HospitalName", "HexaClinic for Diabetes"))
            age = float(row.get("Age", 0))
            score = float(round(scores[i], 4))
            lr_score = float(round(lr_scores[i], 4))

            highlights = []
            if row.get("Glucose", 0) >= 140:
                highlights.append(f"Elevated Glucose ({row.get('Glucose'):.0f} mg/dL)")
            if row.get("BMI", 0) >= 30:
                highlights.append(f"High BMI ({row.get('BMI'):.1f})")
            if row.get("Age", 0) >= 45:
                highlights.append(f"Age threshold ({row.get('Age'):.0f} yrs)")
            if row.get("DiabetesPedigreeFunction", 0) >= 0.7:
                highlights.append(f"Elevated Pedigree ({row.get('DiabetesPedigreeFunction'):.2f})")

            if score >= 0.65:
                tier = "High Priority"
            elif score >= 0.40:
                tier = "Moderate Priority"
            else:
                tier = "Standard Follow-Up"

            scored_records.append({
                "patient_id": rec_id,
                "patient_name": rec_name,
                "patient_phone": rec_phone,
                "patient_email": email,
                "hospital_name": hospital,
                "model_score": score,
                "secondary_lr_score": lr_score,
                "priority_tier": tier,
                "clinical_features": {
                    "pregnancies": int(row.get("Pregnancies", 0)),
                    "glucose": float(row.get("Glucose", 0)),
                    "blood_pressure": float(row.get("BloodPressure", 0)),
                    "skin_thickness": float(row.get("SkinThickness", 0)),
                    "insulin": float(row.get("Insulin", 0)),
                    "bmi": float(row.get("BMI", 0)),
                    "pedigree": float(row.get("DiabetesPedigreeFunction", 0)),
                    "age": int(age),
                },
                "key_highlights": highlights,
                "quality": quality,
                "nurse_review_status": "pending",
            })

        # Deterministic tie-breaking:
        # 1. model_score DESC
        # 2. age DESC
        # 3. patient_id ASC
        scored_records.sort(
            key=lambda x: (
                -x["model_score"],
                -x["clinical_features"]["age"],
                x["patient_id"]
            )
        )

        for idx, rec in enumerate(scored_records):
            rec["rank"] = idx + 1

        return scored_records

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        engine = InferenceEngine()
        sample = [
            {
                "PatientID": "PAT-101",
                "PatientName": "Jane Doe",
                "PatientPhone": "+1-555-0148",
                "Pregnancies": 6,
                "Glucose": 148,
                "BloodPressure": 72,
                "SkinThickness": 35,
                "Insulin": 0,
                "BMI": 33.6,
                "DiabetesPedigreeFunction": 0.627,
                "Age": 50,
                "PatientEmail": "jane.doe@example.com",
            }
        ]
        results = engine.score_records(sample)
        print("Inference Test Output:")
        print(json.dumps(results, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "--input-file":
        in_path = sys.argv[2]
        engine = InferenceEngine()
        with open(in_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        scored = engine.score_records(data)
        print(json.dumps(scored))
    else:
        input_data = sys.stdin.read().strip()
        if input_data:
            engine = InferenceEngine()
            data = json.loads(input_data)
            scored = engine.score_records(data)
            print(json.dumps(scored))
        else:
            print("HexaClinic for Diabetes Inference Engine ready.")
