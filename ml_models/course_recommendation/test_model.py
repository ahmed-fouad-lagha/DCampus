#!/usr/bin/env python3
"""
Test script for Course Recommendation model
"""
import os
import sys
import pandas as pd
from model import CourseRecommendationSystem

def main():
    print("Testing Course Recommendation System")
    print("="*50)
    
    # Initialize model
    model = CourseRecommendationSystem()
    
    # Get paths to data files
    current_dir = os.path.dirname(os.path.realpath(__file__))
    courses_path = os.path.join(current_dir, 'data', 'courses.csv')
    students_path = os.path.join(current_dir, 'data', 'students.csv')
    course_history_path = os.path.join(current_dir, 'data', 'course_history.csv')
    
    # Check if trained model exists
    model_exists = model.load_model()
    
    if not model_exists:
        print("\nNo trained model found. Training a new model...")
        # Check if training data exists
        if not (os.path.exists(courses_path) and os.path.exists(students_path) and os.path.exists(course_history_path)):
            print("Training data not found. Generating dataset...")
            # Import and run dataset generation
            sys.path.insert(0, current_dir)
            from generate_dataset import save_dataset
            save_dataset()
            print("Dataset generated successfully.")
        
        # Train model
        print("\nTraining model...")
        train_metrics = model.train(courses_path, students_path, course_history_path)
        print("\nTraining completed with metrics:")
        print(f"Number of students: {train_metrics['n_students']}")
        print(f"Number of courses: {train_metrics['n_courses']}")
        print(f"Number of interactions: {train_metrics['n_interactions']}")
        print(f"Course content features: {train_metrics['course_content_features']}")
        print(f"Top popular courses: {', '.join(train_metrics['popular_courses'])}")
    else:
        print("\nLoaded existing trained model.")
        
        # Load the datasets for evaluation
        print("\nLoading datasets for evaluation...")
        model.load_data(courses_path, students_path, course_history_path)
    
    # Evaluate model
    print("\nEvaluating recommendation system...")
    eval_metrics = model.evaluate()
    
    # Display evaluation metrics
    print("\nEvaluation Results:")
    if 'error' in eval_metrics:
        print(f"Error: {eval_metrics['error']}")
    else:
        print(f"Hit Rate: {eval_metrics['hit_rate']:.4f}")
        print(f"Precision@5: {eval_metrics['precision_at_5']:.4f}")
        print(f"Precision@10: {eval_metrics['precision_at_10']:.4f}")
        print(f"Mean Reciprocal Rank (MRR): {eval_metrics['mrr']:.4f}")
        print(f"Number of test students: {eval_metrics['num_test_students']}")
    
    # Test with sample student
    print("\nTesting recommendations for sample students...")
    
    # Get a few sample student IDs
    if model.students_df is not None:
        sample_student_ids = model.students_df['student_id'].iloc[:3].tolist()
        
        for student_id in sample_student_ids:
            print(f"\nRecommendations for student {student_id}:")
            
            # Get recommendations
            recommendations = model.recommend_courses(student_id, limit=5)
            
            # Print recommendations
            for i, rec in enumerate(recommendations, 1):
                print(f"{i}. {rec['courseName']} ({rec['courseCode']}) - Match: {rec['matchScore']}%")
            
            print("\nTrying different difficulty filters:")
            for difficulty in ['introductory', 'intermediate']:
                filtered_recs = model.recommend_courses(
                    student_id, limit=3, difficulty_filter=difficulty)
                print(f"\n{difficulty.title()} level courses:")
                for i, rec in enumerate(filtered_recs, 1):
                    print(f"{i}. {rec['courseName']} ({rec['courseCode']}) - Match: {rec['matchScore']}%")
    else:
        print("No student data available for recommendation testing.")
    
    print("\nTest completed successfully!")
    
    # Verify visualization outputs
    plots_dir = os.path.join(current_dir, 'models', 'plots')
    if os.path.exists(plots_dir):
        print(f"\nVisualization plots saved in: {plots_dir}")
        print("Available plots:")
        for plot in os.listdir(plots_dir):
            print(f"- {plot}")

if __name__ == "__main__":
    main()