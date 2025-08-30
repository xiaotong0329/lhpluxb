import { useEffect, useState } from '@lynx-js/react';
import './App.css';

// Real API functions
const API_BASE_URL = 'http://127.0.0.1:8080';

const api = {
  login: async (identifier, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return await response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await response.json();
  },

  logMood: async (moodData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/mood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(moodData),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      }
      throw new Error(error.error || 'Failed to log mood');
    }

    return await response.json();
  },

  getRecommendation: async (moodData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(moodData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get recommendations');
    }

    return await response.json();
  },

  getMoodHistory: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/mood`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get mood history');
    }

    return await response.json();
  },

  getCommunityPosts: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/community/posts`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get community posts');
    }

    return await response.json();
  },

  likePost: async (postId, token) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/community/posts/${postId}/like`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like post');
    }

    return await response.json();
  },

  starPost: async (postId, token) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/community/posts/${postId}/star`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to star post');
    }

    return await response.json();
  },

  shareRecommendation: async (shareData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share recommendation');
    }

    return await response.json();
  },

  submitRecommendationFeedback: async (feedbackData, token) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/mood/recommendation/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit feedback');
    }

    return await response.json();
  },
};

export function App() {
  const [currentView, setCurrentView] = useState('auth');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);

  // Auth state
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: '',
    age: 25,
    nationality: 'American',
    gender: 'Prefer not to say',
    hobbies: ['reading', 'music'],
  });

  // Mood logging state
  const [moodData, setMoodData] = useState({
    mood: 'happy',
    intensity: 5,
    note: '',
    description: '',
  });

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarMoodEntries, setCalendarMoodEntries] = useState({});

  // Utility functions
  const getMoodEmoji = (mood) => {
    const emojis = { happy: '😊', sad: '😢', anxious: '😰', excited: '🤩' };
    return emojis[mood] || '😊';
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: '#FFD700',
      sad: '#87CEEB',
      anxious: '#DDA0DD',
      excited: '#FF6B6B',
    };
    return colors[mood] || '#FFD700';
  };

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasMoodEntry = (date) => {
    const dateKey = formatDateKey(date);
    return (
      calendarMoodEntries[dateKey] && calendarMoodEntries[dateKey].length > 0
    );
  };

  const getMoodForDate = (date) => {
    const dateKey = formatDateKey(date);
    const entries = calendarMoodEntries[dateKey];
    if (entries && entries.length > 0) {
      return entries[entries.length - 1].mood;
    }
    return null;
  };

  // Event handlers
  const handleAuth = async () => {
    setIsLoading(true);
    try {
      const result =
        authMode === 'login'
          ? await api.login(authData.username, authData.password)
          : await api.register(authData);

      console.log('Authentication successful:', result);
      setUser({ ...result.user, token: result.token });
      setCurrentView('main');
      console.log('User state set, view changed to main');
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMood = async () => {
    if (!user?.token) {
      console.error('No user token found');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.logMood(moodData, user.token);

      const now = new Date();
      const newMoodEntry = {
        id: result.mood_id,
        ...moodData,
        date: now.toISOString(),
      };

      setMoodEntries(prev => [...prev, newMoodEntry]);

      const dateKey = formatDateKey(now);
      setCalendarMoodEntries(prev => {
        const existingEntries = prev[dateKey] || [];
        return {
          ...prev,
          [dateKey]: [...existingEntries, newMoodEntry],
        };
      });

      setCurrentRecommendation(null);
      setCurrentView('recommendations');
    } catch (error) {
      console.error('Mood logging error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
        console.log('Authentication error detected, redirecting to login');
        setUser(null);
        setCurrentView('auth');
      } else {
        // For other errors, show an alert or handle differently
        alert('Failed to log mood: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunityPosts = async () => {
    if (!user?.token) return;

    setIsLoading(true);
    try {
      const result = await api.getCommunityPosts(user.token);
      setCommunityPosts(result.posts);
    } catch (error) {
      console.error('Community posts error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!user?.token) return;

    try {
      await api.likePost(postId, user.token);
      setCommunityPosts(prev =>
        prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            };
          }
          return post;
        }),
      );
    } catch (error) {
      console.error('Like post error:', error);
    }
  };

  const handleStarPost = async (postId) => {
    if (!user?.token) return;

    try {
      await api.starPost(postId, user.token);
      setCommunityPosts(prev =>
        prev.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              isStarred: !post.isStarred,
              stars: post.isStarred ? post.stars - 1 : post.stars + 1,
            };
          }
          return post;
        }),
      );
    } catch (error) {
      console.error('Star post error:', error);
    }
  };

  const loadMoodEntriesForCalendar = async () => {
    if (!user?.token) return;

    try {
      const entries = await api.getMoodHistory(user.token);
      const entriesByDate = {};

      entries.forEach(entry => {
        const dateKey = formatDateKey(new Date(entry.date));
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
      });

      setCalendarMoodEntries(entriesByDate);
      setMoodEntries(entries);
    } catch (error) {
      console.error('Failed to load mood entries for calendar:', error);
    }
  };

  // Load mood entries when user logs in
  useEffect(() => {
    if (user?.token) {
      loadMoodEntriesForCalendar();
    }
  }, [user]);

  // Load community posts when viewing community
  useEffect(() => {
    if (currentView === 'community') {
      loadCommunityPosts();
    }
  }, [currentView]);

  // Render functions
  const renderAuth = () => (
    <view className="auth-container">
      <view className="auth-card">
        <text className="auth-title">Mood Journal</text>
        <text className="auth-subtitle">
          Track your feelings, get personalized recommendations
        </text>

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

        <view className="auth-input-container">
          <text className="auth-input-label">Username</text>
          <input
            className="auth-input-field"
            placeholder="Enter username"
            value={authData.username}
            type="text"
            show-soft-input-on-focus={true}
            bindinput={(e) => {
              setAuthData(prev => ({ ...prev, username: e.detail.value }));
            }}
            bindfocus={(e) => {
              console.log('Username input focused');
            }}
            bindtap={(e) => {
              console.log('Username input tapped');
            }}
          />
        </view>

        {authMode === 'register' && (
          <>
            <view className="auth-input-container">
              <text className="auth-input-label">Email</text>
              <input
                className="auth-input-field"
                placeholder="Enter email"
                type="email"
                value={authData.email}
                show-soft-input-on-focus={true}
                bindinput={(e) => {
                  setAuthData(prev => ({ ...prev, email: e.detail.value }));
                }}
                bindfocus={(e) => {
                  console.log('Email input focused');
                }}
                bindtap={(e) => {
                  console.log('Email input tapped');
                }}
              />
            </view>

            <view className="auth-input-container">
              <text className="auth-input-label">Age</text>
              <input
                className="auth-input-field"
                placeholder="Enter age"
                type="number"
                value={authData.age.toString()}
                show-soft-input-on-focus={true}
                bindinput={(e) => {
                  setAuthData(prev => ({ ...prev, age: parseInt(e.detail.value) || 25 }));
                }}
                bindfocus={(e) => {
                  console.log('Age input focused');
                }}
                bindtap={(e) => {
                  console.log('Age input tapped');
                }}
              />
            </view>

            <view className="auth-input-container">
              <text className="auth-input-label">Gender</text>
              <input
                className="auth-input-field"
                placeholder="Enter gender"
                value={authData.gender}
                type="text"
                show-soft-input-on-focus={true}
                bindinput={(e) => {
                  setAuthData(prev => ({ ...prev, gender: e.detail.value }));
                }}
                bindfocus={(e) => {
                  console.log('Gender input focused');
                }}
                bindtap={(e) => {
                  console.log('Gender input tapped');
                }}
              />
            </view>

            <view className="auth-input-container">
              <text className="auth-input-label">Nationality</text>
              <input
                className="auth-input-field"
                placeholder="Enter nationality"
                value={authData.nationality}
                type="text"
                show-soft-input-on-focus={true}
                bindinput={(e) => {
                  setAuthData(prev => ({ ...prev, nationality: e.detail.value }));
                }}
                bindfocus={(e) => {
                  console.log('Nationality input focused');
                }}
                bindtap={(e) => {
                  console.log('Nationality input tapped');
                }}
              />
            </view>

            <view className="auth-input-container">
              <text className="auth-input-label">Hobbies (comma separated)</text>
              <input
                className="auth-input-field"
                placeholder="e.g., reading, music, sports"
                value={authData.hobbies.join(', ')}
                type="text"
                show-soft-input-on-focus={true}
                bindinput={(e) => {
                  const hobbiesArray = e.detail.value
                    .split(',')
                    .map(h => h.trim())
                    .filter(h => h);
                  setAuthData(prev => ({ ...prev, hobbies: hobbiesArray }));
                }}
                bindfocus={(e) => {
                  console.log('Hobbies input focused');
                }}
                bindtap={(e) => {
                  console.log('Hobbies input tapped');
                }}
              />
            </view>
          </>
        )}

        <view className="auth-input-container">
          <text className="auth-input-label">Password</text>
          <input
            className="auth-input-field"
            placeholder="Enter password"
            type="password"
            value={authData.password}
            show-soft-input-on-focus={true}
            bindinput={(e) => {
              setAuthData(prev => ({ ...prev, password: e.detail.value }));
            }}
            bindfocus={(e) => {
              console.log('Password input focused');
            }}
            bindtap={(e) => {
              console.log('Password input tapped');
            }}
          />
        </view>

        <view className="auth-button" bindtap={handleAuth}>
          <text className="auth-button-text">
            {isLoading
              ? 'Loading...'
              : authMode === 'login'
                ? 'Login'
                : 'Register'}
          </text>
        </view>
      </view>
    </view>
  );

  const renderMain = () => (
    <view className="main-container">
      <view className="header">
        <text className="welcome-text">Welcome back, {user?.username}! 👋</text>
        <text className="date-text">{new Date().toLocaleDateString()}</text>
      </view>

      <view className="calendar-section">
        <view className="calendar-header">
          <view
            className="calendar-nav-button"
            bindtap={() => {
              setCurrentDate(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - 1,
                1,
              ));
            }}
          >
            <text className="calendar-nav-text">‹</text>
          </view>
          <text className="calendar-title">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </text>
          <view
            className="calendar-nav-button"
            bindtap={() => {
              setCurrentDate(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                1,
              ));
            }}
          >
            <text className="calendar-nav-text">›</text>
          </view>
        </view>

        <view className="calendar-grid">
          <view className="calendar-day-header">Sun</view>
          <view className="calendar-day-header">Mon</view>
          <view className="calendar-day-header">Tue</view>
          <view className="calendar-day-header">Wed</view>
          <view className="calendar-day-header">Thu</view>
          <view className="calendar-day-header">Fri</view>
          <view className="calendar-day-header">Sat</view>

          {/* Calendar days would be rendered here */}
        </view>
      </view>

      <view className="bottom-actions">
        <view
          className="action-button log-mood"
          bindtap={() => setCurrentView('mood-log')}
        >
          <text className="action-button-text">📝 Log Mood</text>
        </view>
        <view
          className="action-button community"
          bindtap={() => setCurrentView('community')}
        >
          <text className="action-button-text">🌍 Community</text>
        </view>
      </view>
    </view>
  );

  const renderMoodLog = () => (
    <view className="mood-log-container">
      <view className="mood-log-header">
        <view
          className="back-button"
          bindtap={() => setCurrentView('main')}
        >
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
            style={{
              backgroundColor:
                moodData.mood === mood ? getMoodColor(mood) : 'transparent',
            }}
          >
            <text className="mood-option-emoji">{getMoodEmoji(mood)}</text>
            <text className="mood-option-name">{capitalizeFirst(mood)}</text>
          </view>
        ))}
      </view>

      <view className="mood-intensity">
        <text className="mood-intensity-label">
          Intensity: {moodData.intensity}
        </text>
        <input
          type="range"
          min="1"
          max="10"
          value={moodData.intensity.toString()}
          bindinput={(e) => {
            setMoodData(prev => ({ ...prev, intensity: parseInt(e.detail.value) || 5 }));
          }}
          bindfocus={(e) => {
            console.log('Intensity input focused');
          }}
          style={{ width: '100%', marginTop: '10px' }}
        />
      </view>

      <view className="mood-input-container">
        <text className="mood-input-label">What happened today?</text>
        <input
          className="mood-input-field"
          placeholder="Describe what made you feel this way..."
          value={moodData.description}
          type="text"
          show-soft-input-on-focus={true}
          bindinput={(e) => {
            setMoodData(prev => ({ ...prev, description: e.detail.value }));
          }}
          bindfocus={(e) => {
            console.log('Description input focused');
          }}
          bindtap={(e) => {
            console.log('Description input tapped');
          }}
        />
      </view>

      <view className="mood-input-container">
        <text className="mood-input-label">Additional notes (optional)</text>
        <input
          className="mood-input-field"
          placeholder="Any additional thoughts..."
          value={moodData.note}
          type="text"
          show-soft-input-on-focus={true}
          bindinput={(e) => {
            setMoodData(prev => ({ ...prev, note: e.detail.value }));
          }}
          bindfocus={(e) => {
            console.log('Notes input focused');
          }}
          bindtap={(e) => {
            console.log('Notes input tapped');
          }}
        />
      </view>

      <view className="mood-log-button" bindtap={handleLogMood}>
        <text className="mood-log-button-text">
          {isLoading ? 'Logging...' : 'Log Mood'}
        </text>
      </view>
    </view>
  );

  const renderCommunity = () => (
    <view className="community-container">
      <view className="community-header">
        <view
          className="back-button"
          bindtap={() => setCurrentView('main')}
        >
          <text className="back-button-text">← Back</text>
        </view>
        <text className="community-title">Community Feed</text>
      </view>

      <scroll-view
        className="community-posts-scroll"
        scroll-orientation="vertical"
        style={{ flex: 1, width: '100%' }}
        bounces={true}
        scroll-bar-enable={true}
      >
        {communityPosts.map(post => (
          <view key={post._id} className="community-post">
            <view className="post-header">
              <text className="post-username">{post.user_username}</text>
              <text className="post-mood">
                {getMoodEmoji(post.mood)} {capitalizeFirst(post.mood)}
              </text>
            </view>

            <text className="post-activity-title">{post.activity_title}</text>
            <text className="post-activity-description">
              {post.activity_description}
            </text>

            {post.description && (
              <text className="post-description">{post.description}</text>
            )}

            <view className="post-stats">
              <view
                className={`post-stat ${post.isLiked ? 'liked' : ''}`}
                bindtap={() => handleLikePost(post._id)}
              >
                <text className="post-stat-text">👍 {post.likes}</text>
              </view>
              <view
                className={`post-stat ${post.isStarred ? 'starred' : ''}`}
                bindtap={() => handleStarPost(post._id)}
              >
                <text className="post-stat-text">⭐ {post.stars}</text>
              </view>
              <view className="post-stat">
                <text className="post-stat-text">💬 {post.comments_count}</text>
              </view>
            </view>
          </view>
        ))}
      </scroll-view>
    </view>
  );

  // Main render
  let content;
  switch (currentView) {
    case 'auth':
      content = renderAuth();
      break;
    case 'main':
      content = renderMain();
      break;
    case 'mood-log':
      content = renderMoodLog();
      break;
    case 'community':
      content = renderCommunity();
      break;
    default:
      content = renderAuth();
  }

  return <view className="app">{content}</view>;
}
