"""
MediSense - Pima Indians Diabetes Dataset Fetcher & Verifier
Fetches the benchmark 768-record Pima Indians Diabetes Dataset from standard public repositories
and saves it to ml/data/diabetes.csv.
"""
import os
import urllib.request
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
CSV_PATH = os.path.join(DATA_DIR, "diabetes.csv")

# Known public URLs for Pima dataset
URLS = [
    "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv",
    "https://raw.githubusercontent.com/plotly/datasets/master/diabetes.csv",
    "https://gist.githubusercontent.com/ktisha/034342cd547015d59f747796eb07087c/raw/pima-indians-diabetes.csv"
]

COLUMNS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
    "Outcome"
]

def fetch_dataset():
    if os.path.exists(CSV_PATH):
        df = pd.read_csv(CSV_PATH)
        if len(df) == 768:
            print(f"Dataset already exists at {CSV_PATH} with {len(df)} records.")
            return df

    for url in URLS:
        try:
            print(f"Attempting download from {url}...")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read().decode('utf-8')
                lines = [l.strip() for l in content.strip().split('\n') if l.strip() and not l.startswith('#')]
                
                # Check if first line is header or data
                first_parts = lines[0].split(',')
                try:
                    float(first_parts[0])
                    has_header = False
                except ValueError:
                    has_header = True

                if has_header:
                    import io
                    df = pd.read_csv(io.StringIO(content))
                    # Standardize columns
                    col_map = {c: c.strip() for c in df.columns}
                    df.rename(columns=col_map, inplace=True)
                    # Normalize common variations
                    if "Outcome" not in df.columns and "class" in [c.lower() for c in df.columns]:
                        for c in df.columns:
                            if c.lower() == "class":
                                df.rename(columns={c: "Outcome"}, inplace=True)
                else:
                    import io
                    df = pd.read_csv(io.StringIO(content), names=COLUMNS)

                if len(df) == 768:
                    df.to_csv(CSV_PATH, index=False)
                    print(f"Successfully downloaded {len(df)} records and saved to {CSV_PATH}")
                    return df
        except Exception as e:
            print(f"Failed to download from {url}: {e}")

    raise RuntimeError("Could not download Pima Indians Diabetes dataset from any source.")

if __name__ == "__main__":
    df = fetch_dataset()
    print("Columns:", list(df.columns))
    print("Shape:", df.shape)
    print("Outcome counts:\n", df['Outcome'].value_counts())
