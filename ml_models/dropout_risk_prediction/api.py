import os
import sys
import json
from typing import Dict, List, Optional, Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import our model
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
from model import DropoutRiskPredictor

# Initialize FastAPI app
app = FastAPI(
    title="Dropout Risk Prediction API",
    description="API for predicting students' risk of dropping out and providing personalized interventions",
    version="1.0.0",
)

# Initialize our model
model = DropoutRiskPredictor()

# Load pre-trained model if available
if not model.load_model():
    # If no model is found, we need to train one first
    print("No trained model found. Training a new model...")
    from generate_dataset import save_dataset
    save_dataset()
    
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'dropout_train.csv')
    
    train_metrics = model.train(train_path)
    print(f"Model trained successfully. Metrics: {train_metrics}")
else:
    print("Loaded pre-trained dropout risk prediction model successfully.")

# Define request and response models
class RiskFactorResponse(BaseModel):
    factor: str
    importance: float

class StudentRiskRequest(BaseModel):
    student_id: str
    gpa: float
    failed_courses: int
    assignment_completion_rate: float
    attendance_rate: float
    participation_score: float
    resource_access_frequency: float
    financial_aid: int
    outstanding_balance: float
    payment_delays: int
    distance_from_campus: float
    working_hours_per_week: float
    family_responsibilities: float

class StudentRiskResponse(BaseModel):
    student_id: str
    dropout_probability: float
    risk_level: str
    risk_factors: List[str]
    recommendations: List[str]

class BatchRiskRequest(BaseModel):
    students: List[StudentRiskRequest]

class ModelMetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    feature_importance: List[RiskFactorResponse]

@app.get("/")
def root():
    return {"message": "Dropout Risk Prediction API is running"}

@app.post("/predict/dropout-risk", response_model=StudentRiskResponse)
def predict_dropout_risk(request: StudentRiskRequest):
    try:
        # Convert request to dictionary
        student_data = request.dict()
        
        # Make prediction
        result = model.predict_dropout_risk(student_data)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch-risk", response_model=List[StudentRiskResponse])
def predict_batch_risk(request: BatchRiskRequest):
    try:
        # Convert request to list of dictionaries
        students_data = [student.dict() for student in request.students]
        
        # Make batch predictions
        results = model.predict_dropout_risk(students_data)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    try:
        # Evaluate the model
        current_dir = os.path.dirname(os.path.realpath(__file__))
        test_path = os.path.join(current_dir, 'data', 'dropout_test.csv')
        
        metrics = model.evaluate(test_path)
        
        # Format response
        response = {
            'accuracy': metrics['accuracy'],
            'precision': metrics['precision'],
            'recall': metrics['recall'],
            'f1_score': metrics['f1_score'],
            'roc_auc': metrics['roc_auc'],
            'feature_importance': metrics['feature_importance']
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/risk-factors", response_model=List[RiskFactorResponse])
def get_risk_factors():
    try:
        # Get feature importance
        feature_importance = model.get_feature_importance()
        return feature_importance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run API server
    uvicorn.run(app, host="0.0.0.0", port=8003)