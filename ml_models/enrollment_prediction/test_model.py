#!/usr/bin/env python3
"""
Test script for Enrollment Prediction model
"""
import os
import sys
import numpy as np
import pandas as pd
from model import EnrollmentPredictor

def main():
    print("Testing Enrollment Prediction Model")
    print("="*50)
    
    # Initialize model
    model = EnrollmentPredictor()
    
    # Get path to data directory
    current_dir = os.path.dirname(os.path.realpath(__file__))
    data_dir = os.path.join(current_dir, 'data')
    model_dir = os.path.join(current_dir, 'models')
    
    # Check if trained model exists
    model_exists = False
    if os.path.exists(model_dir):
        for model_file in ['feature_model.pkl', 'time_series_models.pkl', 'fallback_model.pkl']:
            if os.path.exists(os.path.join(model_dir, model_file)):
                model_exists = True
                break
    
    if not model_exists:
        print("\nNo trained model found. Training a new model...")
        
        # Check if data exists
        required_files = ['course_enrollments.csv', 'course_metadata.csv']
        if not all(os.path.exists(os.path.join(data_dir, file)) for file in required_files):
            print("Required data files not found. Generating dataset...")
            
            # Create data directory if it doesn't exist
            os.makedirs(data_dir, exist_ok=True)
            
            # Import and run dataset generation
            sys.path.insert(0, current_dir)
            from generate_dataset import save_dataset
            save_dataset()
            print("Dataset generated successfully.")
        
        # Train model
        print("\nTraining model...")
        train_metrics = model.train(data_dir)
        print("\nTraining completed with metrics:")
        print(f"Mean Squared Error: {train_metrics['mse']:.4f}")
        print(f"Root Mean Squared Error: {train_metrics['rmse']:.4f}")
        print(f"Mean Absolute Error: {train_metrics['mae']:.4f}")
        print(f"R² Score: {train_metrics['r2']:.4f}")
        print(f"Mean Absolute Percentage Error: {train_metrics['mape']:.2f}%")
        
        # Print department metrics
        print("\nDepartment-specific metrics:")
        for dept, metrics in train_metrics['department_metrics'].items():
            print(f"{dept}: RMSE = {metrics['rmse']:.2f}, MAPE = {metrics['mape']:.2f}%")
    else:
        # Load data for next step
        print("\nLoading data...")
        model.load_data(data_dir)
        print("Data loaded successfully.")
    
    # Test enrollment prediction for next semester
    print("\nPredicting enrollments for next semester...")
    next_semester = model.next_semester
    
    # Make sure model is loaded or trained before making predictions
    if model.feature_model is None:
        if model_exists:
            # If model files exist but weren't loaded correctly, try loading them now
            print("Loading existing model...")
            if not model.load_models():
                print("Error loading models. Training a new model...")
                train_metrics = model.train(data_dir)
        else:
            # Train the model if it wasn't trained earlier
            print("Training model for predictions...")
            train_metrics = model.train(data_dir)
    
    # Now attempt predictions with the loaded/trained model
    predictions = model.predict_enrollment(semester=next_semester)
    
    # Display top 10 courses by predicted enrollment
    print(f"\nTop 10 courses by predicted enrollment for {next_semester}:")
    if len(predictions) > 0:
        for i, row in predictions.head(10).iterrows():
            print(f"{row['course_id']} - {row['course_name']}: {int(row['predicted_enrollment'])} students (Confidence: {row['confidence']:.2f})")
    else:
        print("No predictions generated.")
    
    # Predict enrollments for a specific department
    if model.departments:
        sample_dept = model.departments[0]
        print(f"\nPredictions for {sample_dept} department:")
        dept_predictions = model.predict_enrollment(department=sample_dept)
        if len(dept_predictions) > 0:
            for i, row in dept_predictions.head(5).iterrows():
                print(f"{row['course_id']} - {row['course_name']}: {int(row['predicted_enrollment'])} students")
        else:
            print("No predictions for this department.")
    
    # Test prediction for various course levels
    print("\nEnrollment predictions by course level:")
    level_predictions = {}
    for level in model.course_levels[:3] if model.course_levels else []:
        level_predictions[level] = []
        courses_for_level = model.course_metadata[model.course_metadata['course_level'] == level]['course_id'].tolist()[:3]
        
        for course_id in courses_for_level:
            pred = model.predict_enrollment(course_id=course_id)
            if not pred.empty:
                level_predictions[level].append(pred.iloc[0])
    
    # Display course level predictions
    for level, preds in level_predictions.items():
        if preds:
            print(f"\nLevel {level} courses:")
            for pred in preds:
                print(f"{pred['course_id']} - {pred['course_name']}: {int(pred['predicted_enrollment'])} students")
    
    # Display overall statistics about predictions
    print("\nOverall prediction statistics:")
    if len(predictions) > 0:
        total_enrollment = predictions['predicted_enrollment'].sum()
        avg_enrollment = predictions['predicted_enrollment'].mean()
        print(f"Total predicted enrollment: {int(total_enrollment)} students")
        print(f"Average class size: {avg_enrollment:.1f} students")
        print(f"Number of courses offered: {len(predictions)}")
        
        # Display prediction method statistics
        method_counts = predictions['prediction_method'].value_counts()
        print("\nPrediction methods used:")
        for method, count in method_counts.items():
            print(f"{method}: {count} courses ({count/len(predictions)*100:.1f}%)")
    else:
        print("No predictions available for statistics.")
    
    print("\nTest completed successfully!")
    
    # Verify visualization outputs
    plots_dir = os.path.join(model_dir, 'plots')
    if os.path.exists(plots_dir):
        print(f"\nVisualization plots saved in: {plots_dir}")
        print("Available plots:")
        for plot in os.listdir(plots_dir):
            print(f"- {plot}")

if __name__ == "__main__":
    main()