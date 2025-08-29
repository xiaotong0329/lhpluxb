from flask import Blueprint, request, jsonify, g
from datetime import datetime
from auth.models import User
from models.community_posts import CommunityPost, PostComment
import logging

community_bp = Blueprint('community', __name__)

@community_bp.route('/posts', methods=['POST'])
def create_post():
    """Create a new community post"""
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
        activity_title = data.get('activity_title', '').strip()
        activity_description = data.get('activity_description', '').strip()
        activity_type = data.get('activity_type', '').strip()
        mood_intensity = data.get('mood_intensity')
        description = data.get('description', '').strip()
        note = data.get('note', '').strip()
        is_public = data.get('is_public', True)
        
        if not all([mood, activity_title, activity_description, activity_type]):
            return jsonify({"error": "mood, activity_title, activity_description, and activity_type are required"}), 400
        
        if mood_intensity is None or not isinstance(mood_intensity, int) or mood_intensity < 1 or mood_intensity > 10:
            return jsonify({"error": "mood_intensity must be an integer between 1-10"}), 400
        
        # Create the post
        post_id = CommunityPost.create(
            user_id=user_id,
            mood=mood,
            activity_title=activity_title,
            activity_description=activity_description,
            activity_type=activity_type,
            mood_intensity=mood_intensity,
            description=description,
            note=note,
            is_public=is_public
        )
        
        return jsonify({
            "message": "Post created successfully",
            "post_id": post_id
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating post: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get community posts with optional filters"""
    try:
        limit = request.args.get('limit', 20, type=int)
        skip = request.args.get('skip', 0, type=int)
        mood_filter = request.args.get('mood', '').strip()
        activity_type_filter = request.args.get('activity_type', '').strip()
        
        if limit > 50:
            limit = 50
        
        # Get current user if authenticated
        current_user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            current_user_id = User.verify_jwt_token(token)
        
        posts = CommunityPost.get_posts(
            limit=limit,
            skip=skip,
            mood_filter=mood_filter if mood_filter else None,
            activity_type_filter=activity_type_filter if activity_type_filter else None
        )
        
        # Add user interaction status to each post
        for post in posts:
            post['_id'] = str(post['_id'])
            post['user_id'] = str(post['user_id'])
            post['created_at'] = post['created_at'].isoformat()
            
            # Add like/star status for current user
            if current_user_id:
                post['isLiked'] = CommunityPost.is_post_liked_by_user(str(post['_id']), current_user_id)
                post['isStarred'] = CommunityPost.is_post_starred_by_user(str(post['_id']), current_user_id)
            else:
                post['isLiked'] = False
                post['isStarred'] = False
        
        return jsonify({
            "posts": posts,
            "count": len(posts),
            "has_more": len(posts) == limit
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting posts: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>', methods=['GET'])
def get_post(post_id):
    """Get a specific post by ID"""
    try:
        post = CommunityPost.get_post_by_id(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        # Convert ObjectId to string
        post['_id'] = str(post['_id'])
        post['user_id'] = str(post['user_id'])
        post['created_at'] = post['created_at'].isoformat()
        
        return jsonify(post), 200
        
    except Exception as e:
        logging.error(f"Error getting post: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    """Like a post"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        post = CommunityPost.get_post_by_id(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        success = CommunityPost.like_post(post_id, user_id)
        
        if success:
            return jsonify({
                "message": "Post liked successfully",
                "liked": True
            }), 200
        else:
            return jsonify({
                "message": "Post already liked",
                "liked": True
            }), 200
        
    except Exception as e:
        logging.error(f"Error liking post: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/unlike', methods=['POST'])
def unlike_post(post_id):
    """Unlike a post"""
    try:
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Unlike the post
        success = CommunityPost.unlike_post(post_id, user_id)
        
        return jsonify({
            "message": "Post unliked successfully" if success else "Post was not liked",
            "liked": False
        }), 200
        
    except Exception as e:
        logging.error(f"Error unliking post: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/star', methods=['POST'])
def star_post(post_id):
    """Star a post"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        post = CommunityPost.get_post_by_id(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        success = CommunityPost.star_post(post_id, user_id)
        
        if success:
            return jsonify({
                "message": "Post starred successfully",
                "starred": True
            }), 200
        else:
            return jsonify({
                "message": "Post already starred",
                "starred": True
            }), 200
        
    except Exception as e:
        logging.error(f"Error starring post: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/unstar', methods=['POST'])
def unstar_post(post_id):
    """Unstar a post"""
    try:
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Unstar the post
        success = CommunityPost.unstar_post(post_id, user_id)
        
        return jsonify({
            "message": "Post unstarred successfully" if success else "Post was not starred",
            "starred": False
        }), 200
        
    except Exception as e:
        logging.error(f"Error unstarring post: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/status', methods=['GET'])
def get_post_status(post_id):
    """Get current like/star status of a post for the current user"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        post = CommunityPost.get_post_by_id(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        is_liked = CommunityPost.is_post_liked_by_user(post_id, user_id)
        is_starred = CommunityPost.is_post_starred_by_user(post_id, user_id)
        
        return jsonify({
            "post_id": post_id,
            "is_liked": is_liked,
            "is_starred": is_starred,
            "total_likes": post.get('likes', 0),
            "total_stars": post.get('stars', 0)
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting post status: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/comments', methods=['POST'])
def add_comment(post_id):
    """Add a comment to a post"""
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
        
        # Validate comment
        comment = data.get('comment', '').strip()
        if not comment:
            return jsonify({"error": "comment is required"}), 400
        
        # Check if post exists
        post = CommunityPost.get_post_by_id(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        # Add comment
        comment_id = PostComment.create(post_id, user_id, comment)
        
        return jsonify({
            "message": "Comment added successfully",
            "comment_id": comment_id
        }), 201
        
    except Exception as e:
        logging.error(f"Error adding comment: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/posts/<post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """Get comments for a post"""
    try:
        post = CommunityPost.get_post_by_id(post_id)
        if not post:
            return jsonify({"error": "Post not found"}), 404
        
        comments = PostComment.get_post_comments(post_id)
        
        for comment in comments:
            comment['_id'] = str(comment['_id'])
            comment['post_id'] = str(comment['post_id'])
            comment['user_id'] = str(comment['user_id'])
            comment['created_at'] = comment['created_at'].isoformat()
        
        return jsonify({
            "comments": comments,
            "count": len(comments)
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting comments: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/my-posts', methods=['GET'])
def get_my_posts():
    """Get current user's posts"""
    try:
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Get user's posts
        posts = CommunityPost.get_user_posts(user_id)
        
        # Convert ObjectId to string
        for post in posts:
            post['_id'] = str(post['_id'])
            post['user_id'] = str(post['user_id'])
            post['created_at'] = post['created_at'].isoformat()
        
        return jsonify({
            "posts": posts,
            "count": len(posts)
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting user posts: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/my-liked-posts', methods=['GET'])
def get_my_liked_posts():
    """Get posts that current user has liked"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        posts = CommunityPost.get_user_liked_posts(user_id)
        
        for post in posts:
            post['_id'] = str(post['_id'])
            post['user_id'] = str(post['user_id'])
            post['created_at'] = post['created_at'].isoformat()
        
        return jsonify({
            "posts": posts,
            "count": len(posts)
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting liked posts: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@community_bp.route('/my-starred-posts', methods=['GET'])
def get_my_starred_posts():
    """Get posts that current user has starred"""
    try:
        # Get user from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = User.verify_jwt_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Get user's starred posts
        posts = CommunityPost.get_user_starred_posts(user_id)
        
        # Convert ObjectId to string
        for post in posts:
            post['_id'] = str(post['_id'])
            post['user_id'] = str(post['user_id'])
            post['created_at'] = post['created_at'].isoformat()
        
        return jsonify({
            "posts": posts,
            "count": len(posts)
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting starred posts: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500 