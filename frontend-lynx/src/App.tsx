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
  token: string
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

// Real API functions
const API_BASE_URL = 'http://127.0.0.1:8080'

const api = {
  login: async (identifier: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }
    
    return await response.json()
  },
  
  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }
    
    return await response.json()
  },

  logMood: async (moodData: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/mood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(moodData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to log mood')
    }
    
    return await response.json()
  },

  getRecommendation: async (moodData: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(moodData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get recommendations')
    }
    
    return await response.json()
  },

  getMoodHistory: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/mood`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get mood history')
    }
    
    return await response.json()
  },

  getMoodEntriesByDate: async (token: string, date: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/mood?date=${date}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get mood entries for date')
    }
    
    return await response.json()
  },

  createCommunityPost: async (postData: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/community/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create post')
    }
    
    return await response.json()
  },

  getCommunityPosts: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/community/posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get community posts')
    }
    
    return await response.json()
  },

  likePost: async (postId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/community/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to like post')
    }
    
    return await response.json()
  },

  starPost: async (postId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/community/posts/${postId}/star`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to star post')
    }
    
    return await response.json()
  }
}

export function App() {
  const [currentView, setCurrentView] = useState<'auth' | 'main' | 'mood-log' | 'recommendations' | 'community' | 'day-detail'>('auth')
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
  // Input modal state for real-time text input
  const [showInputModal, setShowInputModal] = useState(false)
  const [inputModalValue, setInputModalValue] = useState('')
  const [inputModalField, setInputModalField] = useState('')
  const [inputModalType, setInputModalType] = useState<'text' | 'textarea'>('text')

  // Mood logging state
  const [moodData, setMoodData] = useState({
    mood: 'happy',
    intensity: 5,
    note: '',
    description: ''
  })

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarMoodEntries, setCalendarMoodEntries] = useState<{[key: string]: MoodEntry[]}>({})

  const handleAuth = async () => {
    console.log('Auth data being sent:', authData)
    console.log('Auth mode:', authMode)
    setIsLoading(true)
    try {
      const result = authMode === 'login' 
        ? await api.login(authData.username, authData.password)
        : await api.register(authData)
      
      console.log('Auth result:', result)
      setUser({ ...result.user, token: result.token })
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
      const token = user?.token || ''
      const result = await api.logMood(moodData, token)
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
      const token = user?.token || ''
      const result = await api.getRecommendation(moodData, token)
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
      const token = user?.token || ''
      const result = await api.getCommunityPosts(token)
      setCommunityPosts(result.posts)
    } catch (error) {
      console.error('Community posts error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const token = user?.token || ''
      await api.likePost(postId, token)
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
    } catch (error) {
      console.error('Like post error:', error)
    }
  }

  const handleStarPost = async (postId: string) => {
    try {
      const token = user?.token || ''
      await api.starPost(postId, token)
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
    } catch (error) {
      console.error('Star post error:', error)
    }
  }

  const openInputModal = (field: string, currentValue: string, type: 'text' | 'textarea' = 'text') => {
    setInputModalField(field)
    setInputModalValue(currentValue)
    setInputModalType(type)
    setFocusedInput(field)
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

  useEffect(() => {
    if (user && currentView === 'main') {
      loadMoodEntriesForCalendar()
    }
  }, [user, currentView])

  const loadMoodEntriesForCalendar = async () => {
    if (!user?.token) return
    
    try {
      const entries = await api.getMoodHistory(user.token)
      const entriesByDate: {[key: string]: MoodEntry[]} = {}
      
      entries.forEach((entry: MoodEntry) => {
        const dateKey = formatDateKey(new Date(entry.date))
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = []
        }
        entriesByDate[dateKey].push(entry)
      })
      
      setCalendarMoodEntries(entriesByDate)
      setMoodEntries(entries)
    } catch (error) {
      console.error('Failed to load mood entries for calendar:', error)
    }
  }

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

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const hasMoodEntry = (date: Date) => {
    const dateKey = formatDateKey(date)
    return calendarMoodEntries[dateKey] && calendarMoodEntries[dateKey].length > 0
  }

  const getMoodForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    const entries = calendarMoodEntries[dateKey]
    if (entries && entries.length > 0) {
      return entries[0].mood // Return the first mood entry for the date
    }
    return null
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

    const isPassword = inputModalField === 'auth.password'

    // Keyboard helpers
    const baseKeys = ['1','2','3','4','5','6','7','8','9','0','@','_','.','-']
    const baseRowA = baseKeys.slice(0, 10)
    const baseRowB = baseKeys.slice(10)
    const row1 = ['q','w','e','r','t','y','u','i','o','p']
    const row2 = ['a','s','d','f','g','h','j','k','l']
    const row3 = ['z','x','c','v','b','n','m']
    const [caps, setCaps] = useState(false)

    const addChar = (ch: string) => {
      const c = caps ? ch.toUpperCase() : ch
      setInputModalValue(prev => prev + c)
    }
    const addSpace = () => setInputModalValue(prev => prev + ' ')
    const backspace = () => setInputModalValue(prev => prev.slice(0, - 1))
    const clearAll = () => setInputModalValue('')

  return (
      <view className="input-modal-overlay">
        <view className="input-modal">
          <text className="input-modal-title">{getFieldLabel(inputModalField)}</text>

          {/* Display field/content area */}
          <view className="input-modal-field">
            <text className="input-modal-text">
              {isPassword && inputModalValue ? '•'.repeat(inputModalValue.length) : (inputModalValue || 'Enter text...')}
            </text>
          </view>

          {/* If textarea, show quick actions for newline/space/clear */}
          {inputModalType === 'textarea' && (
            <view className="input-modal-textarea-actions">
              <view className="input-modal-textarea-button" bindtap={clearAll}>
                <text className="input-modal-textarea-button-text">Clear</text>
              </view>
              <view className="input-modal-textarea-button" bindtap={backspace}>
                <text className="input-modal-textarea-button-text">← Back</text>
              </view>
              <view className="input-modal-textarea-button" bindtap={addSpace}>
                <text className="input-modal-textarea-button-text">Space</text>
              </view>
            </view>
          )}

          {/* Keyboard anchored at bottom half */}
          <view className="input-modal-keyboard">
            <view className="kb-row ten">
              {baseRowA.map(k => (
                <view key={`ba-${k}`} className="kb-key" bindtap={() => addChar(k)}>
                  <text className="kb-key-text">{k}</text>
                </view>
              ))}
            </view>
            {baseRowB.length > 0 && (
              <view className="kb-row nine">
                {baseRowB.map(k => (
                  <view key={`bb-${k}`} className="kb-key" bindtap={() => addChar(k)}>
                    <text className="kb-key-text">{k}</text>
                  </view>
                ))}
              </view>
            )}

            <view className="kb-row ten">
              {row1.map(k => (
                <view key={`r1-${k}`} className="kb-key" bindtap={() => addChar(k)}>
                  <text className="kb-key-text">{caps ? k.toUpperCase() : k}</text>
                </view>
              ))}
            </view>

            <view className="kb-row nine">
              {row2.map(k => (
                <view key={`r2-${k}`} className="kb-key" bindtap={() => addChar(k)}>
                  <text className="kb-key-text">{caps ? k.toUpperCase() : k}</text>
                </view>
              ))}
            </view>

            <view className="kb-row nine">
              <view className="kb-key wide" bindtap={() => setCaps(!caps)}>
                <text className="kb-key-text">{caps ? 'Caps On' : 'Caps Off'}</text>
              </view>
              {row3.map(k => (
                <view key={`r3-${k}`} className="kb-key" bindtap={() => addChar(k)}>
                  <text className="kb-key-text">{caps ? k.toUpperCase() : k}</text>
                </view>
              ))}
              <view className="kb-key wide" bindtap={backspace}>
                <text className="kb-key-text">←</text>
              </view>
            </view>

            <view className="kb-row nine">
              <view className="kb-key xl" bindtap={addSpace}>
                <text className="kb-key-text">Space</text>
              </view>
              <view className="kb-key" bindtap={clearAll}>
                <text className="kb-key-text">Clear</text>
              </view>
            </view>
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
              bindtap={() => openInputModal('auth.username', authData.username, 'text')}
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
                bindtap={() => openInputModal('auth.email', authData.email, 'text')}
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
              bindtap={() => openInputModal('auth.password', authData.password, 'text')}
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

      {/* Calendar Section - Takes up 2/3 of the screen */}
      <view className="calendar-section">
        <view className="calendar-header">
          <view 
            className="calendar-nav-button"
            bindtap={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() - 1)
              setCurrentDate(newDate)
            }}
          >
            <text className="calendar-nav-text">‹</text>
          </view>
          <text className="calendar-title">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </text>
          <view 
            className="calendar-nav-button"
            bindtap={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() + 1)
              setCurrentDate(newDate)
            }}
          >
            <text className="calendar-nav-text">›</text>
          </view>
        </view>

        <view className="calendar-grid">
          {/* Day headers */}
          <view className="calendar-day-header">Sun</view>
          <view className="calendar-day-header">Mon</view>
          <view className="calendar-day-header">Tue</view>
          <view className="calendar-day-header">Wed</view>
          <view className="calendar-day-header">Thu</view>
          <view className="calendar-day-header">Fri</view>
          <view className="calendar-day-header">Sat</view>

          {/* Calendar days */}
          {getDaysInMonth(currentDate).map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const mood = getMoodForDate(date)
            const hasEntry = hasMoodEntry(date)
            
            return (
              <view 
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isSelectedDate(date) ? 'selected' : ''} ${hasEntry ? 'has-mood' : ''}`}
                bindtap={() => {
                  setSelectedDate(date)
                  if (hasEntry) {
                    setCurrentView('day-detail')
                  }
                }}
              >
                <text className="calendar-day-number">{date.getDate()}</text>
                {hasEntry && mood && (
                  <text className="calendar-day-mood">{getMoodEmoji(mood)}</text>
                )}
              </view>
            )
          })}
        </view>
      </view>

      {/* Bottom Action Buttons */}
      <view className="bottom-actions">
        <view className="action-button log-mood" bindtap={() => setCurrentView('mood-log')}>
          <text className="action-button-text">📝 Log Mood</text>
        </view>
        <view className="action-button community" bindtap={() => setCurrentView('community')}>
          <text className="action-button-text">🌍 Community</text>
        </view>
      </view>
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
            bindtap={() => openInputModal('mood.description', moodData.description, 'textarea')}
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
            bindtap={() => openInputModal('mood.note', moodData.note, 'textarea')}
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

  const renderDayDetail = () => {
    if (!selectedDate) return null
    
    const dateKey = formatDateKey(selectedDate)
    const dayEntries = calendarMoodEntries[dateKey] || []
    
    return (
      <view className="day-detail-container">
        <view className="day-detail-header">
          <view className="back-button" bindtap={() => setCurrentView('main')}>
            <text className="back-button-text">← Back</text>
          </view>
          <text className="day-detail-title">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </text>
        </view>

        {dayEntries.length === 0 ? (
          <view className="no-entries">
            <text className="no-entries-text">No mood entries for this day</text>
            <view className="add-entry-button" bindtap={() => setCurrentView('mood-log')}>
              <text className="add-entry-button-text">Add Mood Entry</text>
            </view>
          </view>
        ) : (
          <view className="day-entries">
            {dayEntries.map(entry => (
              <view key={entry.id} className="day-entry-card">
                <view className="entry-header">
                  <text className="entry-mood-emoji">{getMoodEmoji(entry.mood)}</text>
                  <text className="entry-mood-name">{capitalizeFirst(entry.mood)}</text>
                  <view className="entry-intensity">
                    {Array.from({ length: entry.intensity }, (_, i) => (
                      <text key={i} className="intensity-dot" />
                    ))}
                  </view>
                </view>
                
                {entry.description && (
                  <text className="entry-description">{entry.description}</text>
                )}
                
                {entry.note && (
                  <text className="entry-note">{entry.note}</text>
                )}
                
                <text className="entry-time">
                  {new Date(entry.date).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </text>
              </view>
            ))}
          </view>
        )}
      </view>
    )
  }

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
      {currentView === 'day-detail' && renderDayDetail()}
      {renderInputModal()}
    </view>
  )
}
