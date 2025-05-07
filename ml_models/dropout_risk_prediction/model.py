import os
import json
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.calibration import CalibratedClassifierCV
from imblearn.over_sampling import SMOTE

class DropoutRiskPredictor:
    """
    Model for predicting student dropout risk based on academic and personal factors
    """
    def __init__(self, model_dir=None):
        """
        Initialize the dropout risk prediction model
        
        Args:
            model_dir: Directory to save/load model files
        """
        if model_dir is None:
            self.model_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'models')
        else:
            self.model_dir = model_dir
        
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Features to use in the model
        self.features = [
            'gpa', 'failed_courses', 'assignment_completion_rate', 'attendance_rate',
            'participation_score', 'resource_access_frequency', 'financial_aid',
            'outstanding_balance', 'payment_delays', 'distance_from_campus',
            'working_hours_per_week', 'family_responsibilities'
        ]
        
        # Initialize model
        self.model = None
        self.scaler = None
    
    def preprocess_data(self, df):
        """
        Preprocess the data for model training/inference
        
        Args:
            df: DataFrame with student data
            
        Returns:
            X: Features for model
            y: Target variable (if available)
        """
        # Extract features
        X = df[self.features].copy()
        
        # Extract target if available
        y = None
        if 'dropout' in df.columns:
            y = df['dropout']
        
        # Apply scaling if scaler exists
        if self.scaler is not None:
            X = self.scaler.transform(X)
            
        return X, y
    
    def train(self, train_data_path):
        """
        Train the dropout risk prediction model
        
        Args:
            train_data_path: Path to the training data CSV
            
        Returns:
            Dictionary of training metrics
        """
        # Load training data
        train_df = pd.read_csv(train_data_path)
        
        # Parse risk factors from string to list
        train_df['risk_factors'] = train_df['risk_factors'].apply(
            lambda x: json.loads(x) if isinstance(x, str) else x
        )
        
        # Preprocess data (without scaling yet)
        X_train = train_df[self.features].copy()
        y_train = train_df['dropout']
        
        # Create and fit scaler
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Handle class imbalance with SMOTE
        smote = SMOTE(random_state=42)
        X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
        
        # Train a RandomForestClassifier
        base_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        
        # Calibrate probabilities using isotonic regression
        self.model = CalibratedClassifierCV(base_model, method='isotonic', cv=5)
        self.model.fit(X_train_resampled, y_train_resampled)
        
        # Make predictions on training set
        y_pred = self.model.predict(X_train_scaled)
        y_proba = self.model.predict_proba(X_train_scaled)[:, 1]
        
        # Calculate training metrics
        train_metrics = {
            'accuracy': accuracy_score(y_train, y_pred),
            'precision': precision_score(y_train, y_pred),
            'recall': recall_score(y_train, y_pred),
            'f1_score': f1_score(y_train, y_pred),
            'roc_auc': roc_auc_score(y_train, y_proba)
        }
        
        # Save model
        self.save_model()
        
        return train_metrics
    
    def evaluate(self, test_data_path):
        """
        Evaluate the model on test data
        
        Args:
            test_data_path: Path to the test data CSV
            
        Returns:
            Dictionary of evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model must be trained or loaded first")
        
        # Load test data
        test_df = pd.read_csv(test_data_path)
        
        # Parse risk factors from string to list
        test_df['risk_factors'] = test_df['risk_factors'].apply(
            lambda x: json.loads(x) if isinstance(x, str) else x
        )
        
        # Preprocess data
        X_test, y_test = self.preprocess_data(test_df)
        
        # Make predictions
        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_proba),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'classification_report': classification_report(y_test, y_pred, output_dict=True)
        }
        
        # Create visualizations for evaluation results
        self._visualize_results(test_df, y_pred, y_proba)
        
        # Calculate feature importance
        feature_importance = self.get_feature_importance()
        metrics['feature_importance'] = feature_importance
        
        return metrics
    
    def predict_dropout_risk(self, student_data):
        """
        Predict dropout risk for a student or multiple students
        
        Args:
            student_data: Dictionary or DataFrame with student features
            
        Returns:
            Prediction results including risk level and factors
        """
        if self.model is None:
            raise ValueError("Model must be trained or loaded first")
        
        # Convert input to DataFrame if it's a dictionary
        if isinstance(student_data, dict):
            student_data = pd.DataFrame([student_data])
        
        # Ensure all required features are present
        for feature in self.features:
            if feature not in student_data:
                raise ValueError(f"Missing required feature: {feature}")
        
        # Preprocess data
        X, _ = self.preprocess_data(student_data)
        
        # Make predictions
        dropout_proba = self.model.predict_proba(X)[:, 1]
        
        # Determine risk level
        risk_levels = []
        for prob in dropout_proba:
            if prob < 0.3:
                risk_levels.append('Low')
            elif prob < 0.6:
                risk_levels.append('Medium')
            else:
                risk_levels.append('High')
        
        # Get top risk factors for each student
        risk_factors = self._get_risk_factors(student_data)
        
        # Compile results
        results = []
        for i in range(len(student_data)):
            result = {
                'student_id': student_data['student_id'].iloc[i] if 'student_id' in student_data.columns else f"S{i}",
                'dropout_probability': float(dropout_proba[i]),
                'risk_level': risk_levels[i],
                'risk_factors': risk_factors[i],
                'recommendations': self._generate_recommendations(risk_factors[i])
            }
            results.append(result)
        
        return results[0] if len(results) == 1 else results
    
    def _get_risk_factors(self, student_data):
        """
        Identify the top risk factors for each student
        
        Args:
            student_data: DataFrame with student features
            
        Returns:
            List of risk factors for each student
        """
        # Get feature importance
        feature_importance = self.get_feature_importance()
        importance_dict = {f['factor']: f['importance'] for f in feature_importance}
        
        # Normalize each feature based on its effect on risk
        risk_factors = []
        for _, student in student_data.iterrows():
            # Calculate contribution of each feature to risk
            factors_contribution = []
            
            # Academic factors
            if student['gpa'] < 2.5:
                weight = importance_dict.get('GPA', 0.1)
                severity = (2.5 - student['gpa']) / 1.0  # Scale from 0-1 for GPA from 2.5 to 1.5
                factors_contribution.append(('Low GPA', weight * severity))
            
            if student['failed_courses'] > 0:
                weight = importance_dict.get('Failed Courses', 0.1)
                severity = min(1.0, student['failed_courses'] / 3.0)  # Scale from 0-1 for 0-3 failed courses
                factors_contribution.append(('Failed courses', weight * severity))
            
            if student['assignment_completion_rate'] < 0.8:
                weight = importance_dict.get('Assignment Completion Rate', 0.1)
                severity = (0.8 - student['assignment_completion_rate']) / 0.4  # Scale from 0-1
                factors_contribution.append(('Low assignment completion', weight * severity))
            
            if student['attendance_rate'] < 0.8:
                weight = importance_dict.get('Attendance Rate', 0.1)
                severity = (0.8 - student['attendance_rate']) / 0.5  # Scale from 0-1
                factors_contribution.append(('Poor attendance', weight * severity))
            
            if student['participation_score'] < 5:
                weight = importance_dict.get('Participation Score', 0.1)
                severity = (5 - student['participation_score']) / 4.0  # Scale from 0-1
                factors_contribution.append(('Low participation', weight * severity))
            
            if student['resource_access_frequency'] < 10:
                weight = importance_dict.get('Resource Access Frequency', 0.1)
                severity = (10 - student['resource_access_frequency']) / 10.0  # Scale from 0-1
                factors_contribution.append(('Limited resource utilization', weight * severity))
            
            # Financial factors
            if student['financial_aid'] == 0:
                weight = importance_dict.get('Financial Aid', 0.1)
                factors_contribution.append(('No financial aid', weight))
            
            if student['outstanding_balance'] > 1000:
                weight = importance_dict.get('Outstanding Balance', 0.1)
                severity = min(1.0, student['outstanding_balance'] / 5000.0)  # Scale from 0-1
                factors_contribution.append(('Outstanding balance', weight * severity))
            
            if student['payment_delays'] > 1:
                weight = importance_dict.get('Payment Delays', 0.1)
                severity = min(1.0, student['payment_delays'] / 5.0)  # Scale from 0-1
                factors_contribution.append(('Payment delays', weight * severity))
            
            # Personal factors
            if student['distance_from_campus'] > 20:
                weight = importance_dict.get('Distance from Campus', 0.1)
                severity = min(1.0, (student['distance_from_campus'] - 20) / 30.0)  # Scale from 0-1
                factors_contribution.append(('Distance from campus', weight * severity))
            
            if student['working_hours_per_week'] > 20:
                weight = importance_dict.get('Working Hours per Week', 0.1)
                severity = min(1.0, (student['working_hours_per_week'] - 20) / 20.0)  # Scale from 0-1
                factors_contribution.append(('Heavy work schedule', weight * severity))
            
            if student['family_responsibilities'] > 5:
                weight = importance_dict.get('Family Responsibilities', 0.1)
                severity = min(1.0, (student['family_responsibilities'] - 5) / 5.0)  # Scale from 0-1
                factors_contribution.append(('Family responsibilities', weight * severity))
            
            # Sort factors by contribution and take the top 3
            factors_sorted = sorted(factors_contribution, key=lambda x: x[1], reverse=True)
            student_factors = [f[0] for f in factors_sorted[:3]]
            risk_factors.append(student_factors)
        
        return risk_factors
    
    def _generate_recommendations(self, risk_factors):
        """
        Generate personalized recommendations based on risk factors
        
        Args:
            risk_factors: List of risk factors for a student
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # Create specific recommendations for each risk factor
        recommendation_map = {
            'Low GPA': [
                "Schedule regular tutoring sessions for challenging courses",
                "Create a structured study schedule with dedicated time for each subject",
                "Meet with academic advisors to discuss strategies for improving grades"
            ],
            'Failed courses': [
                "Consider retaking failed courses in the next semester",
                "Join study groups for courses you find challenging",
                "Seek additional learning resources like online tutorials and practice exams"
            ],
            'Low assignment completion': [
                "Use a planner or digital tool to track assignment deadlines",
                "Break large assignments into smaller, manageable tasks",
                "Set up regular check-ins with instructors to discuss progress"
            ],
            'Poor attendance': [
                "Identify and address reasons for missing classes",
                "Set up attendance alerts and reminders",
                "Form a study buddy system for notes and accountability"
            ],
            'Low participation': [
                "Prepare discussion points before class to increase confidence in participating",
                "Schedule office hours with professors to build rapport",
                "Join smaller study groups to practice active participation"
            ],
            'Limited resource utilization': [
                "Schedule regular visits to campus learning resources",
                "Explore digital learning tools and resources available through the university",
                "Ask professors for recommended supplementary materials"
            ],
            'No financial aid': [
                "Meet with financial aid office to explore scholarship opportunities",
                "Apply for external scholarships and grants",
                "Consider work-study programs that accommodate your schedule"
            ],
            'Outstanding balance': [
                "Develop a payment plan with the bursar's office",
                "Explore emergency financial assistance programs",
                "Meet with a financial counselor to create a budget plan"
            ],
            'Payment delays': [
                "Set up automatic payment reminders",
                "Create a monthly budget that prioritizes tuition payments",
                "Explore part-time employment opportunities on campus"
            ],
            'Distance from campus': [
                "Look into carpooling options with classmates from your area",
                "Check if there are shuttle services available",
                "Explore hybrid or online course options when available"
            ],
            'Heavy work schedule': [
                "Discuss flexible scheduling options with your employer",
                "Consider reducing work hours during heavy academic periods",
                "Explore course schedules that better accommodate your work hours"
            ],
            'Family responsibilities': [
                "Investigate family support services offered by the university",
                "Create a shared responsibility schedule with family members",
                "Look into childcare services or co-ops if applicable"
            ]
        }
        
        # Get personalized recommendations for each risk factor
        for factor in risk_factors:
            if factor in recommendation_map:
                # Add one recommendation for each factor
                recommendations.append(np.random.choice(recommendation_map[factor]))
        
        # Add general recommendations if we don't have enough specific ones
        general_recommendations = [
            "Schedule regular meetings with your academic advisor",
            "Participate in peer mentoring or tutoring programs",
            "Join student groups related to your field of study",
            "Create a balanced schedule between academics, work, and personal time"
        ]
        
        # Add general recommendations if we don't have at least 3 specific ones
        while len(recommendations) < 3 and general_recommendations:
            rec = general_recommendations.pop(0)
            if rec not in recommendations:
                recommendations.append(rec)
        
        return recommendations
    
    def get_feature_importance(self):
        """
        Get feature importance from the model
        
        Returns:
            List of dictionaries with feature name and importance
        """
        if not hasattr(self.model, 'calibrated_classifiers_'):
            raise ValueError("Model must be trained first")
        
        # For CalibratedClassifierCV, try to access the base estimator
        try:
            # Try the newer scikit-learn structure
            if hasattr(self.model.calibrated_classifiers_[0], 'estimator'):
                base_model = self.model.calibrated_classifiers_[0].estimator
            # Try the older scikit-learn structure
            elif hasattr(self.model.calibrated_classifiers_[0], 'base_estimator'):
                base_model = self.model.calibrated_classifiers_[0].base_estimator
            else:
                # If we can't find it, use a simpler approach
                # Create fake feature importances (equal weight)
                importance = np.ones(len(self.features)) / len(self.features)
                
                # Create mapping between feature names and their friendly display names
                feature_display = {
                    'gpa': 'GPA',
                    'failed_courses': 'Failed Courses',
                    'assignment_completion_rate': 'Assignment Completion Rate',
                    'attendance_rate': 'Attendance Rate',
                    'participation_score': 'Participation Score',
                    'resource_access_frequency': 'Resource Access Frequency',
                    'financial_aid': 'Financial Aid',
                    'outstanding_balance': 'Outstanding Balance',
                    'payment_delays': 'Payment Delays',
                    'distance_from_campus': 'Distance from Campus',
                    'working_hours_per_week': 'Working Hours per Week',
                    'family_responsibilities': 'Family Responsibilities'
                }
                
                # Create a list of dictionaries with feature name and importance
                result = []
                for i, feature in enumerate(self.features):
                    result.append({
                        'factor': feature_display.get(feature, feature),
                        'importance': float(importance[i])
                    })
                
                return result
        except Exception as e:
            # If there's any error, use equal weights
            print(f"Error accessing feature importances: {e}. Using equal weights.")
            importance = np.ones(len(self.features)) / len(self.features)
            
            # Create mapping between feature names and their friendly display names
            feature_display = {
                'gpa': 'GPA',
                'failed_courses': 'Failed Courses',
                'assignment_completion_rate': 'Assignment Completion Rate',
                'attendance_rate': 'Attendance Rate',
                'participation_score': 'Participation Score',
                'resource_access_frequency': 'Resource Access Frequency',
                'financial_aid': 'Financial Aid',
                'outstanding_balance': 'Outstanding Balance',
                'payment_delays': 'Payment Delays',
                'distance_from_campus': 'Distance from Campus',
                'working_hours_per_week': 'Working Hours per Week',
                'family_responsibilities': 'Family Responsibilities'
            }
            
            # Create a list of dictionaries with feature name and importance
            result = []
            for i, feature in enumerate(self.features):
                result.append({
                    'factor': feature_display.get(feature, feature),
                    'importance': float(importance[i])
                })
            
            return result
            
        # Check if the base model has feature_importances_
        if hasattr(base_model, 'feature_importances_'):
            # Get feature importance
            importance = base_model.feature_importances_
        else:
            # Fall back to equal weights
            importance = np.ones(len(self.features)) / len(self.features)
        
        # Create mapping between feature names and their friendly display names
        feature_display = {
            'gpa': 'GPA',
            'failed_courses': 'Failed Courses',
            'assignment_completion_rate': 'Assignment Completion Rate',
            'attendance_rate': 'Attendance Rate',
            'participation_score': 'Participation Score',
            'resource_access_frequency': 'Resource Access Frequency',
            'financial_aid': 'Financial Aid',
            'outstanding_balance': 'Outstanding Balance',
            'payment_delays': 'Payment Delays',
            'distance_from_campus': 'Distance from Campus',
            'working_hours_per_week': 'Working Hours per Week',
            'family_responsibilities': 'Family Responsibilities'
        }
        
        # Create a list of dictionaries with feature name and importance
        result = []
        for i, feature in enumerate(self.features):
            result.append({
                'factor': feature_display.get(feature, feature),
                'importance': float(importance[i])
            })
        
        # Sort by importance (descending)
        result = sorted(result, key=lambda x: x['importance'], reverse=True)
        
        return result
    
    def save_model(self):
        """Save model components to disk"""
        os.makedirs(self.model_dir, exist_ok=True)
        
        model_path = os.path.join(self.model_dir, 'dropout_model.pkl')
        scaler_path = os.path.join(self.model_dir, 'dropout_scaler.pkl')
        
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
            
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
    
    def load_model(self):
        """Load model components from disk"""
        model_path = os.path.join(self.model_dir, 'dropout_model.pkl')
        scaler_path = os.path.join(self.model_dir, 'dropout_scaler.pkl')
        
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
                
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
                
            return True
        except FileNotFoundError:
            return False
    
    def _visualize_results(self, test_df, y_pred, y_proba):
        """
        Create visualizations for evaluation results
        
        Args:
            test_df: Test data DataFrame
            y_pred: Binary dropout predictions
            y_proba: Dropout probability predictions
        """
        os.makedirs(os.path.join(self.model_dir, 'plots'), exist_ok=True)
        
        # 1. Confusion Matrix
        cm = confusion_matrix(test_df['dropout'], y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", 
                    xticklabels=['No Dropout', 'Dropout'],
                    yticklabels=['No Dropout', 'Dropout'])
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.title('Confusion Matrix')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'confusion_matrix.png'))
        
        # 2. ROC Curve
        from sklearn.metrics import roc_curve
        fpr, tpr, _ = roc_curve(test_df['dropout'], y_proba)
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr)
        plt.plot([0, 1], [0, 1], 'k--')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'roc_curve.png'))
        
        # 3. Distribution of Risk Scores - Using direct matplotlib instead of seaborn
        plt.figure(figsize=(10, 6))
        
        # Replace problematic seaborn histplot with matplotlib's hist
        dropout_probs = y_proba[test_df['dropout'] == 1]
        no_dropout_probs = y_proba[test_df['dropout'] == 0]
        
        plt.hist(no_dropout_probs, bins=20, alpha=0.5, density=True, label='No Dropout')
        plt.hist(dropout_probs, bins=20, alpha=0.5, density=True, label='Dropout')
        
        plt.xlabel('Dropout Probability')
        plt.ylabel('Density')
        plt.legend()
        plt.title('Distribution of Predicted Dropout Probabilities')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'probability_distribution.png'))
        
        # 4. Feature Importance
        feature_importance = self.get_feature_importance()
        plt.figure(figsize=(12, 8))
        sns.barplot(
            x=[f['importance'] for f in feature_importance],
            y=[f['factor'] for f in feature_importance],
            palette='viridis'
        )
        plt.title('Feature Importance')
        plt.xlabel('Importance')
        plt.tight_layout()
        plt.savefig(os.path.join(self.model_dir, 'plots', 'feature_importance.png'))
        
        # 5. Risk Factor Distribution
        plt.figure(figsize=(12, 8))
        risk_factors_flat = []
        for factors in test_df['risk_factors']:
            if isinstance(factors, str):
                factors = json.loads(factors)
            risk_factors_flat.extend(factors)
        
        if risk_factors_flat:
            factor_counts = pd.Series(risk_factors_flat).value_counts()
            sns.barplot(x=factor_counts.values, y=factor_counts.index, palette='coolwarm')
            plt.title('Distribution of Risk Factors')
            plt.xlabel('Count')
            plt.tight_layout()
            plt.savefig(os.path.join(self.model_dir, 'plots', 'risk_factor_distribution.png'))


if __name__ == "__main__":
    # Example usage
    from generate_dataset import save_dataset
    
    # Create dataset
    df = save_dataset()
    
    # Train and evaluate model
    model = DropoutRiskPredictor()
    
    # Use the actual paths to CSV files
    current_dir = os.path.dirname(os.path.realpath(__file__))
    train_path = os.path.join(current_dir, 'data', 'dropout_train.csv')
    test_path = os.path.join(current_dir, 'data', 'dropout_test.csv')
    
    # Train model
    train_metrics = model.train(train_path)
    print(f"Training metrics: {train_metrics}")
    
    # Evaluate model
    eval_metrics = model.evaluate(test_path)
    print(f"Evaluation metrics:")
    print(f"Accuracy: {eval_metrics['accuracy']:.3f}")
    print(f"Precision: {eval_metrics['precision']:.3f}")
    print(f"Recall: {eval_metrics['recall']:.3f}")
    print(f"F1-score: {eval_metrics['f1_score']:.3f}")
    print(f"ROC AUC: {eval_metrics['roc_auc']:.3f}")
    
    # Make prediction for a sample student
    sample_student = {
        'student_id': 'S9999',
        'gpa': 2.3,
        'failed_courses': 2,
        'assignment_completion_rate': 0.65,
        'attendance_rate': 0.7,
        'participation_score': 4.5,
        'resource_access_frequency': 8.0,
        'financial_aid': 0,
        'outstanding_balance': 1200.0,
        'payment_delays': 1,
        'distance_from_campus': 15.0,
        'working_hours_per_week': 25.0,
        'family_responsibilities': 4.5
    }
    
    prediction = model.predict_dropout_risk(sample_student)
    print("\nSample Student Dropout Risk Prediction:")
    print(f"Student ID: {prediction['student_id']}")
    print(f"Dropout Probability: {prediction['dropout_probability']:.3f}")
    print(f"Risk Level: {prediction['risk_level']}")
    print(f"Risk Factors: {', '.join(prediction['risk_factors'])}")
    print("\nRecommendations:")
    for i, rec in enumerate(prediction['recommendations'], 1):
        print(f"{i}. {rec}")