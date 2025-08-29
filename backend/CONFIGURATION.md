# Configuration Guide

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Required Variables

```bash
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production

# AI Service Configuration
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
AI_MODEL_NAME=deepseek/deepseek-r1-0528:free
```

### Optional Variables

```bash
# Server Configuration
PORT=8080
HOST=0.0.0.0
DEBUG=True

# Frontend Configuration
FRONTEND_URL=http://localhost:3003

# Security Configuration
BCRYPT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=INFO
```

## How to Get API Keys

### OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. The API key should look like: `sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string from the cluster
4. Replace `username`, `password`, and `database_name` with your values

## Running the Application

### From the backend directory:
```bash
cd backend
python app.py
```

### From the parent directory:
```bash
PYTHONPATH=. python backend/app.py
```

## Testing the Configuration

After starting the server, test the health endpoint:
```bash
curl http://localhost:8080/health
```

You should see a response like:
```json
{
  "status": "healthy",
  "message": "Mood Journal API is running",
  "config": {
    "mongo_connected": true,
    "ai_service_configured": true,
    "debug_mode": true
  }
}
``` 