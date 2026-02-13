from fastapi import APIRouter, Query
from app.data_loader import load_data
from app.analysis import *
import pandas as pd

router = APIRouter()
df = load_data()


@router.get("/")
def root():
    return {"message": "Stroke Analysis API is running"}


@router.get("/detailed-analysis")
def get_detailed_analysis():
    return {
        'overview': overview(df),
        'stroke_distribution': stroke_distribution(df),
        'age_distribution': age_distribution(df),
        'categorical_distributions': categorical_distributions(df),
        'glucose_categories': glucose_categories(df),
        'bmi_categories': bmi_categories(df),
        'feature_importance': feature_importance(df),
        'risk_factor_comparison': risk_factor_comparison(df)
    }


@router.get("/full-dataset")
def get_full_dataset():
    data = df.to_dict(orient='records')
    for record in data:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    return data


@router.get("/filtered-analysis")
def get_filtered_analysis(
    age_min: int = Query(0, ge=0, le=100),
    age_max: int = Query(100, ge=0, le=100),
    gender: str = Query("all"),
    hypertension: str = Query("all"),
    heart_disease: str = Query("all"),
    stroke: str = Query("all"),
    ever_married: str = Query("all"),
    work_type: str = Query("all"),
    Residence_type: str = Query("all"),
    smoking_status: str = Query("all"),
    glucose_min: float = Query(None),
    glucose_max: float = Query(None),
    bmi_min: float = Query(None),
    bmi_max: float = Query(None)
):
    filtered_df = df.copy()
    
    # Age filter
    if age_min > 0 or age_max < 100:
        filtered_df = filtered_df[(filtered_df['age'] >= age_min) & (filtered_df['age'] <= age_max)]
    
    # Gender filter
    if gender != 'all':
        filtered_df = filtered_df[filtered_df['gender'] == gender]
    
    # Hypertension filter - FIXED
    if hypertension != 'all':
        val = 1 if hypertension == 'true' else 0
        filtered_df = filtered_df[filtered_df['hypertension'] == val]
    
    # Heart disease filter - FIXED
    if heart_disease != 'all':
        val = 1 if heart_disease == 'true' else 0
        filtered_df = filtered_df[filtered_df['heart_disease'] == val]
    
    # Stroke filter - FIXED
    if stroke != 'all':
        val = int(stroke)
        filtered_df = filtered_df[filtered_df['stroke'] == val]
    
    # Marital status filter
    if ever_married != 'all':
        filtered_df = filtered_df[filtered_df['ever_married'] == ever_married]
    
    # Work type filter
    if work_type != 'all':
        filtered_df = filtered_df[filtered_df['work_type'] == work_type]
    
    # Residence type filter
    if Residence_type != 'all':
        filtered_df = filtered_df[filtered_df['Residence_type'] == Residence_type]
    
    # Smoking status filter
    if smoking_status != 'all':
        filtered_df = filtered_df[filtered_df['smoking_status'] == smoking_status]
    
    # Glucose range filter
    if glucose_min is not None and glucose_max is not None:
        filtered_df = filtered_df[(filtered_df['avg_glucose_level'] >= glucose_min) & 
                                  (filtered_df['avg_glucose_level'] <= glucose_max)]
    
    # BMI range filter
    if bmi_min is not None and bmi_max is not None:
        filtered_df = filtered_df[(filtered_df['bmi'] >= bmi_min) & 
                                  (filtered_df['bmi'] <= bmi_max)]
    
    return {
        'overview': overview(filtered_df),
        'stroke_distribution': stroke_distribution(filtered_df),
        'age_distribution': age_distribution(filtered_df),
        'categorical_distributions': categorical_distributions(filtered_df),
        'glucose_categories': glucose_categories(filtered_df),
        'bmi_categories': bmi_categories(filtered_df),
        'feature_importance': feature_importance(filtered_df),
        'risk_factor_comparison': risk_factor_comparison(filtered_df)
    }