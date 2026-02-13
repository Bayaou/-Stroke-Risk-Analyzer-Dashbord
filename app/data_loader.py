"""data_loader.py - Responsible for loading and basic cleaning of the stroke dataset"""
import pandas as pd

DATA_PATH = "data/stroke_data.csv"

def load_data():
    df = pd.read_csv(DATA_PATH)

    # Basic cleaning
    df["bmi"] = df["bmi"].fillna(df["bmi"].median())
    df["smoking_status"] = df["smoking_status"].fillna("Unknown")

    return df
