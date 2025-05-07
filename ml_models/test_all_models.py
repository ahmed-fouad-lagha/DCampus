#!/usr/bin/env python3
"""
Master test script for all ML models in DCampus
"""
import os
import sys
import time
import subprocess
from datetime import datetime

def run_model_test(model_dir, script_name="test_model.py"):
    """
    Run a test script for a specific model
    
    Args:
        model_dir: Directory name of the model
        script_name: Name of the test script file
    """
    model_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), model_dir)
    script_path = os.path.join(model_path, script_name)
    
    if not os.path.exists(script_path):
        print(f"Test script not found: {script_path}")
        return False
    
    print(f"\n\n{'='*80}")
    print(f"Testing {model_dir} model")
    print(f"{'='*80}")
    
    # Run the test script as a subprocess
    try:
        process = subprocess.run(
            [sys.executable, script_path],
            cwd=model_path,
            check=True,
            text=True
        )
        return process.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running test for {model_dir}: {e}")
        return False

def main():
    # Record start time
    start_time = time.time()
    print(f"Starting ML model tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # List of models to test
    models = [
        'student_performance_prediction',
        'course_recommendation',
        'dropout_risk_prediction',
        'enrollment_prediction'
    ]
    
    # Run tests for each model
    results = {}
    
    for model in models:
        print(f"\nTesting {model}...")
        success = run_model_test(model)
        results[model] = "PASSED" if success else "FAILED"
    
    # Print summary of results
    print("\n\n" + "="*50)
    print("ML Model Tests Summary")
    print("="*50)
    
    all_passed = True
    for model, result in results.items():
        print(f"{model}: {result}")
        if result != "PASSED":
            all_passed = False
    
    # Print final status and time taken
    print("\nOverall Status:", "PASSED" if all_passed else "FAILED")
    print(f"Total time: {time.time() - start_time:.2f} seconds")

if __name__ == "__main__":
    main()