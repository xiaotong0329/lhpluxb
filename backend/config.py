import os
import logging
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging to reduce MongoDB OCSP messages
logging.getLogger('pymongo.ocsp_support').setLevel(logging.WARNING)
logging.getLogger('pymongo').setLevel(logging.WARNING)

class Config:
    # Database Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/mood_journal_db')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    
    # AI Service Configuration
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
    AI_MODEL_NAME = os.getenv('AI_MODEL_NAME', 'deepseek/deepseek-r1-0528:free')
    
    # Server Configuration
    PORT = int(os.getenv('PORT', 8080))
    HOST = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # CORS Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3003')
    ALLOWED_ORIGINS = [
        FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'exp://192.168.0.116:8081'
    ]
    
    # Security Configuration
    BCRYPT_ROUNDS = int(os.getenv('BCRYPT_ROUNDS', 12))
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Create a development config that can be easily modified
class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

# Create a production config
class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = 'WARNING'

# Default to development config
config = DevelopmentConfig()
