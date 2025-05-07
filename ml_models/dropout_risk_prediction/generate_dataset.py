import numpy as np
import pandas as pd
import os
import json
from datetime import datetime, timedelta

def generate_synthetic_dropout_data(n_students=500):
    """
    Generate synthetic student data for dropout risk prediction
    
    Parameters:
    n_students (int): Number of student records to generate
    
    Returns:
    pd.DataFrame: DataFrame containing synthetic student data with dropout indicators
    """
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate student IDs
    student_ids = [f'S{1000 + i}' for i in range(n_students)]
    
    # Define factors that influence dropout risk
    # Academic factors
    gpa_values = np.random.uniform(1.5, 4.0, n_students)
    failed_courses = np.random.randint(0, 5, n_students)
    assignment_completion_rate = np.random.uniform(0.4, 1.0, n_students)
    
    # Engagement factors
    attendance_rate = np.random.uniform(0.5, 1.0, n_students)
    participation_score = np.random.uniform(1, 10, n_students)
    resource_access_frequency = np.random.uniform(0, 30, n_students)  # times per week
    
    # Financial factors
    financial_aid = np.random.choice([0, 1], n_students, p=[0.3, 0.7])
    outstanding_balance = np.random.uniform(0, 5000, n_students)
    payment_delays = np.random.randint(0, 5, n_students)
    
    # Personal factors
    distance_from_campus = np.random.uniform(0, 50, n_students)  # miles
    working_hours_per_week = np.random.uniform(0, 40, n_students)
    family_responsibilities = np.random.uniform(0, 10, n_students)  # subjective scale
    
    # Introduced correlations (lower GPA students tend to have more failed courses, lower attendance, etc.)
    # Scale GPAs to 0-1 for correlation calculations (will convert back later)
    gpa_scaled = (gpa_values - 1.5) / 2.5  # Now between 0-1
    
    # Add correlations
    failed_courses = np.round(failed_courses * (1 - gpa_scaled) * 0.7 + failed_courses * 0.3).astype(int)
    attendance_rate = attendance_rate * gpa_scaled * 0.6 + attendance_rate * 0.4
    attendance_rate = np.clip(attendance_rate, 0.3, 1.0)  # Ensure values stay in reasonable range
    
    assignment_completion_rate = assignment_completion_rate * gpa_scaled * 0.7 + assignment_completion_rate * 0.3
    assignment_completion_rate = np.clip(assignment_completion_rate, 0.3, 1.0)
    
    # Create a risk score as a weighted combination of factors
    # Lower GPA, more failed courses, lower attendance, etc. increase risk
    weights = [
        -0.25,  # gpa (negative because lower GPA = higher risk)
        0.15,   # failed_courses
        -0.15,  # assignment_completion_rate
        -0.15,  # attendance_rate
        -0.05,  # participation_score
        -0.05,  # resource_access_frequency
        -0.05,  # financial_aid (negative because having aid reduces risk)
        0.05,   # outstanding_balance
        0.05,   # payment_delays
        0.03,   # distance_from_campus
        0.05,   # working_hours_per_week
        0.02    # family_responsibilities
    ]
    
    # Normalize each factor to 0-1 scale - create arrays for each factor
    normalized_factors = [
        (4.0 - gpa_values) / 2.5,
        failed_courses / 5,
        (1 - assignment_completion_rate),
        (1 - attendance_rate),
        (10 - participation_score) / 10,
        (30 - resource_access_frequency) / 30,
        (1 - financial_aid),
        outstanding_balance / 5000,
        payment_delays / 5,
        distance_from_campus / 50,
        working_hours_per_week / 40,
        family_responsibilities / 10
    ]
    
    # Calculate risk score (weighted sum)
    risk_score = np.zeros(n_students)
    for i, factor in enumerate(normalized_factors):
        risk_score += factor * abs(weights[i])
    
    # Normalize risk score to 0-1
    risk_score = (risk_score - risk_score.min()) / (risk_score.max() - risk_score.min())
    
    # Generate dropout label with some noise
    # Higher risk score = higher probability of dropout
    dropout_prob = risk_score * 0.8 + np.random.uniform(0, 0.1, n_students)
    dropout = (dropout_prob > 0.7).astype(int)  # Threshold at 0.7
    
    # Determine primary dropout factors
    primary_factors = []
    risk_factors = [
        'Low GPA',
        'Failed courses',
        'Low assignment completion',
        'Poor attendance',
        'Low participation',
        'Limited resource utilization',
        'No financial aid',
        'Outstanding balance',
        'Payment delays',
        'Distance from campus',
        'Heavy work schedule',
        'Family responsibilities'
    ]
    
    # For each student, find the top 2-4 risk factors
    for i in range(n_students):
        # Only assign factors for students at risk or who dropped out
        if risk_score[i] > 0.5 or dropout[i] == 1:
            # Get values for this specific student
            student_factor_values = [factor[i] for factor in normalized_factors]
            
            # Calculate contribution of each factor to risk score
            factor_contributions = [f * abs(w) for f, w in zip(student_factor_values, weights)]
            
            # Get indices of factors sorted by their contribution to risk
            top_factor_indices = np.argsort(factor_contributions)[-4:][::-1]  # Top 4 factors
            
            # Get 2-4 factors based on risk level
            num_factors = 2 + int(risk_score[i] * 2)
            student_factors = [risk_factors[idx] for idx in top_factor_indices[:num_factors]]
        else:
            student_factors = []
            
        primary_factors.append(student_factors)
    
    # Create DataFrame with all features
    df = pd.DataFrame({
        'student_id': student_ids,
        'gpa': gpa_values,
        'failed_courses': failed_courses,
        'assignment_completion_rate': assignment_completion_rate,
        'attendance_rate': attendance_rate,
        'participation_score': participation_score,
        'resource_access_frequency': resource_access_frequency,
        'financial_aid': financial_aid,
        'outstanding_balance': outstanding_balance,
        'payment_delays': payment_delays,
        'distance_from_campus': distance_from_campus,
        'working_hours_per_week': working_hours_per_week,
        'family_responsibilities': family_responsibilities,
        'risk_score': risk_score,
        'dropout': dropout,
        'risk_factors': primary_factors
    })
    
    return df

def save_dataset(output_dir=None):
    """Generate and save the dataset to CSV files"""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.realpath(__file__))
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(output_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Generate dataset
    df = generate_synthetic_dropout_data(500)
    
    # Convert risk factors list to string for CSV storage
    df['risk_factors_str'] = df['risk_factors'].apply(lambda x: json.dumps(x))
    df_csv = df.drop(columns=['risk_factors']).rename(columns={'risk_factors_str': 'risk_factors'})
    
    # Split into training (80%) and testing (20%) sets
    mask = np.random.rand(len(df)) < 0.8
    train_df = df_csv[mask]
    test_df = df_csv[~mask]
    
    # Save data to CSV
    train_df.to_csv(os.path.join(data_dir, 'dropout_train.csv'), index=False)
    test_df.to_csv(os.path.join(data_dir, 'dropout_test.csv'), index=False)
    
    print(f"Dataset created: {len(train_df)} training samples, {len(test_df)} testing samples")
    return df

if __name__ == "__main__":
    save_dataset()