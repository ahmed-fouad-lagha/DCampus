import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
import matplotlib.pyplot as plt
import seaborn as sns

class CourseRecommendationSystem:
    """
    Course recommendation system that uses content-based filtering and collaborative filtering
    to recommend courses based on student profile, academic history, and interests
    """
    def __init__(self, model_dir=None):
        """
        Initialize the course recommendation system
        
        Args:
            model_dir: Directory to save/load model files
        """
        if model_dir is None:
            self.model_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'models')
        else:
            self.model_dir = model_dir
        
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Initialize data containers
        self.courses_df = None
        self.students_df = None
        self.course_history_df = None
        
        # Initialize model components
        self.course_content_matrix = None
        self.course_similarity_matrix = None
        self.student_course_matrix = None
        self.student_embeddings = None
        self.course_embeddings = None
        
        # Initialize preprocessors
        self.course_vectorizer = None
        self.student_preprocessor = None
    
    def load_data(self, courses_path, students_path, course_history_path):
        """
        Load data from CSV files
        
        Args:
            courses_path: Path to courses CSV file
            students_path: Path to students CSV file
            course_history_path: Path to course history CSV file
        """
        # Load data
        self.courses_df = pd.read_csv(courses_path)
        self.students_df = pd.read_csv(students_path)
        self.course_history_df = pd.read_csv(course_history_path)
        
        # Parse JSON fields
        self.courses_df['prerequisites'] = self.courses_df['prerequisites'].apply(
            lambda x: json.loads(x) if isinstance(x, str) else x)
        self.courses_df['keywords'] = self.courses_df['keywords'].apply(
            lambda x: json.loads(x) if isinstance(x, str) else x)
        self.students_df['topic_interests'] = self.students_df['topic_interests'].apply(
            lambda x: json.loads(x) if isinstance(x, str) else x)
        
        # Map any none/null values in student_rating to NaN
        self.course_history_df['student_rating'] = pd.to_numeric(
            self.course_history_df['student_rating'], errors='coerce')
    
    def preprocess_data(self):
        """
        Preprocess the data for recommendation algorithms
        """
        if self.courses_df is None or self.students_df is None or self.course_history_df is None:
            raise ValueError("Data must be loaded first using load_data()")
        
        # Create course content representation for content-based filtering
        self._create_course_content_features()
        
        # Create student-course interaction matrix for collaborative filtering
        self._create_student_course_matrix()
        
        # Create student profile features
        self._create_student_features()
    
    def _create_course_content_features(self):
        """Create features representing course content"""
        # Combine course attributes into a single text representation
        self.courses_df['content_text'] = self.courses_df.apply(
            lambda row: (
                f"{row['course_name']} {row['department']} {row['description']} " + 
                f"{' '.join(row['keywords'])} {row['difficulty']} level course"
            ), axis=1
        )
        
        # Create TF-IDF representation of course content
        self.course_vectorizer = TfidfVectorizer(
            analyzer='word',
            stop_words='english', 
            max_features=5000,
            ngram_range=(1, 2)  # Use both unigrams and bigrams
        )
        
        self.course_content_matrix = self.course_vectorizer.fit_transform(
            self.courses_df['content_text']
        )
        
        # Calculate course-course similarity matrix
        self.course_similarity_matrix = cosine_similarity(self.course_content_matrix)
    
    def _create_student_course_matrix(self):
        """Create student-course interaction matrix"""
        # Use student ratings as interaction values
        student_course_interactions = self.course_history_df[
            ['student_id', 'course_id', 'student_rating', 'grade_value']
        ].copy()
        
        # Fill missing ratings with grade-based values (scaled to 1-5)
        max_grade = 4.0  # Assuming 4.0 is the max grade value
        student_course_interactions['implied_rating'] = (
            student_course_interactions['grade_value'] / max_grade * 5
        )
        student_course_interactions['interaction_value'] = np.where(
            student_course_interactions['student_rating'].notna(),
            student_course_interactions['student_rating'],
            student_course_interactions['implied_rating']
        )
        
        # Create the student-course matrix (rows=students, columns=courses)
        self.student_course_matrix = student_course_interactions.pivot_table(
            index='student_id',
            columns='course_id',
            values='interaction_value',
            fill_value=0
        )
    
    def _create_student_features(self):
        """Create features representing student profiles"""
        # Extract relevant student features
        student_features = self.students_df[['student_id', 'major', 'department', 'year_of_study', 'gpa']].copy()
        
        # Add aggregated course history features
        course_history_agg = self.course_history_df.groupby('student_id').agg(
            avg_grade=('grade_value', 'mean'),
            courses_taken=('course_id', 'count')
        ).reset_index()
        
        student_features = pd.merge(student_features, course_history_agg, on='student_id', how='left')
        
        # Create categorical feature encoder
        categorical_features = ['major', 'department']
        numeric_features = ['year_of_study', 'gpa', 'avg_grade', 'courses_taken']
        
        self.student_preprocessor = ColumnTransformer(
            transformers=[
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
                ('num', StandardScaler(), numeric_features)
            ]
        )
        
        # Fit and transform student features
        student_features_encoded = self.student_preprocessor.fit_transform(
            student_features[categorical_features + numeric_features]
        )
        
        # Store student embeddings with their IDs
        self.student_embeddings = {
            student_id: student_features_encoded[i]
            for i, student_id in enumerate(student_features['student_id'])
        }
    
    def train(self, courses_path, students_path, course_history_path):
        """
        Train the recommendation system
        
        Args:
            courses_path: Path to courses CSV file
            students_path: Path to students CSV file
            course_history_path: Path to course history CSV file
            
        Returns:
            Dictionary of training metrics
        """
        # Load data
        self.load_data(courses_path, students_path, course_history_path)
        
        # Preprocess data
        self.preprocess_data()
        
        # Calculate additional course metadata for recommendations
        self._calculate_course_popularity()
        self._calculate_course_difficulty()
        
        # Save model components
        self.save_model()
        
        # Return metrics about the trained model
        return {
            'n_students': len(self.students_df),
            'n_courses': len(self.courses_df),
            'n_interactions': len(self.course_history_df),
            'course_content_features': self.course_content_matrix.shape[1],
            'popular_courses': self.courses_df.sort_values('popularity_score', ascending=False)['course_id'].head(5).tolist(),
        }
    
    def _calculate_course_popularity(self):
        """Calculate popularity scores for courses"""
        # Count enrollments per course
        course_enrollments = self.course_history_df.groupby('course_id').size().reset_index(name='enrollment_count')
        
        # Calculate average rating per course - only where student_rating is not null
        course_ratings = self.course_history_df[self.course_history_df['student_rating'].notna()].groupby('course_id')['student_rating'].agg(
            avg_rating='mean',
            rating_count='count'
        ).reset_index()
        
        # Merge with courses dataframe
        self.courses_df = pd.merge(self.courses_df, course_enrollments, on='course_id', how='left')
        self.courses_df = pd.merge(self.courses_df, course_ratings, on='course_id', how='left')
        
        # Fill missing values
        self.courses_df['enrollment_count'] = self.courses_df['enrollment_count'].fillna(0)
        
        # Ensure these columns exist before trying to fill them
        if 'avg_rating' not in self.courses_df.columns:
            self.courses_df['avg_rating'] = 0
        else:
            self.courses_df['avg_rating'] = self.courses_df['avg_rating'].fillna(0)
            
        if 'rating_count' not in self.courses_df.columns:
            self.courses_df['rating_count'] = 0
        else:
            self.courses_df['rating_count'] = self.courses_df['rating_count'].fillna(0)
        
        # Calculate popularity score (simple weighted formula)
        enrollment_max = max(self.courses_df['enrollment_count'].max(), 1)  # Avoid division by zero
        rating_max = 5.0
        
        self.courses_df['popularity_score'] = (
            0.7 * self.courses_df['enrollment_count'] / enrollment_max + 
            0.3 * self.courses_df['avg_rating'] / rating_max
        )
    
    def _calculate_course_difficulty(self):
        """Calculate difficulty scores for courses based on student performance"""
        # Calculate average grade per course
        course_grades = self.course_history_df.groupby('course_id')['grade_value'].agg(
            avg_grade='mean',
            grade_count='count'
        ).reset_index()
        
        # Merge with courses dataframe
        self.courses_df = pd.merge(self.courses_df, course_grades, on='course_id', how='left')
        
        # Fill missing values
        self.courses_df['avg_grade'] = self.courses_df['avg_grade'].fillna(0)
        self.courses_df['grade_count'] = self.courses_df['grade_count'].fillna(0)
        
        # Map difficulty levels to numeric values
        difficulty_map = {
            'introductory': 1,
            'intermediate': 2,
            'advanced': 3,
            'specialized': 4
        }
        self.courses_df['difficulty_num'] = self.courses_df['difficulty'].map(difficulty_map)
        
        # Calculate composite difficulty score (inverse of avg_grade, weighted with course level)
        grade_max = 4.0  # Assuming 4.0 is max grade
        grades_available = self.courses_df['grade_count'] > 5  # Need at least 5 grades
        
        # For courses with enough grades, use actual performance data
        # Otherwise, use the declared difficulty level
        self.courses_df['difficulty_score'] = np.where(
            grades_available,
            0.7 * (grade_max - self.courses_df['avg_grade']) / grade_max + 
            0.3 * self.courses_df['difficulty_num'] / 4,
            self.courses_df['difficulty_num'] / 4
        )
        
        # Normalize to 0-1
        self.courses_df['difficulty_score'] = (
            self.courses_df['difficulty_score'] - self.courses_df['difficulty_score'].min()
        ) / (self.courses_df['difficulty_score'].max() - self.courses_df['difficulty_score'].min())
    
    def recommend_courses(self, student_id, limit=5, exclude_taken=True, difficulty_filter=None):
        """
        Generate course recommendations for a student
        
        Args:
            student_id: ID of the student
            limit: Maximum number of recommendations to return
            exclude_taken: Whether to exclude courses the student has already taken
            difficulty_filter: Filter by difficulty level (e.g., 'introductory', 'intermediate')
            
        Returns:
            List of recommended course dictionaries
        """
        if self.course_similarity_matrix is None:
            raise ValueError("Model must be trained first")
        
        # Get courses already taken by this student
        taken_courses = set()
        if exclude_taken:
            taken_courses = set(self.course_history_df[
                self.course_history_df['student_id'] == student_id
            ]['course_id'].tolist())
        
        # Get student information
        student_info = self.students_df[self.students_df['student_id'] == student_id].iloc[0]
        student_major = student_info['major']
        student_department = student_info['department']
        student_year = student_info['year_of_study']
        student_interests = student_info['topic_interests']
        
        # Content-based recommendations
        content_based_recs = self._get_content_based_recommendations(
            student_id, student_interests, student_department, limit*2
        )
        
        # Get collaborative filtering recommendations if the student has taken courses
        collaborative_recs = []
        if student_id in self.student_course_matrix.index and not self.student_course_matrix.loc[student_id].sum() == 0:
            collaborative_recs = self._get_collaborative_recommendations(student_id, limit*2)
        
        # Combine recommendations (giving more weight to collaborative if available)
        all_recs = {}
        for course_id, score in content_based_recs:
            if course_id not in taken_courses:
                all_recs[course_id] = score * 0.4
        
        for course_id, score in collaborative_recs:
            if course_id not in taken_courses:
                if course_id in all_recs:
                    all_recs[course_id] += score * 0.6
                else:
                    all_recs[course_id] = score * 0.6
        
        # Filter by difficulty if specified
        filtered_courses = []
        for course_id, score in all_recs.items():
            course = self.courses_df[self.courses_df['course_id'] == course_id].iloc[0]
            
            # Apply difficulty filter if specified
            if difficulty_filter is not None and course['difficulty'] != difficulty_filter:
                continue
            
            # Check prerequisites
            prerequisites = course['prerequisites']
            prereq_met = all(prereq in taken_courses for prereq in prerequisites)
            
            # Only include courses where prerequisites are met
            if prereq_met:
                # Adjust score based on course popularity and appropriate level
                popularity_boost = course['popularity_score'] * 0.2
                
                # Level appropriateness (courses matching student's year get a boost)
                level_match = 1.0
                if course['level'] // 100 == student_year:
                    level_match = 1.2
                
                # Final score combines recommendation score with popularity and level match
                final_score = score * 0.6 + popularity_boost * 0.2 + level_match * 0.2
                
                filtered_courses.append((course_id, final_score))
        
        # Sort courses by score and take top 'limit'
        top_courses = sorted(filtered_courses, key=lambda x: x[1], reverse=True)[:limit]
        
        # Format results
        recommendations = []
        for course_id, score in top_courses:
            course = self.courses_df[self.courses_df['course_id'] == course_id].iloc[0]
            
            course_info = {
                'courseId': course_id,
                'courseName': course['course_name'],
                'courseCode': course['course_code'],
                'department': course['department'],
                'credits': course['credits'],
                'difficulty': course['difficulty'],
                'description': course['description'],
                'rating': course['avg_rating'] if not pd.isna(course['avg_rating']) else None,
                'matchScore': min(round(score * 100), 100),  # Scale to 0-100 and cap at 100
                'keywords': course['keywords']
            }
            recommendations.append(course_info)
        
        return recommendations
    
    def _get_content_based_recommendations(self, student_id, interests, department, limit=10):
        """
        Get content-based recommendations based on student interests and department
        
        Args:
            student_id: Student ID
            interests: List of student's interests
            department: Student's department
            limit: Max number of recommendations
            
        Returns:
            List of (course_id, score) tuples
        """
        # Generate query combining interests and department
        if not interests:
            query_text = department
        else:
            query_text = f"{' '.join(interests)} {department}"
        
        # Transform query to vector
        query_vector = self.course_vectorizer.transform([query_text])
        
        # Calculate similarity between query and all courses
        similarity_scores = cosine_similarity(query_vector, self.course_content_matrix)[0]
        
        # Get courses taken by this student
        student_courses = self.course_history_df[
            self.course_history_df['student_id'] == student_id
        ]['course_id'].unique()
        
        # If student has taken courses, also include similarity to those courses
        if len(student_courses) > 0:
            for course_id in student_courses:
                if course_id in self.courses_df['course_id'].values:
                    course_idx = self.courses_df[self.courses_df['course_id'] == course_id].index[0]
                    course_similarities = self.course_similarity_matrix[course_idx]
                    
                    # Add weighted similarities from courses student has taken
                    similarity_scores += 0.5 * course_similarities
        
        # Create list of (course_id, score) tuples
        course_scores = [
            (self.courses_df.iloc[i]['course_id'], similarity_scores[i])
            for i in range(len(self.courses_df))
        ]
        
        # Sort by similarity score
        sorted_courses = sorted(course_scores, key=lambda x: x[1], reverse=True)
        
        return sorted_courses[:limit]
    
    def _get_collaborative_recommendations(self, student_id, limit=10):
        """
        Get collaborative filtering recommendations based on student-course interactions
        
        Args:
            student_id: Student ID
            limit: Max number of recommendations
            
        Returns:
            List of (course_id, score) tuples
        """
        # Get student's ratings
        if student_id not in self.student_course_matrix.index:
            return []
        
        student_ratings = self.student_course_matrix.loc[student_id]
        
        # Find similar students (based on rating patterns)
        student_similarities = {}
        for other_id in self.student_course_matrix.index:
            if other_id != student_id:
                other_ratings = self.student_course_matrix.loc[other_id]
                common_courses = ((student_ratings > 0) & (other_ratings > 0)).sum()
                
                # Only consider students who have at least 2 courses in common
                if common_courses >= 2:
                    # Adjust similarity calculation to focus on common courses
                    mask = (student_ratings > 0) & (other_ratings > 0)
                    if mask.sum() == 0:
                        continue
                    
                    # Calculate similarity only on common courses
                    sim = cosine_similarity(
                        np.array([student_ratings[mask]]),
                        np.array([other_ratings[mask]])
                    )[0][0]
                    
                    student_similarities[other_id] = sim
        
        # Get recommendations from similar students
        course_scores = {}
        for other_id, similarity in sorted(student_similarities.items(), key=lambda x: x[1], reverse=True)[:10]:
            other_ratings = self.student_course_matrix.loc[other_id]
            
            for course in other_ratings.index:
                other_rating = other_ratings[course]
                
                # Only consider courses the other student liked (rating > 3)
                if other_rating > 3 and student_ratings[course] == 0:
                    if course not in course_scores:
                        course_scores[course] = 0
                    course_scores[course] += similarity * (other_rating / 5)
        
        # Convert to list of (course_id, score) tuples
        recommendations = [(course, score) for course, score in course_scores.items()]
        
        # Sort by score
        sorted_recommendations = sorted(recommendations, key=lambda x: x[1], reverse=True)
        
        return sorted_recommendations[:limit]
    
    def save_model(self):
        """Save model components to disk"""
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Save courses and student data
        courses_path = os.path.join(self.model_dir, 'courses.pkl')
        with open(courses_path, 'wb') as f:
            pickle.dump(self.courses_df, f)
        
        # Save course vectors and similarity matrix
        content_path = os.path.join(self.model_dir, 'course_content.pkl')
        with open(content_path, 'wb') as f:
            model_data = {
                'vectorizer': self.course_vectorizer,
                'content_matrix': self.course_content_matrix,
                'similarity_matrix': self.course_similarity_matrix,
            }
            pickle.dump(model_data, f)
        
        # Save student-course matrix
        matrix_path = os.path.join(self.model_dir, 'student_course_matrix.pkl')
        with open(matrix_path, 'wb') as f:
            pickle.dump(self.student_course_matrix, f)
        
        # Save student preprocessor
        preprocessor_path = os.path.join(self.model_dir, 'student_preprocessor.pkl')
        with open(preprocessor_path, 'wb') as f:
            pickle.dump(self.student_preprocessor, f)
    
    def load_model(self):
        """Load model components from disk"""
        try:
            # Load courses data
            courses_path = os.path.join(self.model_dir, 'courses.pkl')
            with open(courses_path, 'rb') as f:
                self.courses_df = pickle.load(f)
            
            # Load course vectors and similarity matrix
            content_path = os.path.join(self.model_dir, 'course_content.pkl')
            with open(content_path, 'rb') as f:
                model_data = pickle.load(f)
                self.course_vectorizer = model_data['vectorizer']
                self.course_content_matrix = model_data['content_matrix']
                self.course_similarity_matrix = model_data['similarity_matrix']
            
            # Load student-course matrix
            matrix_path = os.path.join(self.model_dir, 'student_course_matrix.pkl')
            with open(matrix_path, 'rb') as f:
                self.student_course_matrix = pickle.load(f)
            
            # Load student preprocessor
            preprocessor_path = os.path.join(self.model_dir, 'student_preprocessor.pkl')
            with open(preprocessor_path, 'rb') as f:
                self.student_preprocessor = pickle.load(f)
            
            return True
        except FileNotFoundError:
            return False
    
    def evaluate(self, test_student_ids=None):
        """
        Evaluate recommendation system performance
        
        Args:
            test_student_ids: List of student IDs to evaluate on (if None, uses 20% of students)
            
        Returns:
            Evaluation metrics
        """
        if self.course_similarity_matrix is None:
            raise ValueError("Model must be trained first")
        
        # If no test students specified, select 20% randomly
        if test_student_ids is None:
            np.random.seed(42)
            all_students = self.students_df['student_id'].unique()
            test_student_ids = np.random.choice(all_students, size=int(len(all_students)*0.2), replace=False)
        
        results = []
        
        # For each test student
        for student_id in test_student_ids:
            # Get courses the student has actually taken
            student_courses = set(self.course_history_df[
                self.course_history_df['student_id'] == student_id
            ]['course_id'].tolist())
            
            if len(student_courses) < 2:
                continue  # Skip students with too few courses
            
            # Split into training and test sets
            train_courses = list(student_courses)[:-1]  # All but the last course
            test_course = list(student_courses)[-1]  # The last course
            
            # Create a temporary course history excluding the test course
            temp_history = self.course_history_df[
                ~((self.course_history_df['student_id'] == student_id) & 
                  (self.course_history_df['course_id'] == test_course))
            ]
            
            # Create a temporary recommendation system
            temp_recommender = CourseRecommendationSystem()
            temp_recommender.courses_df = self.courses_df
            temp_recommender.students_df = self.students_df
            temp_recommender.course_history_df = temp_history
            
            # Preprocess data
            temp_recommender.preprocess_data()
            
            # Get recommendations
            recommendations = temp_recommender._get_content_based_recommendations(
                student_id, 
                self.students_df[self.students_df['student_id'] == student_id].iloc[0]['topic_interests'],
                self.students_df[self.students_df['student_id'] == student_id].iloc[0]['department'],
                limit=20
            )
            
            # Check if the test course is in recommendations
            rec_courses = [course_id for course_id, _ in recommendations]
            hit = test_course in rec_courses
            
            # Calculate metrics
            if hit:
                rank = rec_courses.index(test_course) + 1
                precision_at_5 = 1 if rank <= 5 else 0
                precision_at_10 = 1 if rank <= 10 else 0
            else:
                rank = None
                precision_at_5 = 0
                precision_at_10 = 0
            
            results.append({
                'student_id': student_id,
                'hit': hit,
                'rank': rank,
                'precision_at_5': precision_at_5,
                'precision_at_10': precision_at_10
            })
        
        # Calculate overall metrics
        if not results:
            return {'error': 'No suitable test students found'}
        
        hit_rate = sum(r['hit'] for r in results) / len(results)
        precision_at_5 = sum(r['precision_at_5'] for r in results) / len(results)
        precision_at_10 = sum(r['precision_at_10'] for r in results) / len(results)
        
        # Calculate MRR (Mean Reciprocal Rank)
        reciprocal_ranks = [1/r['rank'] if r['rank'] else 0 for r in results]
        mrr = sum(reciprocal_ranks) / len(results)
        
        # Generate visualizations
        self._visualize_evaluation_results(results)
        
        return {
            'hit_rate': hit_rate,
            'precision_at_5': precision_at_5,
            'precision_at_10': precision_at_10,
            'mrr': mrr,
            'num_test_students': len(results)
        }
    
    def _visualize_evaluation_results(self, results):
        """
        Create visualizations for evaluation results
        
        Args:
            results: List of evaluation result dictionaries
        """
        os.makedirs(os.path.join(self.model_dir, 'plots'), exist_ok=True)
        
        # 1. Hit Rate Analysis
        plt.figure(figsize=(10, 6))
        hit_count = sum(r['hit'] for r in results)
        miss_count = len(results) - hit_count
        plt.bar(['Hit', 'Miss'], [hit_count, miss_count])
        plt.title('Recommendation Hit Rate')
        plt.ylabel('Count')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'hit_rate.png'))
        
        # 2. Rank Distribution (for hits)
        ranks = [r['rank'] for r in results if r['rank'] is not None]
        if ranks:
            plt.figure(figsize=(10, 6))
            plt.hist(ranks, bins=range(1, max(ranks) + 2), alpha=0.7)
            plt.title('Rank Distribution of Correctly Recommended Courses')
            plt.xlabel('Rank')
            plt.ylabel('Frequency')
            plt.savefig(os.path.join(self.model_dir, 'plots', 'rank_distribution.png'))
        
        # 3. Precision Analysis
        plt.figure(figsize=(10, 6))
        metrics = ['Hit Rate', 'Precision@5', 'Precision@10', 'MRR']
        values = [
            sum(r['hit'] for r in results) / len(results),
            sum(r['precision_at_5'] for r in results) / len(results),
            sum(r['precision_at_10'] for r in results) / len(results),
            sum(1/r['rank'] if r['rank'] else 0 for r in results) / len(results)
        ]
        plt.bar(metrics, values)
        plt.title('Recommendation Performance Metrics')
        plt.ylabel('Score')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'performance_metrics.png'))
        
        # 4. Course Popularity Distribution - Make sure the column exists
        plt.figure(figsize=(12, 6))
        # Check if popularity_score exists before trying to use it
        if 'popularity_score' in self.courses_df.columns:
            self.courses_df['popularity_score'].hist(bins=20)
        else:
            # If popularity_score doesn't exist, calculate it
            self._calculate_course_popularity()
            # Then create the histogram
            self.courses_df['popularity_score'].hist(bins=20)
            
        plt.title('Course Popularity Distribution')
        plt.xlabel('Popularity Score')
        plt.ylabel('Number of Courses')
        plt.savefig(os.path.join(self.model_dir, 'plots', 'course_popularity.png'))

if __name__ == "__main__":
    # Example usage
    from generate_dataset import save_dataset
    
    # Create dataset
    courses_df, students_df, course_history_df = save_dataset()
    
    # Train and evaluate model
    model = CourseRecommendationSystem()
    
    # Use the actual paths to CSV files
    current_dir = os.path.dirname(os.path.realpath(__file__))
    courses_path = os.path.join(current_dir, 'data', 'courses.csv')
    students_path = os.path.join(current_dir, 'data', 'students.csv')
    course_history_path = os.path.join(current_dir, 'data', 'course_history.csv')
    
    # Train model
    train_metrics = model.train(courses_path, students_path, course_history_path)
    print(f"Training metrics: {train_metrics}")
    
    # Evaluate model
    eval_metrics = model.evaluate()
    print(f"Evaluation metrics: {eval_metrics}")
    
    # Get recommendations for a sample student
    sample_student_id = students_df['student_id'].iloc[0]
    recommendations = model.recommend_courses(sample_student_id, limit=5)
    
    print(f"\nCourse recommendations for student {sample_student_id}:")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec['courseName']} ({rec['courseCode']}) - Match: {rec['matchScore']}%")