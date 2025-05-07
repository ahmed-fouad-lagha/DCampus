import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

class StudentPerformancePredictor:
    """
    Model for predicting student academic performance and risk levels
    """
    def __init__(self, model_dir=None):
        """
        Initialize the student performance prediction model
        
        Args:
            model_dir: Directory to save/load model files
        """
        if model_dir is None:
            self.model_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'models')
        else:
            self.model_dir = model_dir
        
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Feature columns
        self.numeric_features = [
            'attendance_rate', 
            'assignment_completion',
            'previous_gpa', 
            'study_hours_per_week',
            'resource_utilization',
            'year_of_study'
        ]
        
        self.categorical_features = ['program']
        
        # Initialize models
        self.performance_model = None  # For predicting grade (regression)
        self.risk_model = None  # For predicting risk level (classification)
        self.preprocessor = None  # For feature preprocessing
    
    def preprocess_data(self, X):
        """
        Preprocess the input data
        
        Args:
            X: Input features dataframe
            
        Returns:
            Preprocessed features
        """
        # Create preprocessor if not already created
        if self.preprocessor is None:
            numeric_transformer = StandardScaler()
            categorical_transformer = OneHotEncoder(handle_unknown='ignore')
            
            self.preprocessor = ColumnTransformer(
                transformers=[
                    ('num', numeric_transformer, self.numeric_features),
                    ('cat', categorical_transformer, self.categorical_features)
                ])
        
        # Extract features for preprocessing
        features = X[self.numeric_features + self.categorical_features]
        return self.preprocessor.transform(features)
    
    def train(self, train_data_path):
        """
        Train the student performance prediction model
        
        Args:
            train_data_path: Path to the training data CSV
            
        Returns:
            Training metrics
        """
        # Load training data
        train_df = pd.read_csv(train_data_path)
        
        # Prepare features and targets
        X = train_df[self.numeric_features + self.categorical_features]
        y_performance = train_df['current_performance']
        y_risk = train_df['risk_level']
        
        # Fit the preprocessor
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), self.numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), self.categorical_features)
            ])
        
        X_processed = self.preprocessor.fit_transform(X)
        
        # Train performance prediction model (regression)
        self.performance_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.performance_model.fit(X_processed, y_performance)
        
        # Train risk level prediction model (classification)
        self.risk_model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.risk_model.fit(X_processed, y_risk)
        
        # Calculate training metrics
        performance_pred = self.performance_model.predict(X_processed)
        risk_pred = self.risk_model.predict(X_processed)
        
        performance_mae = mean_absolute_error(y_performance, performance_pred)
        performance_r2 = r2_score(y_performance, performance_pred)
        risk_accuracy = accuracy_score(y_risk, risk_pred)
        
        # Save models
        self.save_models()
        
        return {
            'performance_mae': performance_mae,
            'performance_r2': performance_r2,
            'risk_accuracy': risk_accuracy
        }
    
    def evaluate(self, test_data_path):
        """
        Evaluate the model on test data
        
        Args:
            test_data_path: Path to the test data CSV
            
        Returns:
            Evaluation metrics
        """
        if self.performance_model is None or self.risk_model is None:
            raise ValueError("Models must be trained or loaded first")
        
        # Load test data
        test_df = pd.read_csv(test_data_path)
        
        # Prepare features and targets
        X = test_df[self.numeric_features + self.categorical_features]
        y_performance = test_df['current_performance']
        y_risk = test_df['risk_level']
        
        # Preprocess features
        X_processed = self.preprocessor.transform(X)
        
        # Make predictions
        performance_pred = self.performance_model.predict(X_processed)
        risk_pred = self.risk_model.predict(X_processed)
        
        # Calculate metrics
        performance_mae = mean_absolute_error(y_performance, performance_pred)
        performance_r2 = r2_score(y_performance, performance_pred)
        risk_accuracy = accuracy_score(y_risk, risk_pred)
        risk_report = classification_report(y_risk, risk_pred)
        
        # Visualize results
        self.visualize_results(test_df, performance_pred, risk_pred)
        
        return {
            'performance_mae': performance_mae,
            'performance_r2': performance_r2,
            'risk_accuracy': risk_accuracy,
            'risk_classification_report': risk_report,
            'feature_importance': self.get_feature_importance()
        }
    
    def predict(self, student_data):
        """
        Make predictions for a student
        
        Args:
            student_data: Dictionary or DataFrame with student features
            
        Returns:
            Prediction results including grade and risk level
        """
        if self.performance_model is None or self.risk_model is None:
            raise ValueError("Models must be trained or loaded first")
        
        # Convert input to DataFrame if it's a dictionary
        if isinstance(student_data, dict):
            student_data = pd.DataFrame([student_data])
        
        # Fill missing values with defaults if necessary
        for feature in self.numeric_features:
            if feature not in student_data:
                student_data[feature] = 0.0
                
        for feature in self.categorical_features:
            if feature not in student_data:
                student_data[feature] = 'Unknown'
        
        # Extract required features
        X = student_data[self.numeric_features + self.categorical_features]
        
        # Preprocess
        X_processed = self.preprocessor.transform(X)
        
        # Make predictions
        performance_pred = self.performance_model.predict(X_processed)
        risk_pred = self.risk_model.predict(X_processed)
        
        # Get confidence score
        # For regression we'll use a simple heuristic based on feature values
        confidence_score = 0.7 + 0.2 * (
            np.mean(student_data['attendance_rate']) + 
            np.mean(student_data['assignment_completion'])
        ) / 2
        confidence_score = min(0.95, confidence_score)
        
        # Get contributing factors
        contributing_factors = self.get_contributing_factors(student_data)
        
        # Generate recommendations based on contributing factors
        recommendations = self.generate_recommendations(contributing_factors)
        
        # Return prediction results
        return {
            'student_id': student_data['student_id'].values[0] if 'student_id' in student_data.columns else 'unknown',
            'predicted_grade': round(float(performance_pred[0]), 2),
            'risk_level': risk_pred[0],
            'confidence_score': round(float(confidence_score), 2),
            'contributing_factors': contributing_factors,
            'recommendations': recommendations,
            'timestamp': pd.Timestamp.now().isoformat()
        }
    
    def save_models(self):
        """Save trained models to disk"""
        if self.performance_model is None or self.risk_model is None:
            raise ValueError("Models must be trained first before saving")
        
        performance_model_path = os.path.join(self.model_dir, 'performance_model.pkl')
        risk_model_path = os.path.join(self.model_dir, 'risk_model.pkl')
        preprocessor_path = os.path.join(self.model_dir, 'preprocessor.pkl')
        
        with open(performance_model_path, 'wb') as f:
            pickle.dump(self.performance_model, f)
            
        with open(risk_model_path, 'wb') as f:
            pickle.dump(self.risk_model, f)
            
        with open(preprocessor_path, 'wb') as f:
            pickle.dump(self.preprocessor, f)
    
    def load_models(self):
        """Load trained models from disk"""
        performance_model_path = os.path.join(self.model_dir, 'performance_model.pkl')
        risk_model_path = os.path.join(self.model_dir, 'risk_model.pkl')
        preprocessor_path = os.path.join(self.model_dir, 'preprocessor.pkl')
        
        try:
            with open(performance_model_path, 'rb') as f:
                self.performance_model = pickle.load(f)
                
            with open(risk_model_path, 'rb') as f:
                self.risk_model = pickle.load(f)
                
            with open(preprocessor_path, 'rb') as f:
                self.preprocessor = pickle.load(f)
                
            return True
        except FileNotFoundError:
            return False
    
    def get_feature_importance(self):
        """Get feature importance from the performance model"""
        if self.performance_model is None:
            raise ValueError("Model must be trained first")
        
        # Get feature names after preprocessing
        numeric_features = self.numeric_features
        categorical_features = self.preprocessor.transformers_[1][1].get_feature_names_out(self.categorical_features)
        feature_names = np.concatenate([numeric_features, categorical_features])
        
        # Get feature importance
        importance = self.performance_model.feature_importances_
        
        # Create a list of dictionaries with feature name and importance
        result = []
        for i in range(len(importance)):
            if i < len(feature_names):
                result.append({
                    'factor': feature_names[i],
                    'weight': float(importance[i])
                })
        
        # Sort by importance
        result = sorted(result, key=lambda x: x['weight'], reverse=True)
        return result[:4]  # Return top 4 factors
    
    def get_contributing_factors(self, student_data):
        """
        Extract contributing factors for a student's performance
        
        Args:
            student_data: DataFrame with student features
            
        Returns:
            List of contributing factors with weights
        """
        if self.performance_model is None:
            raise ValueError("Model must be trained first")
        
        # Get feature importance
        feature_importance = self.get_feature_importance()
        
        # Create contributing factors
        factors = []
        for item in feature_importance:
            factor_name = item['factor']
            
            # Format factor name for display
            if factor_name == 'attendance_rate':
                display_name = 'Attendance'
            elif factor_name == 'assignment_completion':
                display_name = 'Assignment Completion'
            elif factor_name == 'previous_gpa':
                display_name = 'Previous Course Performance'
            elif factor_name == 'study_hours_per_week':
                display_name = 'Study Time'
            elif factor_name == 'resource_utilization':
                display_name = 'Learning Resource Utilization'
            elif factor_name.startswith('program_'):
                display_name = f'Program: {factor_name.split("_")[1]}'
            else:
                display_name = factor_name.replace('_', ' ').title()
            
            factors.append({
                'factor': display_name,
                'weight': round(float(item['weight']), 2)
            })
        
        return factors
    
    def generate_recommendations(self, contributing_factors):
        """
        Generate recommendations based on contributing factors
        
        Args:
            contributing_factors: List of contributing factors with weights
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        for factor in contributing_factors:
            if 'Attendance' in factor['factor']:
                recommendations.append('Improve class attendance to at least 90%')
            elif 'Assignment' in factor['factor']:
                recommendations.append('Submit assignments on time and complete all tasks')
            elif 'Previous' in factor['factor']:
                recommendations.append('Review foundational concepts from previous courses')
            elif 'Study Time' in factor['factor']:
                recommendations.append('Increase weekly study hours and create a consistent schedule')
            elif 'Resource' in factor['factor']:
                recommendations.append('Utilize available learning resources like library and online materials')
        
        # Add additional general recommendations
        general_recommendations = [
            'Participate actively in class discussions',
            'Form study groups with classmates',
            'Attend office hours for additional support',
            'Practice with sample problems regularly'
        ]
        
        # Add general recommendations if we don't have enough specific ones
        while len(recommendations) < 4 and general_recommendations:
            recommendation = general_recommendations.pop(0)
            if recommendation not in recommendations:
                recommendations.append(recommendation)
        
        return recommendations[:4]  # Limit to 4 recommendations
    
    def visualize_results(self, test_df, performance_pred, risk_pred):
        """
        Create visualizations for evaluation results
        
        Args:
            test_df: Test data DataFrame
            performance_pred: Performance predictions
            risk_pred: Risk level predictions
        """
        os.makedirs(os.path.join(self.model_dir, 'plots'), exist_ok=True)
        
        # 1. Actual vs Predicted Performance
        plt.figure(figsize=(10, 6))
        plt.scatter(test_df['current_performance'], performance_pred, alpha=0.5)
        plt.plot([0, 100], [0, 100], 'r--')
        plt.xlabel('Actual Performance')
        plt.ylabel('Predicted Performance')
        plt.title('Actual vs Predicted Student Performance')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'performance_prediction.png'))
        
        # 2. Risk Level Distribution
        plt.figure(figsize=(10, 6))
        risk_counts = pd.Series(risk_pred).value_counts()
        sns.barplot(x=risk_counts.index, y=risk_counts.values)
        plt.xlabel('Risk Level')
        plt.ylabel('Count')
        plt.title('Predicted Risk Level Distribution')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'risk_distribution.png'))
        
        # 3. Feature Importance
        feature_importance = self.get_feature_importance()
        features = [item['factor'] for item in feature_importance]
        importance = [item['weight'] for item in feature_importance]
        
        plt.figure(figsize=(12, 6))
        sns.barplot(x=importance, y=features)
        plt.xlabel('Importance')
        plt.ylabel('Feature')
        plt.title('Feature Importance')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'feature_importance.png'))


if __name__ == "__main__":
    # Example usage
    from generate_dataset import save_dataset
    
    # Create dataset
    train_df, test_df = save_dataset()
    
    # Train and evaluate model
    model = StudentPerformancePredictor()
    
    # Use the actual paths to CSV files
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'student_train.csv')
    test_path = os.path.join(current_dir, 'data', 'student_test.csv')
    
    # Train model
    train_metrics = model.train(train_path)
    print(f"Training metrics: {train_metrics}")
    
    # Evaluate model
    eval_metrics = model.evaluate(test_path)
    print(f"Evaluation metrics:")
    print(f"Performance MAE: {eval_metrics['performance_mae']:.2f}")
    print(f"Performance R²: {eval_metrics['performance_r2']:.2f}")
    print(f"Risk Level Accuracy: {eval_metrics['risk_accuracy']:.2f}")
    print("\nRisk Classification Report:")
    print(eval_metrics['risk_classification_report'])
    
    # Make prediction for a sample student
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
    print("\nSample Student Prediction:")
    print(f"Predicted Grade: {prediction['predicted_grade']}")
    print(f"Risk Level: {prediction['risk_level']}")
    print(f"Confidence Score: {prediction['confidence_score']}")
    print("\nContributing Factors:")
    for factor in prediction['contributing_factors']:
        print(f"- {factor['factor']}: {factor['weight']}")
    print("\nRecommendations:")
    for rec in prediction['recommendations']:
        print(f"- {rec}")