"""
MediSense - Leakage Safe Preprocessor
Replaces physiologically implausible zeros with NaN, computes median values strictly
on training fold, imputes missing values, and fits a standard scaler.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

ZERO_AS_MISSING_COLS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

class LeakageSafePreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self, zero_cols=None):
        self.zero_cols = zero_cols if zero_cols is not None else ZERO_AS_MISSING_COLS
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.feature_names = FEATURE_COLS
        self.median_values_ = {}

    def fit(self, X, y=None):
        X_df = pd.DataFrame(X, columns=self.feature_names).copy()
        for col in self.zero_cols:
            if col in X_df.columns:
                X_df.loc[X_df[col] == 0, col] = np.nan
        
        imputed_vals = self.imputer.fit_transform(X_df[self.feature_names])
        for i, col in enumerate(self.feature_names):
            self.median_values_[col] = float(self.imputer.statistics_[i])
        
        self.scaler.fit(imputed_vals)
        return self

    def transform(self, X):
        X_df = pd.DataFrame(X, columns=self.feature_names).copy()
        for col in self.zero_cols:
            if col in X_df.columns:
                X_df.loc[X_df[col] == 0, col] = np.nan
        
        imputed = self.imputer.transform(X_df[self.feature_names])
        scaled = self.scaler.transform(imputed)
        return scaled

    def fit_transform(self, X, y=None):
        return self.fit(X, y).transform(X)
