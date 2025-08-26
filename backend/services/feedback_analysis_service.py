from datetime import datetime, timedelta
from typing import Dict, Any, List
from bson import ObjectId
from flask import g

class FeedbackAnalysisService:
    """Service for analyzing user feedback and improving recommendations"""
    
    @staticmethod
    def get_user_preferences(user_id: str) -> Dict[str, Any]:
        """Analyze user feedback to determine preferences"""
        try:
            feedback_history = list(g.db.user_feedback.find({
                'user_id': ObjectId(user_id)
            }).sort('created_at', -1))
            
            preferences = {
                'liked_activity_types': {},
                'disliked_activity_types': {},
                'mood_preferences': {},
                'overall_sentiment': 0,
                'total_feedback': len(feedback_history)
            }
            
            for feedback in feedback_history:
                recommendation = g.db.recommendations.find_one({
                    '_id': feedback['recommendation_id']
                })
                
                if recommendation:
                    activity_type = recommendation.get('activity_type', 'unknown')
                    mood = feedback.get('mood', 'unknown')
                    
                    if feedback['liked']:
                        preferences['liked_activity_types'][activity_type] = \
                            preferences['liked_activity_types'].get(activity_type, 0) + 1
                    else:
                        preferences['disliked_activity_types'][activity_type] = \
                            preferences['disliked_activity_types'].get(activity_type, 0) + 1
                    
                    if mood not in preferences['mood_preferences']:
                        preferences['mood_preferences'][mood] = {
                            'liked': 0,
                            'disliked': 0,
                            'activity_types': {}
                        }
                    
                    if feedback['liked']:
                        preferences['mood_preferences'][mood]['liked'] += 1
                        preferences['overall_sentiment'] += 1
                    else:
                        preferences['mood_preferences'][mood]['disliked'] += 1
                        preferences['overall_sentiment'] -= 1
                    
                    mood_prefs = preferences['mood_preferences'][mood]
                    if activity_type not in mood_prefs['activity_types']:
                        mood_prefs['activity_types'][activity_type] = {'liked': 0, 'disliked': 0}
                    
                    if feedback['liked']:
                        mood_prefs['activity_types'][activity_type]['liked'] += 1
                    else:
                        mood_prefs['activity_types'][activity_type]['disliked'] += 1
            
            return preferences
            
        except Exception as e:
            print(f"Error analyzing user preferences: {e}")
            return {}
    
    @staticmethod
    def get_personalized_recommendations(user_id: str, mood: str, activity_type: str = None) -> List[Dict[str, Any]]:
        """Get personalized recommendations based on user feedback history"""
        try:
            # Get user preferences
            preferences = FeedbackAnalysisService.get_user_preferences(user_id)
            
            # Get recommendations for the mood
            query = {'mood': mood.lower()}
            if activity_type:
                query['activity_type'] = activity_type
            
            # Get all recommendations for this mood
            recommendations = list(g.db.recommendations.find(query))
            
            # Score recommendations based on user preferences
            scored_recommendations = []
            
            for rec in recommendations:
                score = 0
                rec_activity_type = rec.get('activity_type', 'unknown')
                
                # Base score from community feedback
                likes = rec.get('likes', 0)
                dislikes = rec.get('dislikes', 0)
                total_feedback = rec.get('feedback_count', 0)
                
                if total_feedback > 0:
                    community_score = (likes - dislikes) / total_feedback
                    score += community_score * 0.3  # 30% weight to community feedback
                
                # Personal preference score
                if rec_activity_type in preferences.get('liked_activity_types', {}):
                    score += 0.4  # 40% boost for liked activity types
                
                if rec_activity_type in preferences.get('disliked_activity_types', {}):
                    score -= 0.4  # 40% penalty for disliked activity types
                
                # Mood-specific preference score
                mood_prefs = preferences.get('mood_preferences', {}).get(mood, {})
                mood_activity_prefs = mood_prefs.get('activity_types', {}).get(rec_activity_type, {})
                
                mood_liked = mood_activity_prefs.get('liked', 0)
                mood_disliked = mood_activity_prefs.get('disliked', 0)
                mood_total = mood_liked + mood_disliked
                
                if mood_total > 0:
                    mood_score = (mood_liked - mood_disliked) / mood_total
                    score += mood_score * 0.3  # 30% weight to mood-specific preferences
                
                scored_recommendations.append({
                    'recommendation': rec,
                    'score': score,
                    'personalization_factors': {
                        'community_rating': f"{(likes - dislikes) / total_feedback if total_feedback > 0 else 0:.2f}",
                        'activity_type_preference': 'liked' if rec_activity_type in preferences.get('liked_activity_types', {}) else 'disliked' if rec_activity_type in preferences.get('disliked_activity_types', {}) else 'neutral',
                        'mood_specific_score': f"{mood_score:.2f}" if mood_total > 0 else 'no_data'
                    }
                })
            
            # Sort by score (highest first)
            scored_recommendations.sort(key=lambda x: x['score'], reverse=True)
            
            return scored_recommendations
            
        except Exception as e:
            print(f"Error getting personalized recommendations: {e}")
            return []
    
    @staticmethod
    def get_user_insights(user_id: str) -> Dict[str, Any]:
        """Get insights about user's mood and recommendation patterns"""
        try:
            mood_history = list(g.db.mood_entries.find({
                'user_id': ObjectId(user_id)
            }).sort('created_at', -1).limit(30))
            
            feedback_history = list(g.db.user_feedback.find({
                'user_id': ObjectId(user_id)
            }).sort('created_at', -1))
            
            insights = {
                'mood_patterns': {},
                'recommendation_effectiveness': {},
                'preferred_activities': {},
                'mood_trends': {}
            }
            
            for mood_entry in mood_history:
                mood = mood_entry.get('mood', 'unknown')
                intensity = mood_entry.get('intensity', 5)
                
                if mood not in insights['mood_patterns']:
                    insights['mood_patterns'][mood] = {
                        'count': 0,
                        'avg_intensity': 0,
                        'total_intensity': 0
                    }
                
                insights['mood_patterns'][mood]['count'] += 1
                insights['mood_patterns'][mood]['total_intensity'] += intensity
            
            for mood, data in insights['mood_patterns'].items():
                if data['count'] > 0:
                    data['avg_intensity'] = data['total_intensity'] / data['count']
            
            for feedback in feedback_history:
                mood = feedback.get('mood', 'unknown')
                activity_type = 'unknown'
                
                recommendation = g.db.recommendations.find_one({
                    '_id': feedback['recommendation_id']
                })
                
                if recommendation:
                    activity_type = recommendation.get('activity_type', 'unknown')
                
                key = f"{mood}_{activity_type}"
                if key not in insights['recommendation_effectiveness']:
                    insights['recommendation_effectiveness'][key] = {
                        'liked': 0,
                        'disliked': 0,
                        'success_rate': 0
                    }
                
                if feedback['liked']:
                    insights['recommendation_effectiveness'][key]['liked'] += 1
                else:
                    insights['recommendation_effectiveness'][key]['disliked'] += 1
                
                total = insights['recommendation_effectiveness'][key]['liked'] + insights['recommendation_effectiveness'][key]['disliked']
                if total > 0:
                    insights['recommendation_effectiveness'][key]['success_rate'] = \
                        insights['recommendation_effectiveness'][key]['liked'] / total
            
            preferences = FeedbackAnalysisService.get_user_preferences(user_id)
            insights['preferred_activities'] = preferences.get('liked_activity_types', {})
            
            return insights
            
        except Exception as e:
            print(f"Error getting user insights: {e}")
            return {}
    
    @staticmethod
    def should_avoid_activity_type(user_id: str, mood: str, activity_type: str) -> bool:
        """Check if we should avoid recommending a specific activity type for this user and mood"""
        try:
            preferences = FeedbackAnalysisService.get_user_preferences(user_id)
            
            # Check if user dislikes this activity type overall
            if activity_type in preferences.get('disliked_activity_types', {}):
                disliked_count = preferences['disliked_activity_types'][activity_type]
                liked_count = preferences.get('liked_activity_types', {}).get(activity_type, 0)
                
                # If disliked significantly more than liked, avoid it
                if disliked_count > liked_count * 2:
                    return True
            
            # Check mood-specific dislikes
            mood_prefs = preferences.get('mood_preferences', {}).get(mood, {})
            mood_activity_prefs = mood_prefs.get('activity_types', {}).get(activity_type, {})
            
            mood_disliked = mood_activity_prefs.get('disliked', 0)
            mood_liked = mood_activity_prefs.get('liked', 0)
            
            # If user has disliked this activity type for this mood, avoid it
            if mood_disliked > mood_liked:
                return True
            
            return False
            
        except Exception as e:
            print(f"Error checking activity type avoidance: {e}")
            return False 