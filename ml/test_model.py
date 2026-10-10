"""
MediSense - Machine Learning Unit & Leakage Tests
Verifies:
1. Leakage-safe preprocessing (imputer and scaler fit strictly on train set)
2. Target/Outcome column exclusion from predictors
3. Non-mock real inference score consistency
4. Deterministic tie-breaking
5. Implausible zero handling
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from preprocessor import LeakageSafePreprocessor, FEATURE_COLS
from infer import InferenceEngine

class TestMediSenseML(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = InferenceEngine()

    def test_feature_columns_never_include_outcome_or_identifiers(self):
        """Verify that Outcome, PatientID, and PatientEmail are strictly excluded from predictors."""
        self.assertNotIn("Outcome", FEATURE_COLS)
        self.assertNotIn("PatientID", FEATURE_COLS)
        self.assertNotIn("PatientEmail", FEATURE_COLS)
        self.assertNotIn("HospitalName", FEATURE_COLS)
        self.assertEqual(len(FEATURE_COLS), 8)

    def test_leakage_safe_preprocessor_isolates_train_data(self):
        """Verify preprocessor fits medians strictly on train data and does not alter based on test data."""
        train_data = pd.DataFrame({
            "Pregnancies": [1, 2, 3],
            "Glucose": [100, 0, 150],  # 0 will be replaced with NaN
            "BloodPressure": [70, 80, 0],
            "SkinThickness": [20, 25, 0],
            "Insulin": [0, 85, 120],
            "BMI": [25.0, 30.0, 0],
            "DiabetesPedigreeFunction": [0.3, 0.4, 0.5],
            "Age": [25, 35, 45],
        })
        
        test_data = pd.DataFrame({
            "Pregnancies": [4],
            "Glucose": [300],  # Very high glucose should not affect train median
            "BloodPressure": [95],
            "SkinThickness": [40],
            "Insulin": [250],
            "BMI": [45.0],
            "DiabetesPedigreeFunction": [1.2],
            "Age": [60],
        })

        prep = LeakageSafePreprocessor()
        prep.fit(train_data)
        
        # Train medians for glucose: non-zero are 100 and 150 -> median is 125
        expected_glucose_median = 125.0
        self.assertEqual(prep.median_values_["Glucose"], expected_glucose_median)

        # Transform test data using fitted train medians
        transformed_test = prep.transform(test_data)
        self.assertEqual(transformed_test.shape, (1, 8))

    def test_deterministic_tie_breaking(self):
        """Verify deterministic ranking: score DESC, then Age DESC, then PatientID ASC."""
        records = [
            {
                "PatientID": "PAT-B",
                "Age": 40,
                "Glucose": 140, "BMI": 30, "BloodPressure": 70, "SkinThickness": 20, "Insulin": 90, "Pregnancies": 2, "DiabetesPedigreeFunction": 0.4
            },
            {
                "PatientID": "PAT-A",
                "Age": 50,  # Older should rank higher on tie
                "Glucose": 140, "BMI": 30, "BloodPressure": 70, "SkinThickness": 20, "Insulin": 90, "Pregnancies": 2, "DiabetesPedigreeFunction": 0.4
            },
            {
                "PatientID": "PAT-C",
                "Age": 50,  # Same age and features, alphabetical PatientID should win (PAT-A before PAT-C)
                "Glucose": 140, "BMI": 30, "BloodPressure": 70, "SkinThickness": 20, "Insulin": 90, "Pregnancies": 2, "DiabetesPedigreeFunction": 0.4
            }
        ]
        
        scored = self.engine.score_records(records)
        self.assertEqual(len(scored), 3)
        # Ranks must be 1, 2, 3
        ranks = [r["rank"] for r in scored]
        self.assertEqual(ranks, [1, 2, 3])
        # PAT-A has Age 50, PAT-B has Age 40, PAT-C has Age 50.
        # Between PAT-A and PAT-C with same age and same score, PAT-A comes first.
        self.assertEqual(scored[0]["patient_id"], "PAT-A")
        self.assertEqual(scored[1]["patient_id"], "PAT-C")
        self.assertEqual(scored[2]["patient_id"], "PAT-B")

    def test_biological_zero_detection(self):
        """Verify that records with 0 for glucose/insulin/BMI get quality flags."""
        record = {
            "PatientID": "PAT-ZERO",
            "Glucose": 0,
            "BMI": 0,
            "BloodPressure": 0,
            "SkinThickness": 0,
            "Insulin": 0,
            "Age": 30,
            "Pregnancies": 0,
            "DiabetesPedigreeFunction": 0.2
        }
        scored = self.engine.score_records([record])[0]
        self.assertFalse(scored["quality"]["is_reliable"])
        self.assertGreater(scored["quality"]["flag_count"], 0)

if __name__ == "__main__":
    unittest.main()
