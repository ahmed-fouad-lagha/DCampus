import numpy as np
import pandas as pd
import os
import json
from datetime import datetime, timedelta

def generate_enrollment_data(n_courses=50, n_semesters=8):
    """
    Generate synthetic course enrollment data for multiple semesters
    
    Parameters:
    n_courses (int): Number of courses to model
    n_semesters (int): Number of semesters of historical data
    
    Returns:
    pd.DataFrame: DataFrame containing synthetic enrollment data
    """
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate course IDs
    course_ids = [f'COURSE{1000 + i}' for i in range(n_courses)]
    
    # Generate department info
    departments = [
        'Computer Science', 'Mathematics', 'Engineering', 'Physics', 
        'Business', 'Arts', 'Social Sciences', 'Biology', 'Chemistry'
    ]
    
    # Create course metadata
    course_departments = {}
    course_levels = {}
    course_names = {}
    course_semester_pattern = {}  # Some courses are fall/spring only or every other year
    course_baseline_popularity = {}
    course_growth_trend = {}  # Increasing or decreasing trend
    course_seasonality = {}  # Seasonal variations
    
    for course_id in course_ids:
        # Assign random department
        dept = np.random.choice(departments)
        course_departments[course_id] = dept
        
        # Assign course level (100-400)
        level = np.random.choice([100, 200, 300, 400])
        course_levels[course_id] = level
        
        # Create a course name
        level_names = {
            100: ['Introduction to', 'Fundamentals of', 'Principles of', 'Basic'],
            200: ['Intermediate', 'Applied', 'Topics in', 'Methods of'],
            300: ['Advanced', 'Analysis of', 'Theory of', 'Special Topics in'],
            400: ['Senior', 'Research in', 'Seminar in', 'Advanced Topics in']
        }
        
        prefix = np.random.choice(level_names[level])
        name = f"{prefix} {dept}"
        course_names[course_id] = name
        
        # Assign course semester pattern
        # 0: Offered every semester
        # 1: Fall only
        # 2: Spring only
        # 3: Every other year (odd years)
        # 4: Every other year (even years)
        pattern = np.random.choice([0, 1, 2, 3, 4], p=[0.6, 0.1, 0.1, 0.1, 0.1])
        course_semester_pattern[course_id] = pattern
        
        # Assign baseline popularity (average enrollment when offered)
        # Lower-level courses tend to be larger
        if level == 100:
            baseline = np.random.randint(40, 150)
        elif level == 200:
            baseline = np.random.randint(30, 100)
        elif level == 300:
            baseline = np.random.randint(20, 60)
        else:  # 400-level
            baseline = np.random.randint(10, 40)
            
        course_baseline_popularity[course_id] = baseline
        
        # Assign growth trend: annual percentage change in enrollment
        # Most courses are stable, some growing, some declining
        growth = np.random.normal(0.02, 0.05)  # 2% average growth with 5% standard deviation
        course_growth_trend[course_id] = growth
        
        # Assign seasonality factor (fall vs. spring variation)
        # Positive means higher enrollment in fall, negative means higher in spring
        seasonality = np.random.uniform(-0.2, 0.2)
        course_seasonality[course_id] = seasonality
    
    # Generate semester data
    semesters = []
    for year in range(2020, 2020 + (n_semesters // 2) + 1):
        semesters.append(f"Fall {year}")
        semesters.append(f"Spring {year + 1}")
    semesters = semesters[:n_semesters]
    
    # Generate enrollment data
    data_rows = []
    
    # External factors affecting all courses
    pandemic_factor = 0.8  # 20% drop during pandemic semesters
    pandemic_semesters = ["Fall 2020", "Spring 2021"]
    recovery_factor = 1.1  # 10% boost during recovery
    recovery_semesters = ["Fall 2021", "Spring 2022"]
    
    # University-wide enrollment trend
    university_growth = 0.03  # 3% annual growth
    
    # For each course and semester, generate enrollment
    for course_id in course_ids:
        for i, semester in enumerate(semesters):
            # Determine if course is offered this semester
            semester_type = "Fall" if semester.startswith("Fall") else "Spring"
            year = int(semester.split(" ")[1])
            
            pattern = course_semester_pattern[course_id]
            offered = True
            
            # Apply semester pattern rules
            if pattern == 1 and semester_type == "Spring":
                offered = False
            elif pattern == 2 and semester_type == "Fall":
                offered = False
            elif pattern == 3 and year % 2 == 0:
                offered = False
            elif pattern == 4 and year % 2 == 1:
                offered = False
                
            if offered:
                # Calculate baseline enrollment for this course
                baseline = course_baseline_popularity[course_id]
                
                # Apply growth trend (compounding)
                # Convert i to years from start
                years = i / 2
                growth_factor = (1 + course_growth_trend[course_id]) ** years
                
                # Apply seasonality
                if semester_type == "Fall":
                    seasonal_factor = 1 + course_seasonality[course_id]
                else:
                    seasonal_factor = 1 - course_seasonality[course_id]
                
                # Apply university-wide growth
                university_factor = (1 + university_growth) ** years
                
                # Apply special period factors
                period_factor = 1.0
                if semester in pandemic_semesters:
                    period_factor *= pandemic_factor
                if semester in recovery_semesters:
                    period_factor *= recovery_factor
                
                # Add random noise (normal distribution with 10% standard deviation)
                noise_factor = np.random.normal(1, 0.1)
                
                # Calculate final enrollment
                enrollment = int(baseline * growth_factor * seasonal_factor * 
                                 university_factor * period_factor * noise_factor)
                
                # Ensure minimum enrollment
                enrollment = max(5, enrollment)
                
                # Add to data
                data_rows.append({
                    'course_id': course_id,
                    'semester': semester,
                    'enrollment': enrollment,
                    'department': course_departments[course_id],
                    'course_level': course_levels[course_id],
                    'course_name': course_names[course_id]
                })
    
    # Convert to DataFrame
    df = pd.DataFrame(data_rows)
    
    # Add academic year
    def get_academic_year(semester):
        if semester.startswith("Fall"):
            year = int(semester.split(" ")[1])
            return f"{year}-{year+1}"
        else:  # Spring
            year = int(semester.split(" ")[1])
            return f"{year-1}-{year}"
    
    df['academic_year'] = df['semester'].apply(get_academic_year)
    df['semester_index'] = df['semester'].apply(lambda x: semesters.index(x))
    
    return df, course_departments, course_levels, course_names

def save_dataset(output_dir=None):
    """Generate and save the dataset to CSV files"""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.realpath(__file__))
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(output_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Generate dataset: 8 semesters of historical data for 50 courses
    df, course_departments, course_levels, course_names = generate_enrollment_data(n_courses=50, n_semesters=8)
    
    # Calculate university-wide stats
    university_stats = df.groupby('semester').agg(
        total_enrollment=('enrollment', 'sum'),
        avg_enrollment=('enrollment', 'mean'),
        courses_offered=('course_id', 'count')
    ).reset_index()
    
    # Calculate department-wide stats
    department_stats = df.groupby(['semester', 'department']).agg(
        total_enrollment=('enrollment', 'sum'),
        avg_enrollment=('enrollment', 'mean'),
        courses_offered=('course_id', 'count')
    ).reset_index()
    
    # Save the datasets
    df.to_csv(os.path.join(data_dir, 'course_enrollments.csv'), index=False)
    university_stats.to_csv(os.path.join(data_dir, 'university_stats.csv'), index=False)
    department_stats.to_csv(os.path.join(data_dir, 'department_stats.csv'), index=False)
    
    # Create a course metadata file
    course_metadata = []
    for course_id in course_departments.keys():
        course_metadata.append({
            'course_id': course_id,
            'department': course_departments[course_id],
            'course_level': course_levels[course_id],
            'course_name': course_names[course_id]
        })
    
    course_metadata_df = pd.DataFrame(course_metadata)
    course_metadata_df.to_csv(os.path.join(data_dir, 'course_metadata.csv'), index=False)
    
    # Generate some test data (next semester) for evaluation
    test_semester = "Fall 2024" if df['semester'].iloc[-1] == "Spring 2024" else "Spring 2025"
    # Update the function to also return the test set for the next semester
    
    print(f"Dataset created: {len(df)} enrollment records across {len(course_departments)} courses and {df['semester'].nunique()} semesters")
    print(f"Data files saved in {data_dir}")
    
    return df

if __name__ == "__main__":
    save_dataset()