import os
import sys
import json
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import uvicorn

# Import our model
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
from model import StudentPerformancePredictor

# Initialize FastAPI app
app = FastAPI(
    title="Student Performance Prediction API",
    description="API for predicting student performance and providing recommendations",
    version="1.0.0",
)

# Initialize our model
model = StudentPerformancePredictor()

# Load pre-trained model if available
if not model.load_models():
    # If no model is found, we need to train one first
    print("No trained model found. Training a new model...")
    from generate_dataset import save_dataset
    train_df, test_df = save_dataset()
    
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'student_train.csv')
    
    train_metrics = model.train(train_path)
    print(f"Model trained successfully. Metrics: {train_metrics}")
else:
    print("Loaded pre-trained models successfully.")

# Define request and response models
class PredictionRequest(BaseModel):
    studentId: str
    courseId: Optional[str] = None
    attendanceRate: Optional[float] = Field(None, ge=0.0, le=1.0)
    assignmentCompletion: Optional[float] = Field(None, ge=0.0, le=1.0)
    previousGpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    studyHoursPerWeek: Optional[float] = Field(None, ge=0.0)
    resourceUtilization: Optional[float] = Field(None, ge=0.0, le=1.0)
    program: Optional[str] = None
    yearOfStudy: Optional[int] = Field(None, ge=1, le=6)

class FactorWeight(BaseModel):
    factor: str
    weight: float

class PredictionResponse(BaseModel):
    studentId: str
    predictedGrade: float
    confidenceScore: float
    riskLevel: str
    contributingFactors: List[FactorWeight]
    recommendations: List[str]
    timestamp: str

@app.get("/")
def root():
    return {"message": "Student Performance Prediction API is running"}

@app.post("/predict/performance", response_model=PredictionResponse)
def predict_performance(request: PredictionRequest):
    try:
        # Convert request to model input format
        student_data = {
            'student_id': request.studentId,
            'attendance_rate': request.attendanceRate if request.attendanceRate is not None else 0.8,
            'assignment_completion': request.assignmentCompletion if request.assignmentCompletion is not None else 0.8,
            'previous_gpa': request.previousGpa if request.previousGpa is not None else 3.0,
            'study_hours_per_week': request.studyHoursPerWeek if request.studyHoursPerWeek is not None else 10,
            'resource_utilization': request.resourceUtilization if request.resourceUtilization is not None else 0.7,
            'program': request.program if request.program is not None else 'Computer Science',
            'year_of_study': request.yearOfStudy if request.yearOfStudy is not None else 2
        }
        
        # Make prediction
        prediction = model.predict(student_data)
        
        # Return prediction as response
        return {
            'studentId': prediction['student_id'],
            'predictedGrade': prediction['predicted_grade'],
            'confidenceScore': prediction['confidence_score'],
            'riskLevel': prediction['risk_level'],
            'contributingFactors': prediction['contributing_factors'],
            'recommendations': prediction['recommendations'],
            'timestamp': prediction['timestamp']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/metrics")
def get_model_metrics():
    try:
        # Get test set metrics
        current_dir = os.path.dirname(os.path.realpath(__file__))
        test_path = os.path.join(current_dir, 'data', 'student_test.csv')
        
        metrics = model.evaluate(test_path)
        
        return {
            'performanceMAE': round(metrics['performance_mae'], 2),
            'performanceR2': round(metrics['performance_r2'], 2),
            'riskAccuracy': round(metrics['risk_accuracy'], 2),
            'featureImportance': metrics['feature_importance']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run API server
    uvicorn.run(app, host="0.0.0.0", port=8000)