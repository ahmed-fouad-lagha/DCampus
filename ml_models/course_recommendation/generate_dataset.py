import numpy as np
import pandas as pd
import os
import json
from datetime import datetime, timedelta

def generate_course_data(n_courses=100):
    """
    Generate synthetic course data
    
    Parameters:
    n_courses (int): Number of courses to generate
    
    Returns:
    pd.DataFrame: DataFrame containing synthetic course data
    """
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate course IDs
    course_ids = [f'COURSE{1000 + i}' for i in range(n_courses)]
    
    # Define departments and their associated courses
    departments = [
        'Computer Science', 'Mathematics', 'Engineering', 'Physics', 
        'Business', 'Arts', 'Social Sciences', 'Biology', 'Chemistry'
    ]
    
    # Generate course names
    course_prefixes = {
        'Computer Science': ['CS', 'INFO', 'DATA'],
        'Mathematics': ['MATH', 'STAT'],
        'Engineering': ['ENGR', 'MECH', 'ELEC', 'CIVIL'],
        'Physics': ['PHYS', 'ASTR'],
        'Business': ['BUS', 'MGMT', 'FIN', 'ECON'],
        'Arts': ['ART', 'MUS', 'THTR', 'LIT'],
        'Social Sciences': ['SOC', 'PSYCH', 'POL', 'ANTH'],
        'Biology': ['BIO', 'MICR', 'ANAT'],
        'Chemistry': ['CHEM', 'BIOCHEM']
    }
    
    course_names = {
        'Computer Science': ['Introduction to Programming', 'Data Structures', 'Algorithms', 
                              'Database Systems', 'Machine Learning', 'Artificial Intelligence',
                              'Computer Networks', 'Operating Systems', 'Software Engineering',
                              'Web Development', 'Computer Graphics', 'Computer Architecture',
                              'Cloud Computing', 'Distributed Systems', 'Information Security'],
        'Mathematics': ['Calculus', 'Linear Algebra', 'Differential Equations', 
                         'Discrete Mathematics', 'Mathematical Statistics', 'Numerical Analysis',
                         'Graph Theory', 'Topology', 'Real Analysis', 'Complex Analysis'],
        'Engineering': ['Mechanics', 'Thermodynamics', 'Fluid Dynamics', 
                         'Materials Science', 'Control Systems', 'Signal Processing',
                         'Circuit Design', 'Structural Analysis', 'Robotics'],
        'Physics': ['Classical Mechanics', 'Electricity and Magnetism', 'Quantum Mechanics',
                     'Statistical Mechanics', 'Optics', 'Particle Physics', 'Astrophysics'],
        'Business': ['Accounting', 'Finance', 'Marketing', 'Management', 
                      'Business Strategy', 'Entrepreneurship', 'Business Analytics',
                      'Organizational Behavior', 'Supply Chain Management'],
        'Arts': ['Drawing', 'Painting', 'Sculpture', 'Art History', 'Music Theory',
                  'Theater Performance', 'Film Studies', 'Creative Writing', 'Design'],
        'Social Sciences': ['Introduction to Sociology', 'Developmental Psychology', 
                             'Political Theory', 'Cultural Anthropology', 'Macroeconomics',
                             'Microeconomics', 'International Relations', 'Public Policy'],
        'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Evolutionary Biology',
                     'Microbiology', 'Molecular Biology', 'Human Anatomy', 'Physiology'],
        'Chemistry': ['General Chemistry', 'Organic Chemistry', 'Inorganic Chemistry',
                       'Biochemistry', 'Analytical Chemistry', 'Physical Chemistry']
    }
    
    # Generate course data
    data_rows = []
    for i, course_id in enumerate(course_ids):
        department = np.random.choice(departments)
        prefix = np.random.choice(course_prefixes[department])
        name = np.random.choice(course_names[department])
        code = f"{prefix} {100 + (i % 4) * 100 + np.random.randint(1, 100)}"
        
        # Generate course levels (100-400 level) and map to difficulty
        course_level = np.random.randint(1, 5) * 100
        difficulty_map = {100: 'introductory', 200: 'intermediate', 
                          300: 'advanced', 400: 'specialized'}
        difficulty = difficulty_map[course_level]
        
        # Generate course metadata
        keywords = []
        if department == 'Computer Science':
            tech_keywords = ['programming', 'algorithms', 'data', 'systems', 'software', 
                            'AI', 'networks', 'security', 'web', 'cloud']
            keywords = np.random.choice(tech_keywords, size=np.random.randint(2, 5), replace=False).tolist()
        elif department == 'Mathematics':
            math_keywords = ['calculus', 'algebra', 'geometry', 'statistics', 'analysis', 
                            'probability', 'discrete', 'optimization', 'equations']
            keywords = np.random.choice(math_keywords, size=np.random.randint(2, 5), replace=False).tolist()
        else:
            # Generate generic keywords based on department and course name
            potential_keywords = department.lower().split() + name.lower().split()
            keywords = np.random.choice(potential_keywords, size=min(4, len(potential_keywords)), replace=False).tolist()
        
        # Generate prerequisites
        if course_level > 100:
            # Higher level courses have prerequisites
            # Fix for ValueError: low >= high by ensuring max value is at least 1
            max_prereqs = max(1, min(3, i//10 + 1))
            n_prereqs = np.random.randint(1, max_prereqs + 1) if i > 0 else 0
            
            # Only add prerequisites if there are previous courses to choose from
            if i > 0 and n_prereqs > 0:
                prerequisites = np.random.choice(course_ids[:i], size=min(n_prereqs, len(course_ids[:i])), replace=False).tolist()
            else:
                prerequisites = []
        else:
            # Introductory courses don't have prerequisites
            prerequisites = []
        
        # Generate credit hours
        credits = np.random.choice([1, 2, 3, 4], p=[0.1, 0.1, 0.7, 0.1])
        
        # Generate course description (simplified)
        description = f"This {difficulty} level course covers topics in {name.lower()} for {department.lower()} students."
        
        # Generate course ratings
        avg_rating = round(3.0 + np.random.normal(scale=0.5), 1)
        avg_rating = min(5.0, max(1.0, avg_rating))  # Ensure rating is between 1 and 5
        rating_count = np.random.randint(10, 200)
        
        # Add row to data collection
        data_rows.append({
            'course_id': course_id,
            'course_code': code,
            'course_name': name,
            'department': department,
            'description': description,
            'prerequisites': prerequisites,
            'level': course_level,
            'difficulty': difficulty,
            'credits': credits,
            'keywords': keywords,
            'avg_rating': avg_rating,
            'rating_count': rating_count
        })
    
    # Convert to DataFrame
    df = pd.DataFrame(data_rows)
    
    return df

def generate_student_data(n_students=200, n_courses=100):
    """
    Generate synthetic student data including course history
    
    Parameters:
    n_students (int): Number of students to generate
    n_courses (int): Number of existing courses to reference
    
    Returns:
    pd.DataFrame: DataFrame containing synthetic student data
    """
    # Set random seed for reproducibility
    np.random.seed(43)
    
    # Generate student IDs
    student_ids = [f'S{1000 + i}' for i in range(n_students)]
    
    # Define majors and associate with departments
    majors = {
        'Computer Science': ['Computer Science', 'Data Science', 'Information Technology', 'Cybersecurity'],
        'Mathematics': ['Mathematics', 'Applied Mathematics', 'Statistics'],
        'Engineering': ['Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering'],
        'Physics': ['Physics', 'Applied Physics', 'Astronomy'],
        'Business': ['Business Administration', 'Finance', 'Marketing', 'Accounting'],
        'Arts': ['Fine Arts', 'Music', 'Theater', 'Graphic Design'],
        'Social Sciences': ['Psychology', 'Sociology', 'Political Science', 'Economics'],
        'Biology': ['Biology', 'Microbiology', 'Biochemistry'],
        'Chemistry': ['Chemistry', 'Biochemistry']
    }
    
    # Flatten major list
    all_majors = [major for dept_majors in majors.values() for major in dept_majors]
    
    # Generate course IDs
    course_ids = [f'COURSE{1000 + i}' for i in range(n_courses)]
    
    # Generate student data
    student_data_rows = []
    course_history_rows = []
    
    for i, student_id in enumerate(student_ids):
        # Assign random major
        major = np.random.choice(all_majors)
        
        # Find associated department
        department = next((dept for dept, dept_majors in majors.items() if major in dept_majors), None)
        
        # Randomly assign year of study (1-4)
        year_of_study = np.random.randint(1, 5)
        
        # Generate cumulative GPA (between 2.0 and 4.0, with most students having decent GPA)
        gpa = round(2.0 + np.random.beta(5, 2) * 2.0, 2)  # Beta distribution skewed toward higher GPAs
        
        # Generate number of completed courses based on year
        completed_courses_count = min(year_of_study * 8 + np.random.randint(-2, 3), n_courses)
        
        # Generate preference profile
        topic_interests = []
        # Higher probability of being interested in topics from own department
        if department == 'Computer Science':
            if np.random.random() < 0.8:  # 80% chance
                topic_interests.append('programming')
            if np.random.random() < 0.7:
                topic_interests.append('data')
            if np.random.random() < 0.5:
                topic_interests.append('algorithms')
        elif department == 'Mathematics':
            if np.random.random() < 0.8:
                topic_interests.append('algebra')
            if np.random.random() < 0.7:
                topic_interests.append('calculus')
        # Add some random interests
        all_topics = ['programming', 'data', 'algorithms', 'algebra', 'calculus', 
                      'mechanics', 'economics', 'biology', 'chemistry', 'art', 'music']
        random_topics = np.random.choice(all_topics, size=np.random.randint(1, 3), replace=False)
        topic_interests.extend([topic for topic in random_topics if topic not in topic_interests])
        
        # Create student profile
        student_data_rows.append({
            'student_id': student_id,
            'major': major,
            'department': department,
            'year_of_study': year_of_study,
            'gpa': gpa,
            'completed_courses_count': completed_courses_count,
            'topic_interests': topic_interests
        })
        
        # Generate course history
        # Bias toward taking courses from their department
        dept_courses = [i for i in range(n_courses) if i % len(majors) == list(majors.keys()).index(department)]
        other_courses = [i for i in range(n_courses) if i not in dept_courses]
        
        # 70% of courses from their department, 30% from other departments
        n_dept_courses = int(completed_courses_count * 0.7)
        n_other_courses = completed_courses_count - n_dept_courses
        
        # Select actual courses
        selected_dept_courses = np.random.choice(dept_courses, size=min(n_dept_courses, len(dept_courses)), replace=False)
        selected_other_courses = np.random.choice(other_courses, size=min(n_other_courses, len(other_courses)), replace=False)
        selected_courses = np.concatenate([selected_dept_courses, selected_other_courses])
        
        # Add course history
        for course_idx in selected_courses:
            course_id = f'COURSE{1000 + course_idx}'
            
            # Generate grade (correlated with overall GPA but with some variation)
            grade_scale = {'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 
                          'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0}
            grade_letters = list(grade_scale.keys())
            grade_values = list(grade_scale.values())
            
            # Higher probability of getting a grade close to their GPA
            grade_probs = []
            for value in grade_values:
                # Calculate probability based on distance from GPA
                # Closer to GPA = higher probability
                distance = abs(gpa - value)
                if value > gpa:  # Less likely to exceed their GPA
                    distance *= 1.5
                grade_probs.append(max(0.01, 1.0 - distance/4.0))
                
            # Normalize probabilities
            grade_probs = np.array(grade_probs) / sum(grade_probs)
            
            grade_letter = np.random.choice(grade_letters, p=grade_probs)
            grade_value = grade_scale[grade_letter]
            
            # Generate term (semester and year)
            # More recent terms for higher years
            year_offset = max(0, year_of_study - 1 - np.random.randint(0, year_of_study))
            term_year = 2025 - year_offset
            term_semester = np.random.choice(['Fall', 'Spring'])
            
            # Generate rating (if they rated)
            if np.random.random() < 0.7:  # 70% chance of rating
                rating = np.random.randint(1, 6)  # 1-5 rating
            else:
                rating = None
                
            course_history_rows.append({
                'student_id': student_id,
                'course_id': course_id,
                'term': f"{term_semester} {term_year}",
                'grade_letter': grade_letter,
                'grade_value': grade_value,
                'student_rating': rating
            })
    
    # Convert to DataFrames
    students_df = pd.DataFrame(student_data_rows)
    course_history_df = pd.DataFrame(course_history_rows)
    
    return students_df, course_history_df

def save_dataset(output_dir=None):
    """Generate and save the datasets to CSV files"""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.realpath(__file__))
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(output_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Generate datasets
    n_courses = 100
    n_students = 200
    
    # Generate courses dataset
    courses_df = generate_course_data(n_courses)
    
    # Generate student data and course history
    students_df, course_history_df = generate_student_data(n_students, n_courses)
    
    # Convert list fields to strings for CSV storage
    courses_df['prerequisites_str'] = courses_df['prerequisites'].apply(lambda x: json.dumps(x))
    courses_df['keywords_str'] = courses_df['keywords'].apply(lambda x: json.dumps(x))
    courses_csv = courses_df.drop(columns=['prerequisites', 'keywords']).rename(
        columns={'prerequisites_str': 'prerequisites', 'keywords_str': 'keywords'})
    
    students_df['topic_interests_str'] = students_df['topic_interests'].apply(lambda x: json.dumps(x))
    students_csv = students_df.drop(columns=['topic_interests']).rename(
        columns={'topic_interests_str': 'topic_interests'})
    
    # Save to CSV
    courses_csv.to_csv(os.path.join(data_dir, 'courses.csv'), index=False)
    students_csv.to_csv(os.path.join(data_dir, 'students.csv'), index=False)
    course_history_df.to_csv(os.path.join(data_dir, 'course_history.csv'), index=False)
    
    print(f"Dataset created: {len(courses_csv)} courses, {len(students_csv)} students, {len(course_history_df)} course history records")
    return courses_df, students_df, course_history_df

if __name__ == "__main__":
    save_dataset()