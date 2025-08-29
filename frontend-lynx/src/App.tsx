import { useCallback, useEffect, useState } from '@lynx-js/react'
import './App.css'

// Types
interface User {
  id: string
  username: string
  email: string
  age: number
  nationality: string
  gender: string
  hobbies: string[]
}

interface MoodEntry {
  id: string
  mood: string
  intensity: number
  note: string
  description: string
  date: string
}

interface Recommendation {
  id: string
  type: string
  title: string
  description: string
  reasoning: string
  category: string
}

interface CommunityPost {
  id: string
  user_id: string
  username: string
  mood: string
  activity_title: string
  activity_description: string
  activity_type: string
  mood_intensity: number
  description: string
  note: string
  likes_count: number
  stars_count: number
  comments_count: number
  created_at: string
  isLiked?: boolean
  isStarred?: boolean
}

// Mock API functions
const mockApi = {
  login: async (identifier: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      token: 'mock-jwt-token',
      user: {
        id: '1',
        username: identifier,
        email: `${identifier}@example.com`,
        age: 25,
        nationality: 'American',
        gender: 'prefer not to say',
        hobbies: ['reading', 'music', 'travel']
      }
    }
  },
  
  register: async (userData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      token: 'mock-jwt-token',
      user: { ...userData, id: '1' }
    }
  },

  logMood: async (moodData: any) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      message: 'Mood logged successfully',
      mood_id: Date.now().toString(),
      ...moodData
    }
  },

  getRecommendation: async (moodData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    const recommendations = {
      sad: [
        { type: 'movie', title: 'The Secret Life of Walter Mitty', description: 'An uplifting adventure about finding purpose', reasoning: 'Perfect for lifting your spirits', category: 'feel-good' },
        { type: 'cocktail', title: 'Hot Toddy', description: 'Warm, comforting drink with honey and whiskey', reasoning: 'Soothing and warming', category: 'comfort' },
        { type: 'activity', title: 'Take a Warm Bath', description: 'Relax with essential oils and candles', reasoning: 'Calming and restorative', category: 'self-care' }
      ],
      happy: [
        { type: 'movie', title: 'La La Land', description: 'A musical celebration of dreams and love', reasoning: 'Matches your joyful energy', category: 'musical' },
        { type: 'cocktail', title: 'Mojito', description: 'Refreshing mint and lime cocktail', reasoning: 'Perfect for celebration', category: 'celebration' },
        { type: 'activity', title: 'Dance Party', description: 'Put on your favorite upbeat music and dance', reasoning: 'Channel your positive energy', category: 'fun' }
      ],
      anxious: [
        { type: 'movie', title: 'The Good Place', description: 'Philosophical comedy about life and death', reasoning: 'Light-hearted but thoughtful', category: 'comedy' },
        { type: 'cocktail', title: 'Chamomile Tea', description: 'Calming herbal tea with honey', reasoning: 'Naturally soothing', category: 'relaxation' },
        { type: 'activity', title: 'Deep Breathing', description: '5-minute guided breathing exercise', reasoning: 'Immediate stress relief', category: 'wellness' }
      ],
      excited: [
        { type: 'movie', title: 'Mad Max: Fury Road', description: 'High-octane action adventure', reasoning: 'Matches your high energy', category: 'action' },
        { type: 'cocktail', title: 'Espresso Martini', description: 'Energizing coffee cocktail', reasoning: 'Keeps the energy flowing', category: 'energizing' },
        { type: 'activity', title: 'Rock Climbing', description: 'Indoor or outdoor climbing adventure', reasoning: 'Channel your excitement', category: 'adventure' }
      ]
    }
    
    const moodRecs = recommendations[moodData.mood as keyof typeof recommendations] || recommendations.happy
    const randomRec = moodRecs[Math.floor(Math.random() * moodRecs.length)]
    
    return {
      recommendation: { id: Date.now().toString(), ...randomRec },
      alternatives: moodRecs.filter(r => r !== randomRec).slice(0, 2)
    }
  },

  getCommunityPosts: async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return {
      posts: [
        {
          id: '1',
          user_id: '2',
          username: 'Sarah',
          mood: 'happy',
          activity_title: 'Morning Yoga',
          activity_description: 'Started my day with sun salutations',
          activity_type: 'activity',
          mood_intensity: 8,
          description: 'Woke up feeling great today!',
          note: 'The sunrise was beautiful',
          likes_count: 12,
          stars_count: 5,
          comments_count: 3,
          created_at: new Date().toISOString(),
          isLiked: false,
          isStarred: false
        },
        {
          id: '2',
          user_id: '3',
          username: 'Mike',
          mood: 'sad',
          activity_title: 'Comfort Food Cooking',
          activity_description: 'Made my grandma\'s chicken soup recipe',
          activity_type: 'activity',
          mood_intensity: 4,
          description: 'Missing home today',
          note: 'The soup helped a lot',
          likes_count: 8,
          stars_count: 12,
          comments_count: 7,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          isLiked: false,
          isStarred: false
        }
      ]
    }
  }
}

export function App() {
  const [currentView, setCurrentView] = useState<'auth' | 'main' | 'mood-log' | 'recommendations' | 'community'>('auth')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null)
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: '',
    age: 25,
    nationality: 'American',
    gender: 'prefer not to say',
    hobbies: ['reading', 'music']
  })

  // Input focus states for custom input handling
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [showInputModal, setShowInputModal] = useState(false)
  const [inputModalValue, setInputModalValue] = useState('')
  const [inputModalField, setInputModalField] = useState('')

  // Mood logging state
  const [moodData, setMoodData] = useState({
    mood: 'happy',
    intensity: 5,
    note: '',
    description: ''
  })

  const handleAuth = async () => {
    setIsLoading(true)
    try {
      const result = authMode === 'login' 
        ? await mockApi.login(authData.username, authData.password)
        : await mockApi.register(authData)
      
      setUser(result.user)
      setCurrentView('main')
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogMood = async () => {
    setIsLoading(true)
    try {
      const result = await mockApi.logMood(moodData)
      setMoodEntries(prev => [...prev, { id: result.mood_id, ...moodData, date: new Date().toISOString() }])
      setCurrentView('recommendations')
    } catch (error) {
      console.error('Mood logging error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetRecommendation = async () => {
    setIsLoading(true)
    try {
      const result = await mockApi.getRecommendation(moodData)
      setCurrentRecommendation(result.recommendation)
    } catch (error) {
      console.error('Recommendation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCommunityPosts = async () => {
    setIsLoading(true)
    try {
      const result = await mockApi.getCommunityPosts()
      setCommunityPosts(result.posts)
    } catch (error) {
      console.error('Community posts error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikePost = (postId: string) => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes_count: post.isLiked ? post.likes_count - 1 : post.likes_count + 1
        }
      }
      return post
    }))
  }

  const handleStarPost = (postId: string) => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isStarred: !post.isStarred,
          stars_count: post.isStarred ? post.stars_count - 1 : post.stars_count + 1
        }
      }
      return post
    }))
  }

  const openInputModal = (field: string, currentValue: string) => {
    setInputModalField(field)
    setInputModalValue(currentValue)
    setShowInputModal(true)
  }

  const handleInputModalSave = () => {
    if (inputModalField.startsWith('auth.')) {
      const authField = inputModalField.split('.')[1]
      setAuthData(prev => ({ ...prev, [authField]: inputModalValue }))
    } else if (inputModalField.startsWith('mood.')) {
      const moodField = inputModalField.split('.')[1]
      setMoodData(prev => ({ ...prev, [moodField]: inputModalValue }))
    }
    setShowInputModal(false)
    setFocusedInput(null)
  }

  const handleInputModalCancel = () => {
    setShowInputModal(false)
    setFocusedInput(null)
  }

  useEffect(() => {
    if (currentView === 'community') {
      loadCommunityPosts()
    }
  }, [currentView])

  const getMoodEmoji = (mood: string) => {
    const emojis = { happy: '😊', sad: '😢', anxious: '😰', excited: '🤩' }
    return emojis[mood as keyof typeof emojis] || '😊'
  }

  const getMoodColor = (mood: string) => {
    const colors = { happy: '#FFD700', sad: '#87CEEB', anxious: '#DDA0DD', excited: '#FF6B6B' }
    return colors[mood as keyof typeof colors] || '#FFD700'
  }

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const renderInputModal = () => {
    if (!showInputModal) return null

    const getFieldLabel = (field: string) => {
      const fieldMap: { [key: string]: string } = {
        'auth.username': 'Username',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'mood.description': 'What happened today?',
        'mood.note': 'Additional notes'
      }
      return fieldMap[field] || 'Input'
    }

    return (
      <view className="input-modal-overlay">
        <view className="input-modal">
          <text className="input-modal-title">{getFieldLabel(inputModalField)}</text>
          <view className="input-modal-field">
            <text className="input-modal-text">{inputModalValue || 'Enter text...'}</text>
          </view>
          <view className="input-modal-actions">
            <view className="input-modal-button cancel" bindtap={handleInputModalCancel}>
              <text className="input-modal-button-text">Cancel</text>
            </view>
            <view className="input-modal-button save" bindtap={handleInputModalSave}>
              <text className="input-modal-button-text">Save</text>
            </view>
          </view>
        </view>
      </view>
    )
  }

  const renderAuth = () => (
    <view className="auth-container">
      <view className="auth-card">
        <text className="auth-title">Mood Journal</text>
        <text className="auth-subtitle">Track your feelings, get personalized recommendations</text>
        
        <view className="auth-tabs">
          <text 
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            bindtap={() => setAuthMode('login')}
          >
            Login
          </text>
          <text 
            className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
            bindtap={() => setAuthMode('register')}
          >
            Register
          </text>
        </view>

        <view className="auth-form">
          <view className="auth-input-container">
            <text className="auth-input-label">Username</text>
            <view 
              className={`auth-input-field ${focusedInput === 'auth.username' ? 'focused' : ''}`}
              bindtap={() => openInputModal('auth.username', authData.username)}
            >
              <text className="auth-input-text">
                {authData.username || 'Enter username'}
              </text>
            </view>
          </view>
          
          {authMode === 'register' && (
            <view className="auth-input-container">
              <text className="auth-input-label">Email</text>
              <view 
                className={`auth-input-field ${focusedInput === 'auth.email' ? 'focused' : ''}`}
                bindtap={() => openInputModal('auth.email', authData.email)}
              >
                <text className="auth-input-text">
                  {authData.email || 'Enter email'}
                </text>
              </view>
            </view>
          )}
          
          <view className="auth-input-container">
            <text className="auth-input-label">Password</text>
            <view 
              className={`auth-input-field ${focusedInput === 'auth.password' ? 'focused' : ''}`}
              bindtap={() => openInputModal('auth.password', authData.password)}
            >
              <text className="auth-input-text">
                {authData.password ? '••••••••' : 'Enter password'}
              </text>
            </view>
          </view>
          
          <view 
            className="auth-button"
            bindtap={handleAuth}
          >
            <text className="auth-button-text">
              {isLoading ? 'Loading...' : authMode === 'login' ? 'Login' : 'Register'}
            </text>
          </view>
        </view>
      </view>
    </view>
  )

  const renderMain = () => (
    <view className="main-container">
      <view className="header">
        <text className="welcome-text">Welcome back, {user?.username}! 👋</text>
        <text className="date-text">{new Date().toLocaleDateString()}</text>
      </view>

      <view className="quick-actions">
        <view className="action-card" bindtap={() => setCurrentView('mood-log')}>
          <text className="action-emoji">📝</text>
          <text className="action-title">Log Mood</text>
          <text className="action-subtitle">How are you feeling today?</text>
        </view>
        
        <view className="action-card" bindtap={() => setCurrentView('community')}>
          <text className="action-emoji">🌍</text>
          <text className="action-title">Community</text>
          <text className="action-subtitle">See what others are up to</text>
        </view>
      </view>

      {moodEntries.length > 0 && (
        <view className="recent-moods">
          <text className="section-title">Recent Moods</text>
          <view className="mood-history">
            {moodEntries.slice(-3).reverse().map(entry => (
              <view key={entry.id} className="mood-entry">
                <text className="mood-emoji">{getMoodEmoji(entry.mood)}</text>
                <view className="mood-details">
                  <text className="mood-name">{capitalizeFirst(entry.mood)}</text>
                  <text className="mood-date">{new Date(entry.date).toLocaleDateString()}</text>
                </view>
                <view className="mood-intensity">
                  {Array.from({ length: entry.intensity }, (_, i) => (
                    <text key={i} className="intensity-dot" />
                  ))}
                </view>
              </view>
            ))}
          </view>
        </view>
      )}
    </view>
  )

  const renderMoodLog = () => (
    <view className="mood-log-container">
      <view className="mood-log-header">
        <view className="back-button" bindtap={() => setCurrentView('main')}>
          <text className="back-button-text">← Back</text>
        </view>
        <text className="mood-log-title">How are you feeling?</text>
      </view>

      <view className="mood-selector">
        {['happy', 'sad', 'anxious', 'excited'].map(mood => (
          <view 
            key={mood}
            className={`mood-option ${moodData.mood === mood ? 'selected' : ''}`}
            bindtap={() => setMoodData(prev => ({ ...prev, mood }))}
            style={{ backgroundColor: moodData.mood === mood ? getMoodColor(mood) : 'transparent' }}
          >
            <text className="mood-option-emoji">{getMoodEmoji(mood)}</text>
            <text className="mood-option-name">{capitalizeFirst(mood)}</text>
          </view>
        ))}
      </view>

      <view className="intensity-selector">
        <text className="intensity-label">Intensity (1-10)</text>
        <view className="intensity-slider">
          {Array.from({ length: 10 }, (_, i) => (
            <view 
              key={i}
              className={`intensity-bar ${i < moodData.intensity ? 'active' : ''}`}
              bindtap={() => setMoodData(prev => ({ ...prev, intensity: i + 1 }))}
            />
          ))}
        </view>
        <text className="intensity-value">{moodData.intensity}</text>
      </view>

      <view className="mood-inputs">
        <view className="mood-textarea-container">
          <text className="mood-textarea-label">What happened today? (optional)</text>
          <view 
            className={`mood-textarea-field ${focusedInput === 'mood.description' ? 'focused' : ''}`}
            bindtap={() => openInputModal('mood.description', moodData.description)}
          >
            <text className="mood-textarea-text">
              {moodData.description || 'Describe your day...'}
            </text>
          </view>
        </view>
        
        <view className="mood-textarea-container">
          <text className="mood-textarea-label">Additional notes (optional)</text>
          <view 
            className={`mood-textarea-field ${focusedInput === 'mood.note' ? 'focused' : ''}`}
            bindtap={() => openInputModal('mood.note', moodData.note)}
          >
            <text className="mood-textarea-text">
              {moodData.note || 'Add any thoughts...'}
            </text>
          </view>
        </view>
      </view>

      <view 
        className="log-mood-button"
        bindtap={handleLogMood}
      >
        <text className="log-mood-button-text">
          {isLoading ? 'Logging...' : 'Log My Mood'}
        </text>
      </view>
    </view>
  )

  const renderRecommendations = () => (
    <view className="recommendations-container">
      <view className="recommendations-header">
        <view className="back-button" bindtap={() => setCurrentView('main')}>
          <text className="back-button-text">← Back</text>
        </view>
        <text className="recommendations-title">Your Personalized Recommendations</text>
      </view>

      {!currentRecommendation ? (
        <view className="loading-recommendations">
          <text className="loading-text">Getting recommendations...</text>
          <view 
            className="get-recommendations-button"
            bindtap={handleGetRecommendation}
          >
            <text className="get-recommendations-button-text">
              {isLoading ? 'Loading...' : 'Get Recommendations'}
            </text>
          </view>
        </view>
      ) : (
        <view className="recommendation-card">
          <view className="recommendation-header">
            <text className="recommendation-type">{currentRecommendation.type.toUpperCase()}</text>
            <text className="recommendation-category">{capitalizeFirst(currentRecommendation.category)}</text>
          </view>
          
          <text className="recommendation-title">{currentRecommendation.title}</text>
          <text className="recommendation-description">{currentRecommendation.description}</text>
          <text className="recommendation-reasoning">{currentRecommendation.reasoning}</text>
          
          <view className="recommendation-actions">
            <view className="action-button like">
              <text className="action-button-text">👍 Like</text>
            </view>
            <view className="action-button dislike">
              <text className="action-button-text">👎 Dislike</text>
            </view>
            <view className="action-button share">
              <text className="action-button-text">📤 Share</text>
            </view>
          </view>
        </view>
      )}
    </view>
  )

  const renderCommunity = () => (
    <view className="community-container">
      <view className="community-header">
        <view className="back-button" bindtap={() => setCurrentView('main')}>
          <text className="back-button-text">← Back</text>
        </view>
        <text className="community-title">Community Feed</text>
      </view>

      <view className="community-posts">
        {communityPosts.map(post => (
          <view key={post.id} className="community-post">
            <view className="post-header">
              <text className="post-username">{post.username}</text>
              <text className="post-mood">{getMoodEmoji(post.mood)} {capitalizeFirst(post.mood)}</text>
            </view>
            
            <text className="post-activity-title">{post.activity_title}</text>
            <text className="post-activity-description">{post.activity_description}</text>
            
            {post.description && (
              <text className="post-description">{post.description}</text>
            )}
            
            <view className="post-stats">
              <view 
                className={`post-stat ${post.isLiked ? 'liked' : ''}`}
                bindtap={() => handleLikePost(post.id)}
              >
                <text className="post-stat-text">👍 {post.likes_count}</text>
              </view>
              <view 
                className={`post-stat ${post.isStarred ? 'starred' : ''}`}
                bindtap={() => handleStarPost(post.id)}
              >
                <text className="post-stat-text">⭐ {post.stars_count}</text>
              </view>
              <view className="post-stat">
                <text className="post-stat-text">💬 {post.comments_count}</text>
              </view>
            </view>
          </view>
        ))}
      </view>
    </view>
  )

  return (
    <view className="app">
      {currentView === 'auth' && renderAuth()}
      {currentView === 'main' && renderMain()}
      {currentView === 'mood-log' && renderMoodLog()}
      {currentView === 'recommendations' && renderRecommendations()}
      {currentView === 'community' && renderCommunity()}
      {renderInputModal()}
    </view>
  )
}
