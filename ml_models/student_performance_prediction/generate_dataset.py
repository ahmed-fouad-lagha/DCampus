import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import os

def generate_synthetic_student_data(n_students=500):
    """
    Generate synthetic student data for model training and testing.
    
    Parameters:
    n_students (int): Number of synthetic student records to generate
    
    Returns:
    pd.DataFrame: DataFrame containing synthetic student data
    """
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate student IDs
    student_ids = [f'S{1000 + i}' for i in range(n_students)]
    
    # Generate features that influence academic performance
    attendance_rate = np.random.uniform(0.5, 1.0, n_students)  # 50% to 100% attendance
    assignment_completion = np.random.uniform(0.6, 1.0, n_students)  # 60% to 100% completion
    previous_gpa = np.random.uniform(1.0, 4.0, n_students)  # GPA on 4.0 scale
    study_hours_per_week = np.random.uniform(1, 30, n_students)  # 1 to 30 hours
    
    # Resource utilization (library visits, online resources, tutoring)
    resource_utilization = np.random.uniform(0, 1.0, n_students)
    
    # Generate some categorical variables
    program_options = ['Computer Science', 'Mathematics', 'Engineering', 'Physics', 'Business']
    program = np.random.choice(program_options, n_students)
    
    year_of_study = np.random.randint(1, 5, n_students)  # 1-4 years
    
    # Add some correlations between features
    # Students with higher previous GPA tend to have higher attendance and assignment completion
    attendance_rate = 0.7 * attendance_rate + 0.3 * previous_gpa / 4.0
    attendance_rate = np.clip(attendance_rate, 0, 1)
    
    assignment_completion = 0.6 * assignment_completion + 0.4 * previous_gpa / 4.0
    assignment_completion = np.clip(assignment_completion, 0, 1)
    
    # Generate target variable: current_performance (0-100 scale)
    # We'll make it a weighted combination of our features plus some noise
    weights = [0.25, 0.25, 0.2, 0.15, 0.15]  # Weights for each feature
    features = [
        attendance_rate * 100,
        assignment_completion * 100, 
        previous_gpa * 25,  # Scale to 0-100
        study_hours_per_week * 100 / 30,  # Scale to 0-100
        resource_utilization * 100  # Scale to 0-100
    ]
    
    current_performance = np.zeros(n_students)
    for w, f in zip(weights, features):
        current_performance += w * f
        
    # Add some random noise
    noise = np.random.normal(0, 5, n_students)
    current_performance += noise
    
    # Ensure grades are between 0 and 100
    current_performance = np.clip(current_performance, 0, 100)
    
    # Create risk levels based on current performance
    risk_levels = ['low'] * n_students
    for i in range(n_students):
        if current_performance[i] < 50:
            risk_levels[i] = 'high'
        elif current_performance[i] < 70:
            risk_levels[i] = 'medium'
    
    # Create DataFrame
    df = pd.DataFrame({
        'student_id': student_ids,
        'attendance_rate': attendance_rate,
        'assignment_completion': assignment_completion,
        'previous_gpa': previous_gpa,
        'study_hours_per_week': study_hours_per_week,
        'resource_utilization': resource_utilization,
        'program': program,
        'year_of_study': year_of_study,
        'current_performance': current_performance,
        'risk_level': risk_levels
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
    df = generate_synthetic_student_data(500)
    
    # Split into training (80%) and testing (20%) sets
    mask = np.random.rand(len(df)) < 0.8
    train_df = df[mask]
    test_df = df[~mask]
    
    # Save data to CSV
    train_df.to_csv(os.path.join(data_dir, 'student_train.csv'), index=False)
    test_df.to_csv(os.path.join(data_dir, 'student_test.csv'), index=False)
    
    print(f"Dataset created: {len(train_df)} training samples, {len(test_df)} testing samples")
    return train_df, test_df

if __name__ == "__main__":
    save_dataset()