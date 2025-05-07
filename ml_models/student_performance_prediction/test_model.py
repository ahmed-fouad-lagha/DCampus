#!/usr/bin/env python3
"""
Test script for Student Performance Prediction model
"""
import os
import sys
import pandas as pd
import matplotlib.pyplot as plt
from model import StudentPerformancePredictor

def main():
    print("Testing Student Performance Prediction Model")
    print("="*50)
    
    # Initialize model
    model = StudentPerformancePredictor()
    
    # Get paths to data files
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'student_train.csv')
    test_path = os.path.join(current_dir, 'data', 'student_test.csv')
    
    # Check if trained model exists
    model_exists = model.load_models()
    
    if not model_exists:
        print("\nNo trained model found. Training a new model...")
        # Check if training data exists
        if not os.path.exists(train_path):
            print("Training data not found. Generating dataset...")
            # Import and run dataset generation
            sys.path.insert(0, current_dir)
            from generate_dataset import save_dataset
            save_dataset()
            print("Dataset generated successfully.")
        
        # Train model
        print("\nTraining model...")
        train_metrics = model.train(train_path)
        print("\nTraining completed with metrics:")
        print(f"Performance MAE: {train_metrics['performance_mae']:.4f}")
        print(f"Performance R²: {train_metrics['performance_r2']:.4f}")
        print(f"Risk Accuracy: {train_metrics['risk_accuracy']:.4f}")
    else:
        print("\nLoaded existing trained model.")
    
    # Check if test data exists
    if not os.path.exists(test_path):
        print("Test data not found. Please run generate_dataset.py first.")
        return
    
    # Evaluate model on test data
    print("\nEvaluating model on test data...")
    eval_metrics = model.evaluate(test_path)
    
    # Display evaluation metrics
    print("\nEvaluation Results:")
    print(f"Performance Mean Absolute Error: {eval_metrics['performance_mae']:.4f}")
    print(f"Performance R² Score: {eval_metrics['performance_r2']:.4f}")
    print(f"Risk Level Prediction Accuracy: {eval_metrics['risk_accuracy']:.4f}")
    
    # Display risk classification report
    print("\nRisk Classification Report:")
    print(eval_metrics['risk_classification_report'])
    
    # Display feature importance
    print("\nTop Feature Importance:")
    for i, feature in enumerate(eval_metrics['feature_importance'][:4], 1):
        print(f"{i}. {feature['factor']}: {feature['weight']:.4f}")
    
    # Test with sample student data
    print("\nTesting prediction with sample student data...")
    sample_student = {
        'student_id': 'S9999',
        'attendance_rate': 0.85,
        'assignment_completion': 0.9,
        'previous_gpa': 3.2,
        'study_hours_per_week': 15,
        'resource_utilization': 0.7,
        'program': 'Computer Science',
        'year_of_study': 2
    }
    
    prediction = model.predict(sample_student)
    
    print("\nSample Student Prediction Results:")
    print(f"Predicted Grade: {prediction['predicted_grade']}")
    print(f"Risk Level: {prediction['risk_level']}")
    print(f"Confidence Score: {prediction['confidence_score']}")
    
    print("\nContributing Factors:")
    for factor in prediction['contributing_factors']:
        print(f"- {factor['factor']}: {factor['weight']}")
    
    print("\nRecommendations:")
    for rec in prediction['recommendations']:
        print(f"- {rec}")
    
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