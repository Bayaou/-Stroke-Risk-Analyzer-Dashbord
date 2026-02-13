"""analysis.py - Contains all data analysis functions for the stroke dataset"""

import pandas as pd
import numpy as np
from scipy import stats

def overview(df):
    """Get overall dataset statistics"""
    total = len(df)
    stroke_cases = int(df["stroke"].sum())
    non_stroke_cases = int((df["stroke"] == 0).sum())
    stroke_percentage = round((stroke_cases / total) * 100, 2)
    
    return {
        "total_records": total,
        "stroke_cases": stroke_cases,
        "non_stroke_cases": non_stroke_cases,
        "stroke_percentage": stroke_percentage,
        "avg_age": round(df["age"].mean(), 1),
        "avg_glucose": round(df["avg_glucose_level"].mean(), 1),
        "avg_bmi": round(df["bmi"].mean(), 1)
    }


def stroke_distribution(df):
    """Get stroke distribution statistics"""
    counts = df["stroke"].value_counts().to_dict()
    total = sum(counts.values())
    
    return {
        "counts": counts,
        "percentages": {
            "0": round((counts.get(0, 0) / total) * 100, 2),
            "1": round((counts.get(1, 0) / total) * 100, 2)
        }
    }


def age_distribution(df):
    """Get age distribution for stroke vs no-stroke"""
    # Create age bins
    bins = [0, 20, 40, 60, 80, 100]
    labels = ['0-20', '21-40', '41-60', '61-80', '81+']
    
    stroke_ages = df[df["stroke"] == 1]["age"]
    no_stroke_ages = df[df["stroke"] == 0]["age"]
    
    stroke_hist, _ = np.histogram(stroke_ages, bins=bins)
    no_stroke_hist, _ = np.histogram(no_stroke_ages, bins=bins)
    
    return {
        "stroke": stroke_ages.tolist(),
        "no_stroke": no_stroke_ages.tolist(),
        "stroke_hist": stroke_hist.tolist(),
        "no_stroke_hist": no_stroke_hist.tolist(),
        "bins": labels,
        "stroke_mean": round(stroke_ages.mean(), 1),
        "no_stroke_mean": round(no_stroke_ages.mean(), 1)
    }


def categorical_distributions(df):
    """Get all categorical distributions with stroke rates"""
    results = {}
    
    # Define all categorical columns with their French names
    categorical_config = {
        'gender': {
            'name': 'Genre',
            'values': {
                'Male': 'Homme',
                'Female': 'Femme',
                'Other': 'Autre'
            }
        },
        'hypertension': {
            'name': 'Hypertension',
            'values': {
                0: 'Non',
                1: 'Oui'
            }
        },
        'heart_disease': {
            'name': 'Maladie Cardiaque',
            'values': {
                0: 'Non',
                1: 'Oui'
            }
        },
        'ever_married': {
            'name': 'Statut Matrimonial',
            'values': {
                'Yes': 'Marié(e)',
                'No': 'Célibataire'
            }
        },
        'work_type': {
            'name': 'Type de Travail',
            'values': {
                'Private': 'Privé',
                'Self-employed': 'Indépendant',
                'Govt_job': 'Fonctionnaire',
                'children': 'Enfant',
                'Never_worked': 'Jamais travaillé'
            }
        },
        'Residence_type': {
            'name': 'Type de Résidence',
            'values': {
                'Urban': 'Urbain',
                'Rural': 'Rural'
            }
        },
        'smoking_status': {
            'name': 'Tabagisme',
            'values': {
                'formerly smoked': 'Ancien fumeur',
                'never smoked': 'Jamais fumé',
                'smokes': 'Fumeur actuel',
                'Unknown': 'Inconnu'
            }
        }
    }
    
    for column, config in categorical_config.items():
        if column in df.columns:
            # Group by the column and calculate statistics
            grouped = df.groupby(column).agg(
                total=('stroke', 'count'),
                stroke_count=('stroke', 'sum'),
                stroke_rate=('stroke', 'mean')
            ).reset_index()
            
            # Add French labels
            grouped['label'] = grouped[column].map(config['values'])
            grouped['label'] = grouped['label'].fillna(grouped[column].astype(str))
            
            results[column] = grouped.to_dict('records')
    
    return results


def numerical_distributions(df):
    """Get distributions for numerical variables"""
    results = {}
    
    # Age distribution details
    age_stats = df['age'].describe().to_dict()
    age_stats['stroke_mean'] = round(df[df['stroke'] == 1]['age'].mean(), 1)
    age_stats['no_stroke_mean'] = round(df[df['stroke'] == 0]['age'].mean(), 1)
    results['age'] = age_stats
    
    # Glucose distribution details
    glucose_stats = df['avg_glucose_level'].describe().to_dict()
    glucose_stats['stroke_mean'] = round(df[df['stroke'] == 1]['avg_glucose_level'].mean(), 1)
    glucose_stats['no_stroke_mean'] = round(df[df['stroke'] == 0]['avg_glucose_level'].mean(), 1)
    results['glucose'] = glucose_stats
    
    # BMI distribution details
    bmi_stats = df['bmi'].describe().to_dict()
    bmi_stats['stroke_mean'] = round(df[df['stroke'] == 1]['bmi'].mean(), 1)
    bmi_stats['no_stroke_mean'] = round(df[df['stroke'] == 0]['bmi'].mean(), 1)
    results['bmi'] = bmi_stats
    
    return results


def correlation_analysis(df):
    """Calculate correlation matrix"""
    # Select numerical columns
    numerical_cols = ['age', 'avg_glucose_level', 'bmi', 'stroke']
    corr_df = df[numerical_cols].corr()
    
    # Convert to dictionary with proper formatting
    corr_dict = {}
    for col in numerical_cols:
        corr_dict[col] = {}
        for row in numerical_cols:
            corr_dict[col][row] = round(corr_df.loc[col, row], 3)
    
    return corr_dict


def feature_importance(df):
    """Calculate feature importance using multiple metrics"""
    features = ['age', 'avg_glucose_level', 'bmi', 'hypertension', 'heart_disease']
    importance = {}
    
    for feature in features:
        if feature in df.columns:
            # For numerical features, use correlation
            if df[feature].dtype in ['int64', 'float64']:
                corr = df[[feature, 'stroke']].corr().iloc[0, 1]
                if pd.isna(corr):
                    corr = 0
                
                # Calculate effect size (Cohen's d)
                stroke_mean = df[df['stroke'] == 1][feature].mean()
                no_stroke_mean = df[df['stroke'] == 0][feature].mean()
                stroke_std = df[df['stroke'] == 1][feature].std()
                no_stroke_std = df[df['stroke'] == 0][feature].std()
                
                pooled_std = np.sqrt((stroke_std**2 + no_stroke_std**2) / 2)
                effect_size = (stroke_mean - no_stroke_mean) / pooled_std if pooled_std > 0 else 0
                
            else:
                # For categorical/binary features
                corr = stats.pointbiserialr(df[feature], df['stroke'])[0]
                if pd.isna(corr):
                    corr = 0
                
                # Odds ratio for binary features
                stroke_rate_with = df[df[feature] == 1]['stroke'].mean()
                stroke_rate_without = df[df[feature] == 0]['stroke'].mean()
                effect_size = stroke_rate_with - stroke_rate_without
            
            # Importance score (0-100 scale)
            importance_score = min(100, max(0, (abs(corr) * 80 + abs(effect_size) * 20)))
            
            importance[feature] = {
                'correlation': round(corr, 3),
                'effect_size': round(effect_size, 3),
                'importance_score': round(importance_score, 1),
                'feature_name': feature
            }
    
    # Sort by importance score
    sorted_importance = dict(sorted(
        importance.items(), 
        key=lambda x: x[1]['importance_score'], 
        reverse=True
    ))
    
    return sorted_importance


def glucose_categories(df):
    """Categorize glucose levels"""
    # Define glucose categories
    categories = {
        'Hypoglycémie': (0, 70),
        'Normal': (70, 100),
        'Pré-diabète': (100, 125),
        'Diabète': (125, 200),
        'Diabète sévère': (200, 300)
    }
    
    results = []
    for name, (low, high) in categories.items():
        mask = (df['avg_glucose_level'] >= low) & (df['avg_glucose_level'] < high)
        subset = df[mask]
        
        if len(subset) > 0:
            results.append({
                'category': name,
                'total': len(subset),
                'stroke_count': int(subset['stroke'].sum()),
                'stroke_rate': round(subset['stroke'].mean() * 100, 2),
                'avg_glucose': round(subset['avg_glucose_level'].mean(), 1)
            })
        else:
            results.append({
                'category': name,
                'total': 0,
                'stroke_count': 0,
                'stroke_rate': 0.0,
                'avg_glucose': round((low + high) / 2, 1)
            })
    
    return results


def bmi_categories(df):
    """Categorize BMI levels"""
    # Define BMI categories
    categories = {
        'Sous-poids': (0, 18.5),
        'Normal': (18.5, 25),
        'Surpoids': (25, 30),
        'Obésité I': (30, 35),
        'Obésité II': (35, 40),
        'Obésité III': (40, 100)
    }
    
    results = []
    for name, (low, high) in categories.items():
        mask = (df['bmi'] >= low) & (df['bmi'] < high)
        subset = df[mask]
        
        if len(subset) > 0:
            results.append({
                'category': name,
                'total': len(subset),
                'stroke_count': int(subset['stroke'].sum()),
                'stroke_rate': round(subset['stroke'].mean() * 100, 2),
                'avg_bmi': round(subset['bmi'].mean(), 1)
            })
        else:
            results.append({
                'category': name,
                'total': 0,
                'stroke_count': 0,
                'stroke_rate': 0.0,
                'avg_bmi': round((low + high) / 2, 1)
            })
    
    return results


def risk_factor_comparison(df):
    """Compare risk factors between stroke and no-stroke groups"""
    comparison = {}
    
    # Numerical factors
    numerical_factors = ['age', 'avg_glucose_level', 'bmi']
    for factor in numerical_factors:
        stroke_group = df[df['stroke'] == 1][factor]
        no_stroke_group = df[df['stroke'] == 0][factor]
        
        comparison[factor] = {
            'stroke_mean': round(stroke_group.mean(), 2),
            'no_stroke_mean': round(no_stroke_group.mean(), 2),
            'difference': round(stroke_group.mean() - no_stroke_group.mean(), 2),
            'pct_difference': round(((stroke_group.mean() - no_stroke_group.mean()) / no_stroke_group.mean()) * 100, 1) if no_stroke_group.mean() > 0 else 0
        }
    
    # Binary factors
    binary_factors = ['hypertension', 'heart_disease']
    for factor in binary_factors:
        stroke_rate_with = df[df[factor] == 1]['stroke'].mean()
        stroke_rate_without = df[df[factor] == 0]['stroke'].mean()
        
        comparison[factor] = {
            'stroke_rate_with': round(stroke_rate_with * 100, 2),
            'stroke_rate_without': round(stroke_rate_without * 100, 2),
            'risk_ratio': round(stroke_rate_with / stroke_rate_without, 2) if stroke_rate_without > 0 else 0,
            'risk_difference': round((stroke_rate_with - stroke_rate_without) * 100, 2)
        }
    
    return comparison


def detailed_analysis(df):
    """Get complete analysis for dashboard"""
    return {
        'overview': overview(df),
        'stroke_distribution': stroke_distribution(df),
        'age_distribution': age_distribution(df),
        'categorical_distributions': categorical_distributions(df),
        'numerical_distributions': numerical_distributions(df),
        'correlation': correlation_analysis(df),
        'feature_importance': feature_importance(df),
        'glucose_categories': glucose_categories(df),
        'bmi_categories': bmi_categories(df),
        'risk_factor_comparison': risk_factor_comparison(df)
    }


def filtered_analysis(df, filters):
    """Apply filters and return analysis"""
    filtered_df = df.copy()
    
    # Apply age filter
    if 'age_min' in filters and 'age_max' in filters:
        filtered_df = filtered_df[
            (filtered_df['age'] >= filters['age_min']) & 
            (filtered_df['age'] <= filters['age_max'])
        ]
    
    # Apply gender filter
    if 'gender' in filters and filters['gender'] != 'all':
        filtered_df = filtered_df[filtered_df['gender'] == filters['gender']]
    
    # Apply hypertension filter
    if 'hypertension' in filters and filters['hypertension']:
        filtered_df = filtered_df[filtered_df['hypertension'] == 1]
    
    # Apply heart disease filter
    if 'heart_disease' in filters and filters['heart_disease']:
        filtered_df = filtered_df[filtered_df['heart_disease'] == 1]
    
    # Apply smoking filter
    if 'smoking' in filters and filters['smoking'] != 'all':
        if filters['smoking'] == 'smoker':
            filtered_df = filtered_df[filtered_df['smoking_status'].isin(['formerly smoked', 'smokes'])]
        elif filters['smoking'] == 'non_smoker':
            filtered_df = filtered_df[filtered_df['smoking_status'] == 'never smoked']
    
    # Apply work type filter
    if 'work_type' in filters and filters['work_type'] != 'all':
        filtered_df = filtered_df[filtered_df['work_type'] == filters['work_type']]
    
    return detailed_analysis(filtered_df)