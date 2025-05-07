#!/usr/bin/env python3
"""
Test script for Dropout Risk Prediction model
"""
import os
import sys
import numpy as np
import pandas as pd
import json
from model import DropoutRiskPredictor

def main():
    print("Testing Dropout Risk Prediction Model")
    print("="*50)
    
    # Initialize model
    model = DropoutRiskPredictor()
    
    # Get paths to data files
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'dropout_train.csv')
    test_path = os.path.join(current_dir, 'data', 'dropout_test.csv')
    
    # Check if trained model exists
    model_exists = model.load_model()
    
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
        print(f"Accuracy: {train_metrics['accuracy']:.4f}")
        print(f"Precision: {train_metrics['precision']:.4f}")
        print(f"Recall: {train_metrics['recall']:.4f}")
        print(f"F1-score: {train_metrics['f1_score']:.4f}")
        print(f"ROC AUC: {train_metrics['roc_auc']:.4f}")
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
    print(f"Accuracy: {eval_metrics['accuracy']:.4f}")
    print(f"Precision: {eval_metrics['precision']:.4f}")
    print(f"Recall: {eval_metrics['recall']:.4f}")
    print(f"F1-score: {eval_metrics['f1_score']:.4f}")
    print(f"ROC AUC: {eval_metrics['roc_auc']:.4f}")
    
    # Print confusion matrix
    cm = eval_metrics['confusion_matrix']
    print("\nConfusion Matrix:")
    print(f"             Predicted No | Predicted Yes")
    print(f"Actual No     {cm[0][0]:11d} | {cm[0][1]:12d}")
    print(f"Actual Yes    {cm[1][0]:11d} | {cm[1][1]:12d}")
    
    # Display feature importance
    print("\nFeature Importance:")
    for i, feature in enumerate(eval_metrics['feature_importance'][:5], 1):
        print(f"{i}. {feature['factor']}: {feature['importance']:.4f}")
    
    # Test with sample student data (different risk profiles)
    print("\nTesting prediction with sample student profiles...")
    
    # Sample students with different risk profiles
    sample_students = [
        {
            'student_id': 'S9991',
            'gpa': 3.7,
            'failed_courses': 0,
            'assignment_completion_rate': 0.95,
            'attendance_rate': 0.92,
            'participation_score': 8.5,
            'resource_access_frequency': 15.0,
            'financial_aid': 1,
            'outstanding_balance': 0.0,
            'payment_delays': 0,
            'distance_from_campus': 5.0,
            'working_hours_per_week': 10.0,
            'family_responsibilities': 2.0
        },
        {
            'student_id': 'S9992',
            'gpa': 2.5,
            'failed_courses': 1,
            'assignment_completion_rate': 0.75,
            'attendance_rate': 0.80,
            'participation_score': 6.0,
            'resource_access_frequency': 10.0,
            'financial_aid': 1,
            'outstanding_balance': 500.0,
            'payment_delays': 1,
            'distance_from_campus': 18.0,
            'working_hours_per_week': 15.0,
            'family_responsibilities': 3.0
        },
        {
            'student_id': 'S9993',
            'gpa': 1.9,
            'failed_courses': 3,
            'assignment_completion_rate': 0.5,
            'attendance_rate': 0.6,
            'participation_score': 3.0,
            'resource_access_frequency': 5.0,
            'financial_aid': 0,
            'outstanding_balance': 2000.0,
            'payment_delays': 3,
            'distance_from_campus': 30.0,
            'working_hours_per_week': 30.0,
            'family_responsibilities': 7.0
        }
    ]
    
    # Make predictions for each student
    for i, student in enumerate(sample_students):
        profile_name = ["Low-risk", "Medium-risk", "High-risk"][i]
        print(f"\nPrediction for {profile_name} student (ID: {student['student_id']}):")
        
        prediction = model.predict_dropout_risk(student)
        
        print(f"Dropout Probability: {prediction['dropout_probability']:.4f}")
        print(f"Risk Level: {prediction['risk_level']}")
        print(f"Risk Factors: {', '.join(prediction['risk_factors'])}")
        
        print("Recommendations:")
        for j, rec in enumerate(prediction['recommendations'], 1):
            print(f"{j}. {rec}")
    
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