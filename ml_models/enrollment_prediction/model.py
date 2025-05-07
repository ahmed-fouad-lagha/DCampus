import os
import json
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import statsmodels.api as sm
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing

class EnrollmentPredictor:
    """
    Model for predicting future course enrollments based on historical data
    """
    def __init__(self, model_dir=None):
        """
        Initialize the enrollment prediction model
        
        Args:
            model_dir: Directory to save/load model files
        """
        if model_dir is None:
            self.model_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'models')
        else:
            self.model_dir = model_dir
        
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Model components
        self.feature_model = None  # For courses with sufficient history
        self.time_series_models = {}  # Course-specific time series models
        self.fallback_model = None  # For courses with limited or no history
        
        # Preprocessors
        self.feature_preprocessor = None
        self.scaler = None
        
        # Cache course metadata
        self.course_metadata = None
        self.historical_data = None
        self.departments = None
        self.course_levels = None
        self.semesters = None
        self.next_semester = None
    
    def load_data(self, data_dir):
        """
        Load and preprocess enrollment data
        
        Args:
            data_dir: Directory containing CSV data files
            
        Returns:
            DataFrame with processed data
        """
        enrollments_path = os.path.join(data_dir, 'course_enrollments.csv')
        metadata_path = os.path.join(data_dir, 'course_metadata.csv')
        university_path = os.path.join(data_dir, 'university_stats.csv')
        department_path = os.path.join(data_dir, 'department_stats.csv')
        
        if not os.path.exists(enrollments_path):
            raise FileNotFoundError(f"Course enrollments file not found at {enrollments_path}")
        
        # Load core data
        enrollments_df = pd.read_csv(enrollments_path)
        
        # Load metadata if available
        if os.path.exists(metadata_path):
            self.course_metadata = pd.read_csv(metadata_path)
        else:
            # Create metadata from enrollments data
            self.course_metadata = enrollments_df[['course_id', 'department', 'course_level', 'course_name']].drop_duplicates()
            
        # Load university stats if available
        uni_stats = None
        if os.path.exists(university_path):
            uni_stats = pd.read_csv(university_path)
            
        # Load department stats if available
        dept_stats = None
        if os.path.exists(department_path):
            dept_stats = pd.read_csv(department_path)
        
        # Cache important data for predictions
        self.historical_data = enrollments_df
        self.departments = enrollments_df['department'].unique().tolist()
        self.course_levels = sorted(enrollments_df['course_level'].unique().tolist())
        self.semesters = sorted(enrollments_df['semester'].unique().tolist())
        
        # Determine next semester
        self.next_semester = self._get_next_semester(self.semesters[-1])
        
        # Enhance data with additional features if stats are available
        if uni_stats is not None:
            enrollments_df = pd.merge(enrollments_df, uni_stats, on='semester', how='left')
            
        if dept_stats is not None:
            enrollments_df = pd.merge(
                enrollments_df,
                dept_stats.rename(columns={
                    'total_enrollment': 'department_total_enrollment',
                    'avg_enrollment': 'department_avg_enrollment',
                    'courses_offered': 'department_courses_offered'
                }),
                on=['semester', 'department'],
                how='left'
            )
        
        # Extract semester and year information
        enrollments_df['is_fall'] = enrollments_df['semester'].apply(lambda x: 1 if x.startswith('Fall') else 0)
        enrollments_df['year'] = enrollments_df['semester'].apply(lambda x: int(x.split(' ')[1]))
        
        # Create lagged features for time-series modeling
        # Lag 1: Previous semester
        # Lag 2: Same semester last year
        courses = enrollments_df['course_id'].unique()
        enrollments_with_lags = []
        
        for course_id in courses:
            course_data = enrollments_df[enrollments_df['course_id'] == course_id].copy()
            course_data = course_data.sort_values('semester_index')
            
            # Previous semester enrollment
            course_data['prev_enrollment'] = course_data['enrollment'].shift(1)
            
            # Same semester last year (2 semesters ago)
            course_data['prev_year_enrollment'] = course_data['enrollment'].shift(2)
            
            # Add to result
            enrollments_with_lags.append(course_data)
            
        combined_df = pd.concat(enrollments_with_lags)
        
        # Fill missing values (first semester for each course)
        # Use department average as fallback
        dept_avg = combined_df.groupby(['department', 'semester'])['enrollment'].mean().reset_index()
        dept_avg = dept_avg.rename(columns={'enrollment': 'dept_avg_enrollment'})
        
        combined_df = pd.merge(combined_df, dept_avg, on=['department', 'semester'], how='left')
        
        # Fill NaN values with department average
        for col in ['prev_enrollment', 'prev_year_enrollment']:
            mask = pd.isna(combined_df[col])
            combined_df.loc[mask, col] = combined_df.loc[mask, 'dept_avg_enrollment']
            
            # If still NA, use course's own enrollment (for the first entry)
            mask = pd.isna(combined_df[col])
            combined_df.loc[mask, col] = combined_df.loc[mask, 'enrollment']
        
        # If there are still NA values, fill with mean enrollment
        mean_enrollment = combined_df['enrollment'].mean()
        for col in ['prev_enrollment', 'prev_year_enrollment']:
            combined_df[col] = combined_df[col].fillna(mean_enrollment)
        
        return combined_df
    
    def _get_next_semester(self, last_semester):
        """
        Get the next semester after the last one in the dataset
        
        Args:
            last_semester: String representing the last semester in the dataset
            
        Returns:
            String representing the next semester
        """
        semester_type, year = last_semester.split(" ")
        year = int(year)
        
        if semester_type == "Fall":
            return f"Spring {year + 1}"
        else:  # Spring
            return f"Fall {year}"
    
    def train(self, data_dir, evaluation_pct=0.2, time_series_min_points=4):
        """
        Train the enrollment prediction model
        
        Args:
            data_dir: Directory containing CSV data files
            evaluation_pct: Percentage of data to use for evaluation
            time_series_min_points: Minimum number of data points required for time series modeling
            
        Returns:
            Dictionary of training metrics
        """
        # Load and preprocess data
        enrollments_df = self.load_data(data_dir)
        
        # Split data for evaluation
        # For time series, we'll use the last N% semesters for evaluation
        # For regression, we'll use random N% of courses for evaluation
        
        # Identify unique semesters and sort them
        semesters = sorted(enrollments_df['semester'].unique())
        cutoff_idx = int(len(semesters) * (1 - evaluation_pct))
        train_semesters = semesters[:cutoff_idx]
        eval_semesters = semesters[cutoff_idx:]
        
        # Split datasets
        train_df = enrollments_df[enrollments_df['semester'].isin(train_semesters)].copy()
        eval_df = enrollments_df[enrollments_df['semester'].isin(eval_semesters)].copy()
        
        # Train different model types
        # 1. Feature-based model (Random Forest)
        self._train_feature_model(train_df)
        
        # 2. Course-specific time series models
        self._train_time_series_models(enrollments_df, time_series_min_points)
        
        # 3. Fallback model for new courses
        self._train_fallback_model(train_df)
        
        # Evaluate models
        eval_metrics = self.evaluate(eval_df)
        
        # Save models
        self.save_models()
        
        return eval_metrics
    
    def _train_feature_model(self, train_df):
        """Train a feature-based regression model for enrollment prediction"""
        
        # Select features
        features = [
            'course_level', 'department', 'is_fall', 'year',
            'prev_enrollment', 'prev_year_enrollment'
        ]
        
        # If we have university/department stats, add them
        extra_features = [
            'total_enrollment', 'avg_enrollment', 'courses_offered',
            'department_total_enrollment', 'department_avg_enrollment', 'department_courses_offered'
        ]
        for feature in extra_features:
            if feature in train_df.columns:
                features.append(feature)
        
        # Separate target variable
        X = train_df[features].copy()
        y = train_df['enrollment']
        
        # Create preprocessor
        categorical_features = ['department']
        numeric_features = [f for f in features if f != 'department']
        
        categorical_transformer = OneHotEncoder(handle_unknown='ignore')
        numeric_transformer = StandardScaler()
        
        self.feature_preprocessor = ColumnTransformer(
            transformers=[
                ('cat', categorical_transformer, categorical_features),
                ('num', numeric_transformer, numeric_features)
            ])
        
        # Create and train model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        # Create pipeline
        pipeline = Pipeline(steps=[
            ('preprocessor', self.feature_preprocessor),
            ('regressor', model)
        ])
        
        # Train model
        pipeline.fit(X, y)
        self.feature_model = pipeline
    
    def _train_time_series_models(self, enrollments_df, min_points=4):
        """Train time series models for courses with sufficient history"""
        
        # Group data by course
        for course_id in enrollments_df['course_id'].unique():
            course_data = enrollments_df[enrollments_df['course_id'] == course_id]
            
            # Only use courses with enough data points
            if len(course_data) >= min_points:
                self._train_course_time_series(course_id, course_data)
    
    def _train_course_time_series(self, course_id, course_data):
        """Train a time series model for a specific course"""
        # Sort by semester index
        course_data = course_data.sort_values('semester_index')
        
        # Check if the data has a clear seasonal pattern
        is_seasonal = self._check_seasonality(course_data)
        
        try:
            if is_seasonal:
                # Use Holt-Winters Exponential Smoothing for seasonal data
                # Seasonal period of 2 for Fall/Spring pattern
                model = ExponentialSmoothing(
                    course_data['enrollment'].values,
                    seasonal='add',  # additive seasonality
                    seasonal_periods=2
                ).fit()
            else:
                # Use ARIMA model for non-seasonal data
                model = sm.tsa.ARIMA(
                    course_data['enrollment'].values,
                    order=(1, 0, 0)  # Simple AR(1) model
                ).fit()
            
            self.time_series_models[course_id] = {
                'model': model,
                'seasonal': is_seasonal,
                'last_values': course_data['enrollment'].values
            }
        except Exception as e:
            # Fallback to a simpler approach if model fitting fails
            self.time_series_models[course_id] = {
                'model': None,
                'seasonal': is_seasonal,
                'last_values': course_data['enrollment'].values,
                'error': str(e)
            }
    
    def _check_seasonality(self, course_data):
        """Check if a course has a seasonal enrollment pattern"""
        if len(course_data) < 4:
            return False
            
        # Check if there's a pattern between Fall and Spring semesters
        fall_data = course_data[course_data['is_fall'] == 1]['enrollment'].values
        spring_data = course_data[course_data['is_fall'] == 0]['enrollment'].values
        
        if len(fall_data) < 2 or len(spring_data) < 2:
            return False
        
        # Compare average enrollments
        fall_avg = np.mean(fall_data)
        spring_avg = np.mean(spring_data)
        
        # If there's a significant difference (>15%), consider it seasonal
        diff_pct = abs(fall_avg - spring_avg) / max(fall_avg, spring_avg)
        return diff_pct > 0.15
    
    def _train_fallback_model(self, train_df):
        """Train a fallback model for courses with limited or no history"""
        
        # Create a model based on department, course level, semester type
        features = ['department', 'course_level', 'is_fall']
        
        # Separate target variable
        X = train_df[features].copy()
        y = train_df['enrollment']
        
        # Create preprocessor
        categorical_features = ['department']
        numeric_features = ['course_level', 'is_fall']
        
        categorical_transformer = OneHotEncoder(handle_unknown='ignore')
        numeric_transformer = StandardScaler()
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('cat', categorical_transformer, categorical_features),
                ('num', numeric_transformer, numeric_features)
            ])
        
        # Create and train model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Create pipeline
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])
        
        # Train model
        pipeline.fit(X, y)
        self.fallback_model = pipeline
    
    def evaluate(self, eval_df):
        """
        Evaluate model performance on validation data
        
        Args:
            eval_df: DataFrame with evaluation data
            
        Returns:
            Dictionary with evaluation metrics
        """
        if self.feature_model is None:
            raise ValueError("Model must be trained first")
        
        # Make predictions using the feature-based model
        features = [
            'course_level', 'department', 'is_fall', 'year',
            'prev_enrollment', 'prev_year_enrollment'
        ]
        
        # If we have university/department stats, add them
        extra_features = [
            'total_enrollment', 'avg_enrollment', 'courses_offered',
            'department_total_enrollment', 'department_avg_enrollment', 'department_courses_offered'
        ]
        for feature in extra_features:
            if feature in eval_df.columns:
                features.append(feature)
        
        X_eval = eval_df[features].copy()
        y_true = eval_df['enrollment'].values
        
        # Make predictions
        y_pred = self.feature_model.predict(X_eval)
        
        # Calculate metrics
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        
        # Calculate per-department metrics
        dept_metrics = {}
        for dept in eval_df['department'].unique():
            dept_mask = eval_df['department'] == dept
            dept_y_true = eval_df.loc[dept_mask, 'enrollment'].values
            dept_y_pred = self.feature_model.predict(X_eval.loc[dept_mask])
            
            dept_metrics[dept] = {
                'rmse': np.sqrt(mean_squared_error(dept_y_true, dept_y_pred)),
                'mape': np.mean(np.abs((dept_y_true - dept_y_pred) / dept_y_true)) * 100
            }
        
        # Create visualizations
        self._create_evaluation_plots(eval_df, y_true, y_pred)
        
        return {
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'r2': r2,
            'mape': mape,
            'department_metrics': dept_metrics
        }
    
    def _create_evaluation_plots(self, eval_df, y_true, y_pred):
        """Create evaluation visualizations"""
        plots_dir = os.path.join(self.model_dir, 'plots')
        os.makedirs(plots_dir, exist_ok=True)
        
        # 1. Actual vs Predicted Scatter Plot
        plt.figure(figsize=(10, 8))
        plt.scatter(y_true, y_pred, alpha=0.5)
        plt.plot([0, max(y_true)], [0, max(y_true)], 'r--')
        plt.xlabel('Actual Enrollment')
        plt.ylabel('Predicted Enrollment')
        plt.title('Actual vs Predicted Enrollments')
        plt.grid(True)
        plt.savefig(os.path.join(plots_dir, 'actual_vs_predicted.png'))
        
        # 2. Error Distribution Histogram
        errors = y_true - y_pred
        plt.figure(figsize=(10, 6))
        plt.hist(errors, bins=30, alpha=0.7)
        plt.axvline(x=0, color='r', linestyle='--')
        plt.xlabel('Prediction Error')
        plt.ylabel('Frequency')
        plt.title('Distribution of Prediction Errors')
        plt.grid(True)
        plt.savefig(os.path.join(plots_dir, 'error_distribution.png'))
        
        # 3. Department-wise Performance
        dept_rmse = {}
        for dept in eval_df['department'].unique():
            dept_mask = eval_df['department'] == dept
            dept_y_true = eval_df.loc[dept_mask, 'enrollment'].values
            dept_y_pred = y_pred[dept_mask]
            dept_rmse[dept] = np.sqrt(mean_squared_error(dept_y_true, dept_y_pred))
        
        plt.figure(figsize=(12, 6))
        bars = plt.bar(dept_rmse.keys(), dept_rmse.values())
        plt.xticks(rotation=45, ha='right')
        plt.xlabel('Department')
        plt.ylabel('RMSE')
        plt.title('Prediction Error by Department')
        plt.tight_layout()
        plt.savefig(os.path.join(plots_dir, 'department_rmse.png'))
        
        # 4. Course Level Performance
        level_rmse = {}
        for level in sorted(eval_df['course_level'].unique()):
            level_mask = eval_df['course_level'] == level
            level_y_true = eval_df.loc[level_mask, 'enrollment'].values
            level_y_pred = y_pred[level_mask]
            level_rmse[level] = np.sqrt(mean_squared_error(level_y_true, level_y_pred))
        
        plt.figure(figsize=(10, 6))
        bars = plt.bar([str(k) for k in level_rmse.keys()], level_rmse.values())
        plt.xlabel('Course Level')
        plt.ylabel('RMSE')
        plt.title('Prediction Error by Course Level')
        plt.savefig(os.path.join(plots_dir, 'level_rmse.png'))
    
    def predict_enrollment(self, semester=None, course_id=None, department=None):
        """
        Predict enrollments for the next semester
        
        Args:
            semester: Target semester for prediction (default: next semester)
            course_id: Specific course to predict (None = all courses)
            department: Specific department to predict (None = all departments)
            
        Returns:
            DataFrame with enrollment predictions
        """
        if self.feature_model is None:
            raise ValueError("Model must be trained first")
        
        # If semester is not specified, use the next semester
        if semester is None:
            semester = self.next_semester
        
        # Get latest data
        latest_df = self.historical_data
        
        # Filter courses if requested
        courses = self.course_metadata
        if course_id is not None:
            courses = courses[courses['course_id'] == course_id]
        if department is not None:
            courses = courses[courses['department'] == department]
        
        # For each course, make a prediction
        predictions = []
        
        for _, course in courses.iterrows():
            course_id = course['course_id']
            
            # Check if this course is typically offered in this semester
            is_typically_offered = self._check_if_offered_in_semester(course_id, semester)
            
            if not is_typically_offered:
                continue  # Skip courses not typically offered in this semester
            
            prediction = self._predict_single_course(course_id, semester)
            predictions.append(prediction)
        
        # Convert to DataFrame
        predictions_df = pd.DataFrame(predictions)
        
        # Sort by enrollment (descending)
        if not predictions_df.empty:
            predictions_df = predictions_df.sort_values('predicted_enrollment', ascending=False)
        
        return predictions_df
    
    def _check_if_offered_in_semester(self, course_id, target_semester):
        """
        Check if a course is typically offered in a given semester
        
        Args:
            course_id: Course ID to check
            target_semester: Target semester (e.g., "Fall 2023")
            
        Returns:
            Boolean indicating if course is typically offered in this semester
        """
        course_data = self.historical_data[self.historical_data['course_id'] == course_id]
        
        if len(course_data) == 0:
            # No historical data, assume it's offered
            return True
        
        # Check if it's a fall/spring semester
        is_fall = target_semester.startswith("Fall")
        
        # Check historical pattern
        fall_semesters = course_data['semester'].str.startswith("Fall")
        spring_semesters = ~fall_semesters
        
        # If course has appeared in both fall and spring semesters, assume it's offered every semester
        if fall_semesters.sum() > 0 and spring_semesters.sum() > 0:
            return True
        
        # If it only appears in fall semesters and target is fall, or only in spring and target is spring
        if (fall_semesters.sum() > 0 and spring_semesters.sum() == 0 and is_fall) or \
           (spring_semesters.sum() > 0 and fall_semesters.sum() == 0 and not is_fall):
            return True
            
        # If it appears in neither, check if it's a new course
        if len(course_data) == 0:
            return True
            
        return False
    
    def _predict_single_course(self, course_id, target_semester):
        """
        Make prediction for a single course in a given semester
        
        Args:
            course_id: Course ID to predict
            target_semester: Target semester for prediction
            
        Returns:
            Dictionary with prediction details
        """
        course_meta = self.course_metadata[self.course_metadata['course_id'] == course_id].iloc[0]
        
        # Parse semester info
        semester_type = target_semester.split(" ")[0]  # Fall or Spring
        year = int(target_semester.split(" ")[1])
        is_fall = 1 if semester_type == "Fall" else 0
        
        # Get course history
        course_history = self.historical_data[self.historical_data['course_id'] == course_id].copy()
        
        # Try different prediction methods
        prediction = None
        confidence = 0.0
        method_used = "unknown"
        
        # Method 1: Time Series prediction if available
        if course_id in self.time_series_models and len(course_history) >= 3:
            ts_model = self.time_series_models[course_id]
            if ts_model['model'] is not None:
                try:
                    # Make forecast for the next period
                    if ts_model['seasonal']:
                        # For Holt-Winters
                        forecast = ts_model['model'].forecast(1)
                    else:
                        # For ARIMA
                        forecast = ts_model['model'].forecast(steps=1)
                    
                    prediction = max(5, round(forecast[0]))  # Ensure minimum enrollment
                    confidence = 0.8  # High confidence for course-specific model
                    method_used = "time_series"
                except Exception:
                    # If forecast fails, fall back to next method
                    pass
        
        # Method 2: Feature-based prediction
        if prediction is None and len(course_history) > 0:
            # Sort by semester index
            course_history = course_history.sort_values('semester_index')
            
            # Create prediction features
            latest_data = course_history.iloc[-1].copy()
            
            # Build feature vector
            features = {
                'course_id': course_id,
                'department': course_meta['department'],
                'course_level': course_meta['course_level'],
                'is_fall': is_fall,
                'year': year,
                'prev_enrollment': latest_data['enrollment'],
                'prev_year_enrollment': course_history['enrollment'].values[-2] if len(course_history) > 1 else latest_data['enrollment']
            }
            
            # Add extra features if available
            extra_cols = [
                'total_enrollment', 'avg_enrollment', 'courses_offered',
                'department_total_enrollment', 'department_avg_enrollment', 'department_courses_offered'
            ]
            for col in extra_cols:
                if col in latest_data and not pd.isna(latest_data[col]):
                    features[col] = latest_data[col]
            
            # Convert to DataFrame for prediction
            features_df = pd.DataFrame([features])
            
            # Select only the columns used in training
            feature_cols = [
                'course_level', 'department', 'is_fall', 'year',
                'prev_enrollment', 'prev_year_enrollment'
            ]
            
            # Add extra columns if available
            for col in extra_cols:
                if col in features_df.columns:
                    feature_cols.append(col)
            
            # Make prediction
            X = features_df[feature_cols]
            prediction = max(5, round(self.feature_model.predict(X)[0]))  # Ensure minimum enrollment
            confidence = 0.7  # Good confidence for feature-based model
            method_used = "feature_based"
        
        # Method 3: Fallback model for new courses
        if prediction is None:
            # Create basic features
            features = {
                'department': course_meta['department'],
                'course_level': course_meta['course_level'],
                'is_fall': is_fall
            }
            
            # Convert to DataFrame
            features_df = pd.DataFrame([features])
            
            # Make prediction
            prediction = max(5, round(self.fallback_model.predict(features_df)[0]))  # Ensure minimum enrollment
            confidence = 0.5  # Lower confidence for fallback model
            method_used = "fallback"
        
        # Return prediction details
        return {
            'course_id': course_id,
            'course_name': course_meta['course_name'],
            'department': course_meta['department'],
            'course_level': course_meta['course_level'],
            'semester': target_semester,
            'predicted_enrollment': int(prediction),
            'confidence': float(confidence),
            'prediction_method': method_used
        }
    
    def predict_university_trends(self, future_semesters=2):
        """
        Predict university-wide enrollment trends for future semesters
        
        Args:
            future_semesters: Number of future semesters to predict
            
        Returns:
            DataFrame with university-wide predictions
        """
        # Check if we have university stats
        if 'total_enrollment' not in self.historical_data.columns:
            # Calculate total enrollment from historical data
            uni_stats = self.historical_data.groupby('semester').agg(
                total_enrollment=('enrollment', 'sum'),
                avg_enrollment=('enrollment', 'mean'),
                courses_offered=('course_id', 'count')
            ).reset_index()
        else:
            # Use existing university stats
            uni_stats = self.historical_data[['semester', 'total_enrollment', 'avg_enrollment', 'courses_offered']].drop_duplicates()
    
    def save_models(self):
        """Save trained model components to disk"""
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Save feature-based model
        if self.feature_model is not None:
            feature_model_path = os.path.join(self.model_dir, 'feature_model.pkl')
            with open(feature_model_path, 'wb') as f:
                pickle.dump(self.feature_model, f)
        
        # Save time series models
        if self.time_series_models:
            time_series_path = os.path.join(self.model_dir, 'time_series_models.pkl')
            with open(time_series_path, 'wb') as f:
                pickle.dump(self.time_series_models, f)
        
        # Save fallback model
        if self.fallback_model is not None:
            fallback_model_path = os.path.join(self.model_dir, 'fallback_model.pkl')
            with open(fallback_model_path, 'wb') as f:
                pickle.dump(self.fallback_model, f)
        
        # Save metadata
        metadata = {
            'course_levels': self.course_levels,
            'departments': self.departments,
            'semesters': self.semesters,
            'next_semester': self.next_semester
        }
        metadata_path = os.path.join(self.model_dir, 'metadata.pkl')
        with open(metadata_path, 'wb') as f:
            pickle.dump(metadata, f)
    
    def load_models(self):
        """Load trained model components from disk"""
        feature_model_path = os.path.join(self.model_dir, 'feature_model.pkl')
        time_series_path = os.path.join(self.model_dir, 'time_series_models.pkl')
        fallback_model_path = os.path.join(self.model_dir, 'fallback_model.pkl')
        metadata_path = os.path.join(self.model_dir, 'metadata.pkl')
        
        try:
            # Load feature model
            if os.path.exists(feature_model_path):
                with open(feature_model_path, 'rb') as f:
                    self.feature_model = pickle.load(f)
            
            # Load time series models
            if os.path.exists(time_series_path):
                with open(time_series_path, 'rb') as f:
                    self.time_series_models = pickle.load(f)
            
            # Load fallback model
            if os.path.exists(fallback_model_path):
                with open(fallback_model_path, 'rb') as f:
                    self.fallback_model = pickle.load(f)
                    
            # Load metadata
            if os.path.exists(metadata_path):
                with open(metadata_path, 'rb') as f:
                    metadata = pickle.load(f)
                    if 'course_levels' in metadata:
                        self.course_levels = metadata['course_levels']
                    if 'departments' in metadata:
                        self.departments = metadata['departments']
                    if 'semesters' in metadata:
                        self.semesters = metadata['semesters']
                    if 'next_semester' in metadata:
                        self.next_semester = metadata['next_semester']
            
            # Check if models were loaded successfully
            return self.feature_model is not None and self.fallback_model is not None
        
        except Exception as e:
            print(f"Error loading models: {e}")
            return False
