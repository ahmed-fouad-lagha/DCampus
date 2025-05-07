import os
import sys
import json
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import our model
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
from model import CourseRecommendationSystem

# Initialize FastAPI app
app = FastAPI(
    title="Course Recommendation API",
    description="API for recommending courses to students based on their academic profile and interests",
    version="1.0.0",
)

# Initialize our model
model = CourseRecommendationSystem()

# Load pre-trained model if available
if not model.load_model():
    # If no model is found, we need to train one first
    print("No trained model found. Training a new model...")
    from generate_dataset import save_dataset
    save_dataset()
    
    current_dir = os.path.dirname(os.path.realpath(__file__))
    courses_path = os.path.join(current_dir, 'data', 'courses.csv')
    students_path = os.path.join(current_dir, 'data', 'students.csv')
    course_history_path = os.path.join(current_dir, 'data', 'course_history.csv')
    
    train_metrics = model.train(courses_path, students_path, course_history_path)
    print(f"Model trained successfully. Metrics: {train_metrics}")
else:
    print("Loaded pre-trained course recommendation model successfully.")

# Define request and response models
class CourseKeyword(BaseModel):
    keyword: str

class CourseRecommendationRequest(BaseModel):
    userId: str
    userRole: str
    limit: Optional[int] = 5
    excludeTaken: Optional[bool] = True
    difficultyFilter: Optional[str] = None

class RecommendedCourse(BaseModel):
    courseId: str
    courseName: str
    courseCode: str
    department: str
    credits: int
    difficulty: str
    description: str
    rating: Optional[float] = None
    matchScore: int
    keywords: List[str]

@app.get("/")
def root():
    return {"message": "Course Recommendation API is running"}

@app.post("/recommend/courses", response_model=List[RecommendedCourse])
def recommend_courses(request: CourseRecommendationRequest):
    try:
        # Make recommendations
        recommendations = model.recommend_courses(
            student_id=request.userId,
            limit=request.limit,
            exclude_taken=request.excludeTaken,
            difficulty_filter=request.difficultyFilter
        )
        
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/metrics")
def get_model_metrics():
    try:
        # Evaluate the model
        current_dir = os.path.dirname(os.path.realpath(__file__))
        courses_path = os.path.join(current_dir, 'data', 'courses.csv')
        students_path = os.path.join(current_dir, 'data', 'students.csv')
        course_history_path = os.path.join(current_dir, 'data', 'course_history.csv')
        
        # Make sure data is loaded
        if model.courses_df is None:
            model.load_data(courses_path, students_path, course_history_path)
        
        metrics = model.evaluate()
        
        return {
            'hitRate': round(metrics.get('hit_rate', 0), 2),
            'precisionAt5': round(metrics.get('precision_at_5', 0), 2),
            'precisionAt10': round(metrics.get('precision_at_10', 0), 2),
            'mrr': round(metrics.get('mrr', 0), 2),
            'testSamples': metrics.get('num_test_students', 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run API server
    uvicorn.run(app, host="0.0.0.0", port=8002)