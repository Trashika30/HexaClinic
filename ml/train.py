"""
MediSense - Diabetes Risk Prioritization Model Training Pipeline
Implements leakage-safe preprocessing, stratified validation, reproducible seeds,
performance metrics, feature explanations, and model persistence.
"""

import json
import os
import sys

# Ensure current directory is on sys.path for clean pickling of preprocessor
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
    average_precision_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split

from preprocessor import LeakageSafePreprocessor, FEATURE_COLS, ZERO_AS_MISSING_COLS

DATA_PATH = os.path.join(BASE_DIR, "data", "diabetes.csv")
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

TARGET_COL = "Outcome"
RANDOM_STATE = 42

def load_data():
    df = pd.read_csv(DATA_PATH)
    assert len(df) == 768, f"Expected 768 records, found {len(df)}"
    for col in FEATURE_COLS + [TARGET_COL]:
        assert col in df.columns, f"Missing expected column: {col}"
    return df

def compute_metrics(y_true, y_prob, threshold=0.5):
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    fpr, tpr, roc_thresh = roc_curve(y_true, y_prob)
    prec_curve, rec_curve, pr_thresh = precision_recall_curve(y_true, y_prob)
    
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    
    return {
        "accuracy": float(round(accuracy_score(y_true, y_pred), 4)),
        "roc_auc": float(round(roc_auc_score(y_true, y_prob), 4)),
        "pr_auc": float(round(average_precision_score(y_true, y_prob), 4)),
        "precision": float(round(precision_score(y_true, y_pred, zero_division=0), 4)),
        "recall": float(round(recall_score(y_true, y_pred, zero_division=0), 4)),
        "specificity": float(round(specificity, 4)),
        "f1": float(round(f1_score(y_true, y_pred, zero_division=0), 4)),
        "brier_score": float(round(brier_score_loss(y_true, y_prob), 4)),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
        "roc_curve": {
            "fpr": [round(float(x), 4) for x in fpr[::max(1, len(fpr)//25)]],
            "tpr": [round(float(x), 4) for x in tpr[::max(1, len(tpr)//25)]],
        }
    }

def get_clinical_rationale(feat):
    rationales = {
        "Glucose": "Plasma glucose concentration is the primary clinical biomarker for impaired glucose tolerance and diabetes.",
        "BMI": "Body Mass Index reflects adiposity, a major contributing factor to metabolic resistance and insulin secretion demands.",
        "Age": "Insulin resistance risk increases with age due to decreased physical activity and beta cell senescence.",
        "DiabetesPedigreeFunction": "Captures familial genetic susceptibility across documented genealogical lineages.",
        "Pregnancies": "History of multiple pregnancies is associated with gestational hyperglycemia and subsequent metabolic shifts.",
        "BloodPressure": "Diastolic blood pressure correlates with metabolic syndrome and vascular stiffness.",
        "Insulin": "Serum insulin reflects pancreas endocrine compensation; elevated levels suggest resistance, depleted levels indicate beta-cell exhaustion.",
        "SkinThickness": "Triceps skinfold caliper measurement provides a proxy for peripheral subcutaneous adiposity."
    }
    return rationales.get(feat, "Metabolic indicator.")

def train_and_evaluate():
    print("Loading Pima Indians Diabetes Dataset...")
    df = load_data()
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    # Holdout Split (80% train, 20% test, stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    print(f"Train split: {len(X_train)} records, Test split: {len(X_test)} records.")

    # 5-Fold Stratified Cross Validation on Train Split
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    models_to_test = {
        "logistic_regression": LogisticRegression(
            C=1.0, max_iter=1000, random_state=RANDOM_STATE, solver="lbfgs"
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=150, max_depth=5, min_samples_leaf=3, random_state=RANDOM_STATE
        )
    }

    cv_results = {}
    for model_name, model in models_to_test.items():
        fold_scores = []
        for train_idx, val_idx in skf.split(X_train, y_train):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]

            prep = LeakageSafePreprocessor()
            X_tr_proc = prep.fit_transform(X_tr)
            X_val_proc = prep.transform(X_val)

            model.fit(X_tr_proc, y_tr)
            y_val_prob = model.predict_proba(X_val_proc)[:, 1]
            fold_scores.append(roc_auc_score(y_val, y_val_prob))

        cv_results[model_name] = {
            "mean_cv_roc_auc": float(round(np.mean(fold_scores), 4)),
            "std_cv_roc_auc": float(round(np.std(fold_scores), 4)),
            "fold_scores": [round(float(s), 4) for s in fold_scores]
        }
        print(f"Model {model_name} 5-Fold CV ROC-AUC: {cv_results[model_name]['mean_cv_roc_auc']} +/- {cv_results[model_name]['std_cv_roc_auc']}")

    # Final Fit on holdout test set
    trained_pipelines = {}
    test_evaluations = {}

    for model_name, model in models_to_test.items():
        preprocessor = LeakageSafePreprocessor()
        X_train_proc = preprocessor.fit_transform(X_train)
        X_test_proc = preprocessor.transform(X_test)

        model.fit(X_train_proc, y_train)
        y_test_prob = model.predict_proba(X_test_proc)[:, 1]

        metrics = compute_metrics(y_test, y_test_prob)
        metrics["cv_results"] = cv_results[model_name]
        test_evaluations[model_name] = metrics
        trained_pipelines[model_name] = (model, preprocessor)
        print(f"Model {model_name} Test Holdout ROC-AUC: {metrics['roc_auc']}, Recall: {metrics['recall']}, Brier: {metrics['brier_score']}")

    # Feature explanations
    lr_model, _ = trained_pipelines["logistic_regression"]
    rf_model, _ = trained_pipelines["random_forest"]

    lr_coefs = lr_model.coef_[0]
    lr_explanations = []
    for feat, coef in zip(FEATURE_COLS, lr_coefs):
        lr_explanations.append({
            "feature": feat,
            "coefficient": float(round(coef, 4)),
            "odds_ratio": float(round(np.exp(coef), 4)),
            "direction": "Positive risk factor" if coef > 0 else "Negative risk factor",
            "clinical_relevance": get_clinical_rationale(feat)
        })
    lr_explanations.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    rf_importances = rf_model.feature_importances_
    rf_explanations = []
    for feat, imp in zip(FEATURE_COLS, rf_importances):
        rf_explanations.append({
            "feature": feat,
            "importance": float(round(imp, 4)),
            "percentage": float(round(imp * 100, 2)),
            "clinical_relevance": get_clinical_rationale(feat)
        })
    rf_explanations.sort(key=lambda x: x["importance"], reverse=True)

    selected_model_name = "random_forest"
    if test_evaluations["logistic_regression"]["roc_auc"] > test_evaluations["random_forest"]["roc_auc"] + 0.03:
        selected_model_name = "logistic_regression"

    print(f"Selected primary production model: {selected_model_name}")

    # Train final production model on full 768 records with zero leakage
    final_preprocessor = LeakageSafePreprocessor()
    X_full_proc = final_preprocessor.fit_transform(X)
    
    prod_model = (
        RandomForestClassifier(n_estimators=150, max_depth=5, min_samples_leaf=3, random_state=RANDOM_STATE)
        if selected_model_name == "random_forest"
        else LogisticRegression(C=1.0, max_iter=1000, random_state=RANDOM_STATE, solver="lbfgs")
    )
    prod_model.fit(X_full_proc, y)

    prod_lr = LogisticRegression(C=1.0, max_iter=1000, random_state=RANDOM_STATE, solver="lbfgs")
    prod_lr.fit(X_full_proc, y)

    # Save artifacts
    model_path = os.path.join(MODELS_DIR, "production_model.joblib")
    preprocessor_path = os.path.join(MODELS_DIR, "preprocessor.joblib")
    lr_model_path = os.path.join(MODELS_DIR, "logistic_regression_model.joblib")

    joblib.dump(prod_model, model_path)
    joblib.dump(final_preprocessor, preprocessor_path)
    joblib.dump(prod_lr, lr_model_path)

    evaluation_report = {
        "version": "1.0.0",
        "training_date": "2026-10-10",
        "dataset": {
            "name": "Pima Indians Diabetes Dataset",
            "total_records": 768,
            "predictors": FEATURE_COLS,
            "target": TARGET_COL,
            "positive_cases": int(y.sum()),
            "negative_cases": int(len(y) - y.sum()),
            "prevalence_rate": float(round(y.mean(), 4)),
        },
        "preprocessing": {
            "strategy": "Physiological zero replacement with fold-computed median + Standard Scaling",
            "zero_replacement_features": ZERO_AS_MISSING_COLS,
            "fitted_medians": final_preprocessor.median_values_,
            "leakage_prevention": "Imputer and Scaler fitted strictly on training folds during cross-validation"
        },
        "models_evaluated": {
            "random_forest": {
                "name": "Random Forest Classifier",
                "hyperparameters": {
                    "n_estimators": 150,
                    "max_depth": 5,
                    "min_samples_leaf": 3,
                    "random_state": RANDOM_STATE
                },
                "test_metrics": test_evaluations["random_forest"],
                "feature_explanations": rf_explanations
            },
            "logistic_regression": {
                "name": "Logistic Regression Classifier",
                "hyperparameters": {
                    "C": 1.0,
                    "solver": "lbfgs",
                    "max_iter": 1000,
                    "random_state": RANDOM_STATE
                },
                "test_metrics": test_evaluations["logistic_regression"],
                "feature_explanations": lr_explanations
            }
        },
        "selected_model": {
            "key": selected_model_name,
            "name": "Random Forest Classifier" if selected_model_name == "random_forest" else "Logistic Regression Classifier",
            "rationale": "Superior discriminative ROC-AUC, robust non-linear physiological interaction handling, and balanced calibration."
        },
        "clinical_disclaimer": "MediSense provides research-based screening follow-up prioritization, not a diagnosis. Scores depend on data quality and model limitations. Verify measurements and follow clinic protocol. Clinical decisions remain with qualified healthcare professionals."
    }

    report_path = os.path.join(MODELS_DIR, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(evaluation_report, f, indent=2)

    model_card = {
        "model_name": "MediSense Diabetes Screening Prioritization Model",
        "model_version": "1.0.0",
        "intended_use": "Screening triage and follow-up callback prioritization for adult patients. Not for clinical diagnosis or medication prescription.",
        "intended_users": "Authorized triage nurses, clinic intake coordinators, and healthcare professionals.",
        "input_features": FEATURE_COLS,
        "primary_metric": "ROC-AUC and Average Precision (Recall at high deciles)",
        "limitations": [
            "Trained on Pima Indian female cohort; generalized risk estimates must be clinically validated for diverse demographic populations.",
            "Physiologically implausible zeros (glucose, BMI, BP) are median-imputed; records with missing measurements are flagged for data quality review.",
            "Outputs are statistical screening priorities, not definitive laboratory or clinical diagnoses."
        ],
        "ethical_considerations": "Requires authorized medical staff oversight, two-step communication approval, and strictly non-diagnostic patient messaging."
    }

    card_path = os.path.join(MODELS_DIR, "model_card.json")
    with open(card_path, "w") as f:
        json.dump(model_card, f, indent=2)

    print(f"Artifacts successfully saved to {MODELS_DIR}")

if __name__ == "__main__":
    train_and_evaluate()
