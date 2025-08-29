from flask import Blueprint, request, jsonify, g
from datetime import datetime, date
from auth.models import User
from models.mood_journal import MoodEntry, Recommendation, UserFeedback
from services.mood_ai_service import MoodAIService
import asyncio
import logging

mood_journal_bp = Blueprint('mood_journal', __name__)

@mood_journal_bp.route('/mood', methods=['POST'])
def log_mood():
    """Log a new mood entry"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Validate required fields
        mood = data.get('mood', '').strip()
        intensity = data.get('intensity')
        description = data.get('description', '').strip()
        note = data.get('note', '').strip()
        
        if not mood:
            return jsonify({"error": "mood is required"}), 400
        
        if intensity is None or not isinstance(intensity, int) or intensity < 1 or intensity > 10:
            return jsonify({"error": "intensity must be an integer between 1-10"}), 400
        
        # Check if mood already logged for today
        today = date.today()
        existing_mood = MoodEntry.get_mood_by_date(user_id, today)
        if existing_mood:
            return jsonify({"error": "Mood already logged for today"}), 409
        
        # Create mood entry
        mood_id = MoodEntry.create(user_id, mood, intensity, description, note)
        
        return jsonify({
            "message": "Mood logged successfully",
            "mood_id": mood_id,
            "mood": mood,
            "intensity": intensity,
            "description": description,
            "date": today.isoformat()
        }), 201
        
    except Exception as e:
        logging.error(f"Error logging mood: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@mood_journal_bp.route('/mood', methods=['GET'])
def get_mood_history():
    """Get user's mood history"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        limit = request.args.get('limit', 30, type=int)
        if limit > 100:
            limit = 100
        
        moods = MoodEntry.get_user_moods(user_id, limit)
        
        for mood in moods:
            mood['_id'] = str(mood['_id'])
            mood['user_id'] = str(mood['user_id'])
            mood['created_at'] = mood['created_at'].isoformat()
            mood['date'] = mood['date'].isoformat()
        
        return jsonify({
            "moods": moods,
            "count": len(moods)
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting mood history: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@mood_journal_bp.route('/mood/stats', methods=['GET'])
def get_mood_stats():
    """Get mood statistics"""
    try:
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Get query parameters
        days = request.args.get('days', 7, type=int)
        if days > 30:
            days = 30
        
        # Get mood statistics
        stats = MoodEntry.get_mood_stats(user_id, days)
        
        return jsonify({
            "stats": stats,
            "period_days": days
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting mood stats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@mood_journal_bp.route('/recommend', methods=['POST'])
def get_recommendation():
    """Get AI recommendation based on mood"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        mood = data.get('mood', '').strip()
        description = data.get('description', '').strip()
        activity_type = data.get('activity_type', '').strip() or None
        
        if not mood:
            return jsonify({"error": "mood is required"}), 400
        
        user_profile = {
            'age': user.get('age'),
            'gender': user.get('gender'),
            'nationality': user.get('nationality'),
            'hobbies': user.get('hobbies', [])
        }
        
        recommendation_data = asyncio.run(
            MoodAIService.generate_mood_recommendation(mood, user_profile, description, activity_type)
        )
        
        main_rec = recommendation_data['recommendation']
        rec_id = Recommendation.create(
            user_id=user_id,
            mood=mood,
            activity_type=main_rec['type'],
            title=main_rec['title'],
            description=main_rec['description'],
            url=main_rec.get('url'),
            category=main_rec.get('category')
        )
        
        recommendation_data['recommendation']['id'] = rec_id
        
        return jsonify(recommendation_data), 200
        
    except Exception as e:
        logging.error(f"Error getting recommendation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@mood_journal_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback for a recommendation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Validate required fields
        recommendation_id = data.get('recommendation_id', '').strip()
        liked = data.get('liked')
        mood = data.get('mood', '').strip()
        
        if not recommendation_id:
            return jsonify({"error": "recommendation_id is required"}), 400
        
        if liked is None or not isinstance(liked, bool):
            return jsonify({"error": "liked must be a boolean"}), 400
        
        # Update recommendation feedback
        Recommendation.add_feedback(recommendation_id, liked)
        
        # Create user feedback record
        feedback_id = UserFeedback.create(user_id, recommendation_id, liked, mood)
        
        return jsonify({
            "message": "Feedback submitted successfully",
            "feedback_id": feedback_id,
            "liked": liked
        }), 201
        
    except Exception as e:
        logging.error(f"Error submitting feedback: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@mood_journal_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        user = User.find_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        profile_data = {
            "username": user.get('username'),
            "email": user.get('email'),
            "age": user.get('age'),
            "gender": user.get('gender'),
            "nationality": user.get('nationality'),
            "hobbies": user.get('hobbies', []),
            "created_at": user.get('created_at').isoformat() if user.get('created_at') else None
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        logging.error(f"Error getting profile: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@mood_journal_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Validate and extract fields
        age = data.get('age')
        nationality = data.get('nationality', '').strip()
        gender = data.get('gender', '').strip()
        hobbies = data.get('hobbies', [])
        
        # Validate age
        if age is not None and (not isinstance(age, int) or age < 1 or age > 120):
            return jsonify({"error": "age must be an integer between 1-120"}), 400
        
        # Validate hobbies
        if not isinstance(hobbies, list):
            return jsonify({"error": "hobbies must be a list"}), 400
        
        # Update profile
        User.update_profile(user_id, age, nationality, gender, hobbies)
        
        return jsonify({
            "message": "Profile updated successfully",
            "updated_fields": [k for k, v in data.items() if v is not None]
        }), 200
        
    except Exception as e:
        logging.error(f"Error updating profile: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500 

@mood_journal_bp.route('/insights', methods=['GET'])
def get_user_insights():
    """Get user insights and feedback analysis"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        try:
            from services.feedback_analysis_service import FeedbackAnalysisService
            insights = FeedbackAnalysisService.get_user_insights(user_id)
            preferences = FeedbackAnalysisService.get_user_preferences(user_id)
            
            return jsonify({
                "insights": insights,
                "preferences": preferences
            }), 200
        except ImportError:
            return jsonify({
                "message": "Feedback analysis service not available",
                "insights": {},
                "preferences": {}
            }), 200
        
    except Exception as e:
        logging.error(f"Error getting user insights: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500 

@mood_journal_bp.route('/share', methods=['POST'])
def share_recommendation():
    """Share a recommendation to the community"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Validate required fields
        recommendation_id = data.get('recommendation_id')
        mood = data.get('mood', '').strip()
        mood_intensity = data.get('mood_intensity')
        description = data.get('description', '').strip()
        
        if not recommendation_id:
            return jsonify({"error": "recommendation_id is required"}), 400
        
        if not mood:
            return jsonify({"error": "mood is required"}), 400
        
        if mood_intensity is None or not isinstance(mood_intensity, int) or mood_intensity < 1 or mood_intensity > 10:
            return jsonify({"error": "mood_intensity must be an integer between 1-10"}), 400
        
        # Get the recommendation details
        recommendation = Recommendation.get_by_id(recommendation_id)
        if not recommendation:
            return jsonify({"error": "Recommendation not found"}), 404
        
        # Import CommunityPost here to avoid circular imports
        from models.community_posts import CommunityPost
        
        # Create a community post from the recommendation
        post_id = CommunityPost.create(
            user_id=user_id,
            mood=mood,
            activity_title=recommendation.get('title', 'Shared Recommendation'),
            activity_description=recommendation.get('description', ''),
            activity_type=recommendation.get('type', 'recommendation'),
            mood_intensity=mood_intensity,
            description=description,
            note=f"Shared from mood journal - {recommendation.get('reasoning', '')}",
            is_public=True
        )
        
        return jsonify({
            "message": "Recommendation shared successfully",
            "post_id": post_id
        }), 201
        
    except Exception as e:
        logging.error(f"Error sharing recommendation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500 