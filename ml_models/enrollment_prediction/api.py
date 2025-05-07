import os
import sys
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import our model
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
from model import CourseEnrollmentPredictor

# Initialize FastAPI app
app = FastAPI(
    title="Course Enrollment Prediction API",
    description="API for predicting course enrollment for upcoming academic periods",
    version="1.0.0",
)

# Initialize our model
model = CourseEnrollmentPredictor()

# Load pre-trained model if available
if not model.load_model():
    # If no model is found, we need to train one first
    print("No trained model found. Training a new model...")
    from generate_dataset import save_dataset
    save_dataset()
    
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'enrollment_train.csv')
    
    train_metrics = model.train(train_path)
    print(f"Model trained successfully. Metrics: {train_metrics}")
else:
    print("Loaded pre-trained enrollment prediction model successfully.")

# Define request and response models
class EnrollmentPredictionRequest(BaseModel):
    courseId: str
    academicYear: str
    semester: str

class EnrollmentFactor(BaseModel):
    factor: str
    impact: float

class EnrollmentPredictionResponse(BaseModel):
    courseId: str
    academicYear: str
    semester: str
    predictedEnrollment: int
    changeFromPrevious: float
    factors: List[EnrollmentFactor]

@app.get("/")
def root():
    return {"message": "Course Enrollment Prediction API is running"}

@app.post("/predict/enrollment", response_model=EnrollmentPredictionResponse)
def predict_enrollment(request: EnrollmentPredictionRequest):
    try:
        # Make prediction
        prediction = model.predict_enrollment(
            course_id=request.courseId,
            academic_year=request.academicYear,
            semester=request.semester
        )
        
        # Return prediction as response
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/metrics")
def get_model_metrics():
    try:
        # Get test set metrics
        current_dir = os.path.dirname(os.path.realpath(__file__))
        test_path = os.path.join(current_dir, 'data', 'enrollment_test.csv')
        
        metrics = model.evaluate(test_path)
        
        return {
            'mae': round(metrics['mae'], 2),
            'rmse': round(metrics['rmse'], 2),
            'r2': round(metrics['r2'], 2),
            'errorPercentage': round(metrics['error_percentage'], 2),
            'featureImportance': metrics['feature_importance']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run API server
    uvicorn.run(app, host="0.0.0.0", port=8001)