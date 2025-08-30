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
    console.log('API getRecommendation called with:', { moodData, token: token ? 'present' : 'missing' });
    
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(moodData),
    });

    console.log('API response status:', response.status);
    console.log('API response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('API error response:', error);
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired token');
      }
      throw new Error(error.error || 'Failed to get recommendations');
    }

    const result = await response.json();
    console.log('API success response:', result);
    return result;
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

  shareAIRecommendation: async (shareData, token) => {
    console.log('API shareAIRecommendation called with:', shareData);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/mood/share-ai-recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shareData),
    });

    console.log('Share AI API response status:', response.status);
    console.log('Share AI API response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('Share AI API error response:', error);
      throw new Error(error.error || 'Failed to share AI recommendation');
    }

    const result = await response.json();
    console.log('Share AI API success response:', result);
    return result;
  },

  submitRecommendationFeedback: async (feedbackData, token) => {
    console.log('API submitRecommendationFeedback called with:', feedbackData);
    
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

    console.log('Feedback API response status:', response.status);
    console.log('Feedback API response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('Feedback API error response:', error);
      throw new Error(error.error || 'Failed to submit feedback');
    }

    const result = await response.json();
    console.log('Feedback API success response:', result);
    return result;
  },

  submitAIRecommendationFeedback: async (feedbackData, token) => {
    console.log('API submitAIRecommendationFeedback called with:', feedbackData);
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/mood/ai-recommendation/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      },
    );

    console.log('AI Feedback API response status:', response.status);
    console.log('AI Feedback API response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('AI Feedback API error response:', error);
      throw new Error(error.error || 'Failed to submit AI feedback');
    }

    const result = await response.json();
    console.log('AI Feedback API success response:', result);
    return result;
  },
};

export function App() {
  const [currentView, setCurrentView] = useState('auth');
  const [user, setUser] = useState(() => {
    // Try to restore user from localStorage on app start
    try {
      if (typeof localStorage !== 'undefined') {
        const savedUser = localStorage.getItem('moodJournalUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log('Restored user from localStorage:', parsedUser);
          return parsedUser;
        }
      }
    } catch (error) {
      console.error('Error restoring user from localStorage:', error);
    }
    return null;
  });
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
  const [moodLogDate, setMoodLogDate] = useState(new Date()); // Date for logging mood

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
    const dateKey = date.toISOString().split('T')[0];
    console.log('formatDateKey input:', date);
    console.log('formatDateKey output:', dateKey);
    return dateKey;
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
    console.log(`Getting mood for date ${dateKey}:`, entries);
    if (entries && entries.length > 0) {
      const lastMood = entries[entries.length - 1].mood;
      console.log(`Last mood for ${dateKey}:`, lastMood);
      return lastMood;
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
      const userData = { ...result.user, token: result.token };
      setUser(userData);
      
      // Save user to localStorage for persistence
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('moodJournalUser', JSON.stringify(userData));
          console.log('User saved to localStorage');
        } else {
          console.log('localStorage not available, skipping save');
        }
      } catch (error) {
        console.error('Error saving user to localStorage:', error);
      }
      
      setCurrentView('main');
      console.log('User state set, view changed to main');
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logging out user');
    setUser(null);
    setCurrentView('auth');
    setMoodEntries([]);
    setCurrentRecommendation(null);
    setCommunityPosts([]);
    
    // Clear localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('moodJournalUser');
        console.log('User data cleared from localStorage');
      }
    } catch (error) {
      console.error('Error clearing user data from localStorage:', error);
    }
  };

  const handleGetRecommendation = async () => {
    console.log('handleGetRecommendation called');
    console.log('Current user:', user);
    console.log('Current moodData:', moodData);
    console.log('Current view:', currentView);
    
    if (!user?.token) {
      console.error('No user token found for recommendations');
      return;
    }

    if (!moodData || !moodData.mood) {
      console.error('No mood data available for recommendations');
      alert('Please log a mood first to get recommendations');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Getting recommendations for mood:', moodData);
      console.log('API call with token:', user.token.substring(0, 20) + '...');
      const result = await api.getRecommendation(moodData, user.token);
      console.log('Recommendations received:', result);
      
      if (result.alternatives && result.alternatives.length > 0) {
        console.log('Setting recommendation:', result.alternatives[0]);
        setCurrentRecommendation(result.alternatives[0]);
      } else {
        console.log('No alternatives in result');
        alert('No recommendations available');
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      console.error('Error details:', error.message);
      alert('Failed to get recommendations: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationFeedback = async (feedback) => {
    console.log('handleRecommendationFeedback called with:', feedback);
    console.log('Current recommendation:', currentRecommendation);
    
    if (!user?.token || !currentRecommendation) {
      console.error('No user token or recommendation for feedback');
      return;
    }

    // For AI-generated recommendations that don't have IDs, we'll use a simpler approach
    if (!currentRecommendation.id && !currentRecommendation._id) {
      console.log('AI recommendation without ID, using simple feedback');
      
      // Store feedback locally or send to a different endpoint
      const feedbackData = {
        recommendation_title: currentRecommendation.title,
        recommendation_type: currentRecommendation.type,
        recommendation_description: currentRecommendation.description,
        liked: feedback === 'like',
        mood: moodData.mood,
        user_id: user.id
      };
      
      console.log('Sending AI feedback data:', feedbackData);
      
      try {
        await api.submitAIRecommendationFeedback(feedbackData, user.token);
        console.log('AI feedback submitted successfully:', feedback);
        alert('Thank you for your feedback! This helps improve future recommendations.');
      } catch (error) {
        console.error('Failed to submit AI feedback:', error);
        console.error('Error details:', error.message);
        alert('Failed to submit feedback: ' + error.message);
      }
      return;
    }

    // For saved recommendations with IDs
    try {
      const feedbackData = {
        recommendation_id: currentRecommendation.id || currentRecommendation._id,
        liked: feedback === 'like', // Convert 'like'/'dislike' to boolean
        mood: moodData.mood // Send just the mood string, not the whole object
      };
      
      console.log('Sending feedback data:', feedbackData);
      
      await api.submitRecommendationFeedback(feedbackData, user.token);
      console.log('Feedback submitted successfully:', feedback);
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      console.error('Error details:', error.message);
      alert('Failed to submit feedback: ' + error.message);
    }
  };

  const handleShareRecommendation = async () => {
    console.log('handleShareRecommendation called');
    console.log('Current recommendation:', currentRecommendation);
    
    if (!user?.token || !currentRecommendation) {
      console.error('No user token or recommendation for sharing');
      return;
    }

    // For AI-generated recommendations that don't have IDs, use the AI share endpoint
    if (!currentRecommendation.id && !currentRecommendation._id) {
      console.log('AI recommendation without ID, using AI share endpoint');
      
      const shareData = {
        recommendation_title: currentRecommendation.title,
        recommendation_type: currentRecommendation.type,
        recommendation_description: currentRecommendation.description,
        mood_data: moodData,
        description: `I'm feeling ${moodData.mood} and got this recommendation: ${currentRecommendation.title}`
      };
      
      console.log('Sending AI share data:', shareData);
      
      try {
        await api.shareAIRecommendation(shareData, user.token);
        console.log('AI recommendation shared successfully');
        alert('AI recommendation shared to community!');
      } catch (error) {
        console.error('Failed to share AI recommendation:', error);
        console.error('Error details:', error.message);
        alert('Failed to share AI recommendation: ' + error.message);
      }
      return;
    }

    // For saved recommendations with IDs
    try {
      const shareData = {
        recommendation_id: currentRecommendation.id || currentRecommendation._id,
        mood: moodData.mood,
        mood_intensity: moodData.intensity,
        description: `I'm feeling ${moodData.mood} and got this recommendation: ${currentRecommendation.title}`
      };
      
      console.log('Sending share data:', shareData);
      
      await api.shareRecommendation(shareData, user.token);
      console.log('Recommendation shared successfully');
      alert('Recommendation shared to community!');
    } catch (error) {
      console.error('Failed to share recommendation:', error);
      console.error('Error details:', error.message);
      alert('Failed to share recommendation: ' + error.message);
    }
  };

  const handleLogMood = async () => {
    console.log('handleLogMood called');
    console.log('Current user state:', user);
    console.log('Current moodData:', moodData);
    console.log('Current view before logging:', currentView);
    
    if (!user?.token) {
      console.error('No user token found');
      console.log('User state is:', user);
      // Don't redirect to auth if we're already on a different view
      if (currentView !== 'auth') {
        console.log('User lost but staying on current view');
        return;
      }
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calling API with token:', user.token.substring(0, 20) + '...');
      console.log('Logging mood for date:', moodLogDate);
      
      // Send the selected date to the backend
      const moodDataWithDate = {
        ...moodData,
        date: moodLogDate.toISOString()
      };
      
      const result = await api.logMood(moodDataWithDate, user.token);
      console.log('API call successful, result:', result);

      // Use the date from the API response to ensure consistency
      const apiDate = new Date(result.date);
      const newMoodEntry = {
        id: result.mood_id,
        ...moodData,
        date: result.date, // Use the API response date
      };

      console.log('Created new mood entry:', newMoodEntry);
      console.log('API date:', apiDate);
      console.log('Local date:', new Date());

      setMoodEntries(prev => [...prev, newMoodEntry]);

      const dateKey = formatDateKey(apiDate);
      console.log('Date key for calendar:', dateKey);
      setCalendarMoodEntries(prev => {
        const existingEntries = prev[dateKey] || [];
        return {
          ...prev,
          [dateKey]: [...existingEntries, newMoodEntry],
        };
      });

      console.log('About to set currentView to recommendations');
      setCurrentRecommendation(null);
      setCurrentView('recommendations');
      console.log('View changed to recommendations');
      
      // Automatically get recommendations after logging mood
      setTimeout(() => {
        handleGetRecommendation();
      }, 100);
    } catch (error) {
      console.error('Mood logging error:', error);
      console.error('Error message:', error.message);
      
      // Check if it's an authentication error
      if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
        console.log('Authentication error detected, redirecting to login');
        setUser(null);
        setCurrentView('auth');
      } else {
        // For other errors, show an alert or handle differently
        console.log('Non-auth error, showing alert');
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
      console.log('Loading mood entries for calendar...');
      const result = await api.getMoodHistory(user.token);
      console.log('Mood history result:', result);
      
      const entries = result.moods || [];
      console.log('Mood entries loaded:', entries.length);
      
      const entriesByDate = {};
      entries.forEach(entry => {
        const dateKey = formatDateKey(new Date(entry.date));
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
      });

      console.log('Entries by date:', entriesByDate);
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

  // Auto-redirect to main if user is already logged in
  useEffect(() => {
    if (user?.token && currentView === 'auth') {
      console.log('User already logged in, redirecting to main');
      setCurrentView('main');
    }
  }, [user, currentView]);

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

          {/* Render calendar days */}
          {(() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            const days = [];
            const today = new Date();
            
            for (let i = 0; i < 42; i++) {
              const date = new Date(startDate);
              date.setDate(startDate.getDate() + i);
              
              const isCurrentMonth = date.getMonth() === month;
              const isToday = date.toDateString() === today.toDateString();
              const dateKey = formatDateKey(date);
              const moodForDate = getMoodForDate(date);
              
              days.push(
                <view
                  key={i}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${moodForDate ? 'has-mood' : ''}`}
                  bindtap={() => {
                    if (isCurrentMonth) {
                      if (moodForDate) {
                        // If there's already a mood for this date, show day details
                        setSelectedDate(date);
                        setCurrentView('day-detail');
                        console.log('Showing day details for date:', date.toDateString());
                      } else {
                        // If no mood for this date, navigate to mood logging
                        setMoodLogDate(date);
                        setCurrentView('mood-log');
                        console.log('Navigating to mood logging for date:', date.toDateString());
                      }
                    }
                  }}
                  style={{
                    backgroundColor: moodForDate ? getMoodColor(moodForDate) : undefined,
                    opacity: !isCurrentMonth ? 0.4 : 1
                  }}
                >
                  <text className="calendar-day-number">{date.getDate()}</text>
                  {moodForDate && (
                    <text className="calendar-day-mood" style={{ fontSize: '12px', marginTop: '2px' }}>
                      {getMoodEmoji(moodForDate)}
                    </text>
                  )}
                </view>
              );
            }
            
            return days;
          })()}
        </view>
      </view>

      <view className="bottom-actions">
        <view
          className="action-button log-mood"
          bindtap={() => {
            setMoodLogDate(new Date()); // Set current date for mood logging
            setCurrentView('mood-log');
          }}
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
              backgroundColor: moodData.mood === mood ? getMoodColor(mood) : 'rgba(255, 255, 255, 0.95)',
              border: moodData.mood === mood ? '3px solid #667eea' : '3px solid transparent',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: moodData.mood === mood ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
              transform: moodData.mood === mood ? 'translateY(-2px)' : 'translateY(0)'
            }}
          >
            <text className="mood-option-emoji" style={{ fontSize: '32px', marginBottom: '8px' }}>{getMoodEmoji(mood)}</text>
            <text className="mood-option-name" style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: moodData.mood === mood ? 'white' : '#333' 
            }}>{capitalizeFirst(mood)}</text>
          </view>
        ))}
      </view>

      <view className="mood-intensity">
        <text className="mood-intensity-label" style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'white',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          Intensity (1-10)
        </text>
        
        {/* Segmented intensity bar */}
        <view style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '4px',
          marginBottom: '15px',
          width: '100%'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
            <view
              key={level}
              bindtap={() => {
                console.log('Intensity segment selected:', level);
                setMoodData(prev => ({ ...prev, intensity: level }));
              }}
              style={{
                flex: 1,
                height: '20px',
                backgroundColor: moodData.intensity >= level ? '#6036d6' : 'rgb(255, 255, 255)',
                borderRadius: '6px',
                transition: 'all 0.3s ease',
                border: moodData.intensity >= level ? 'none' : '1px solid rgb(255, 255, 255)',
                minWidth: '20px'
              }}
            />
          ))}
        </view>
      </view>

      <view className="mood-input-container">
        <text className="mood-input-label" style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: 'white', 
          marginBottom: '12px' 
        }}>What happened today?</text>
        <input
          className="mood-input-field"
          placeholder="Describe what made you feel this way..."
          value={moodData.description}
          type="text"
          show-soft-input-on-focus={true}
          auto-focus={false}
          bindinput={(e) => {
            console.log('Description input value:', e.detail.value);
            setMoodData(prev => ({ ...prev, description: e.detail.value }));
          }}
          bindfocus={(e) => {
            console.log('Description input focused');
          }}
          bindblur={(e) => {
            console.log('Description input blurred');
          }}
          bindtap={(e) => {
            console.log('Description input tapped');
          }}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            color: '#333',
            minHeight: '60px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
        />
      </view>

      <view className="mood-input-container">
        <text className="mood-input-label" style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: 'white', 
          marginBottom: '12px' 
        }}>Additional notes (optional)</text>
        <input
          className="mood-input-field"
          placeholder="Any additional thoughts..."
          value={moodData.note}
          type="text"
          show-soft-input-on-focus={true}
          auto-focus={false}
          bindinput={(e) => {
            console.log('Notes input value:', e.detail.value);
            setMoodData(prev => ({ ...prev, note: e.detail.value }));
          }}
          bindfocus={(e) => {
            console.log('Notes input focused');
          }}
          bindblur={(e) => {
            console.log('Notes input blurred');
          }}
          bindtap={(e) => {
            console.log('Notes input tapped');
          }}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            color: '#333',
            minHeight: '60px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
        />
      </view>

      <view 
        className="mood-log-button" 
        bindtap={handleLogMood}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.3s ease',
          marginTop: '30px',
          border: 'none'
        }}
      >
        <text className="mood-log-button-text" style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '600'
        }}>
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
            </view>
          </view>
        ))}
      </scroll-view>
    </view>
  );

  const renderRecommendations = () => (
    <view className="recommendations-container">
      <view className="recommendations-header">
        <view
          className="back-button"
          bindtap={() => setCurrentView('main')}
        >
          <text className="back-button-text">← Back</text>
        </view>
        <text className="recommendations-title">Your Recommendations</text>
      </view>

      {isLoading ? (
        <view className="loading-recommendations">
          <text className="loading-text">Getting personalized recommendations...</text>
        </view>
      ) : currentRecommendation ? (
        <view className="recommendation-card">
          <view className="recommendation-header">
            <text className="recommendation-type">{currentRecommendation.type}</text>
            <text className="recommendation-category">{currentRecommendation.category}</text>
          </view>
          <text className="recommendation-title">{currentRecommendation.title}</text>
          <text className="recommendation-description">{currentRecommendation.description}</text>
          <text className="recommendation-reasoning">{currentRecommendation.reasoning}</text>
          <view className="recommendation-actions">
            <view
              className="action-button like"
              bindtap={() => handleRecommendationFeedback('like')}
            >
              <text className="action-button-text">👍 Like</text>
            </view>
            <view
              className="action-button dislike"
              bindtap={() => handleRecommendationFeedback('dislike')}
            >
              <text className="action-button-text">👎 Dislike</text>
            </view>
            <view
              className="action-button share"
              bindtap={() => handleShareRecommendation()}
            >
              <text className="action-button-text">📤 Share</text>
            </view>
          </view>
        </view>
      ) : (
        <view className="loading-recommendations">
          <text className="loading-text">No recommendations yet</text>
          <view
            className="get-recommendations-button"
            bindtap={() => {
              console.log('Get Recommendations button clicked!');
              console.log('Current moodData:', moodData);
              console.log('Current user:', user);
              handleGetRecommendation();
            }}
          >
            <text className="get-recommendations-button-text">Get Recommendations</text>
          </view>
        </view>
      )}
    </view>
  );

  const renderDayDetail = () => {
    if (!selectedDate) return renderMain();
    
    const dateKey = formatDateKey(selectedDate);
    const entries = calendarMoodEntries[dateKey] || [];
    
    return (
      <view className="day-detail-container">
        <view className="day-detail-header">
          <view
            className="back-button"
            bindtap={() => setCurrentView('main')}
          >
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

        {entries.length === 0 ? (
          <view className="no-entries">
            <text className="no-entries-text">No mood entries for this day</text>
            <view
              className="add-entry-button"
              bindtap={() => {
                setCurrentView('mood-log');
              }}
            >
              <text className="add-entry-button-text">Add Mood Entry</text>
            </view>
          </view>
        ) : (
          <view className="day-entries">
            {entries.map((entry, index) => (
              <view key={index} className="day-entry-card">
                <view className="entry-header">
                  <text className="entry-mood-emoji">{getMoodEmoji(entry.mood)}</text>
                  <text className="entry-mood-name">{capitalizeFirst(entry.mood)}</text>
                  <view className="entry-intensity">
                    {Array.from({ length: entry.intensity }, (_, i) => (
                      <view key={i} className="intensity-dot" />
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
                  {new Date(entry.date).toLocaleTimeString()}
                </text>
              </view>
            ))}
          </view>
        )}
      </view>
    );
  };

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
    case 'recommendations':
      content = renderRecommendations();
      break;
    case 'community':
      content = renderCommunity();
      break;
    case 'day-detail':
      content = renderDayDetail();
      break;
    default:
      content = renderAuth();
  }

  return <view className="app">{content}</view>;
}
