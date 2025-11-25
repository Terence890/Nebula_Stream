# NebulaStream 🎬

**Tagline:** *Stream the future. Cinematic quality, enterprise scale.*

A modern, futuristic movie streaming application built with React, FastAPI, and MongoDB, powered by The Movie Database (TMDb) API.

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication
- Secure user registration and login
- Password hashing with bcrypt
- Token-based session management

### 👥 Multi-Profile Support
- Create multiple profiles per account
- Profile selection and switching
- Personalized watchlists per profile
- Watch history tracking

### 🎥 Content Discovery
- **Trending** - Latest trending movies and TV shows
- **Popular Movies** - Top-rated movies
- **Popular TV Shows** - Top-rated series
- **Search** - Find any title across the entire catalog
- **Title Details** - Rich metadata including cast, genres, ratings, and trailers

### 📺 Video Player
- HLS video player with YouTube trailer integration
- Fullscreen playback
- Smooth controls and responsive design

### 📋 Watchlist & History
- Add/remove titles from watchlist
- Track watch history with playback position
- Resume watching from where you left off

### 🎨 Dark Futuristic UI
- Sleek, cinematic dark theme
- Gradient accents (Cyan, Violet, Magenta)
- Glass morphism effects
- Smooth animations and transitions
- Fully responsive design

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library
- **HLS.js** - Video player
- **Axios** - HTTP client
- **Sonner** - Toast notifications

### Backend
- **FastAPI** - Python web framework
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **python-jose** - JWT token handling
- **passlib** - Password hashing
- **httpx** - Async HTTP client for TMDb API

### Database
- **MongoDB** - NoSQL database for users, profiles, watchlists, and history

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- TMDb API Key (get from https://www.themoviedb.org/settings/api)

### Backend Setup

1. Navigate to backend directory:
```bash
cd /app/backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables in `/app/backend/.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="nebulastream_db"
CORS_ORIGINS="*"
JWT_SECRET_KEY="your-secret-key-here"
TMDB_API_KEY="your-tmdb-api-key-here"
```

4. Start the backend:
```bash
supervisorctl restart backend
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd /app/frontend
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables in `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=your-backend-url
```

4. Start the frontend:
```bash
supervisorctl restart frontend
```

---

## 🚀 Usage

### 1. **Register/Login**
- Visit the app at your deployed URL
- Create a new account or login with existing credentials

### 2. **Create Profile**
- After login, create one or more profiles
- Each profile has its own watchlist and history

### 3. **Browse Content**
- Explore trending titles
- Browse popular movies and TV shows
- Use the search bar to find specific titles

### 4. **Watch Trailers**
- Click on any title to view details
- Click "Play Trailer" to watch YouTube trailers
- Add titles to your watchlist

### 5. **Manage Watchlist**
- Add titles to your personal watchlist
- Access your watchlist anytime
- Track your watch history

---

## 🎨 Design System

### Color Palette
- **Background:** `#0B0F14` (Deep space black)
- **Foreground:** `#E6EEF3` (Soft white)
- **Primary Accent:** `#00E5FF` (Cyan)
- **Secondary Accent:** `#9B7BFF` (Violet)
- **Tertiary Accent:** `#FF4DD2` (Magenta)
- **Muted:** `#96A0AA` (Gray)

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** Bold, large scale (4xl - 7xl)
- **Body:** Regular, 16px base

### Components
- Glass morphism cards with backdrop blur
- Gradient buttons and accents
- Smooth hover transitions
- Rounded corners (12-24px)
- Depth through shadows and layering

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── auth_service.py        # JWT authentication logic
│   ├── tmdb_service.py        # TMDb API integration
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── Navbar.js
│   │   │   ├── TitleCard.js
│   │   │   └── VideoPlayer.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── ProfileContext.js
│   │   ├── pages/
│   │   │   ├── Auth.js
│   │   │   ├── Profiles.js
│   │   │   └── Browse.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── .env                   # Frontend environment variables
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Profiles
- `POST /api/profiles` - Create profile
- `GET /api/profiles` - Get all profiles for user

### Content
- `GET /api/titles/popular?media_type={movie|tv}` - Get popular titles
- `GET /api/titles/trending?media_type={all|movie|tv}` - Get trending titles
- `GET /api/titles/search?query={query}` - Search titles
- `GET /api/titles/{media_type}/{id}` - Get title details

### Watchlist
- `POST /api/watchlist?profile_id={id}` - Add to watchlist
- `GET /api/watchlist?profile_id={id}` - Get watchlist
- `DELETE /api/watchlist/{tmdb_id}?profile_id={id}` - Remove from watchlist

### Watch History
- `POST /api/watch-history?profile_id={id}` - Update watch history
- `GET /api/watch-history?profile_id={id}` - Get watch history

---

## 🔒 Security

- **Password Hashing:** bcrypt with salt
- **JWT Tokens:** HS256 algorithm with 24-hour expiration
- **CORS Protection:** Configurable origins
- **Input Validation:** Pydantic models
- **MongoDB Injection Protection:** Motor driver safeguards

---

## 📝 TMDb Integration

This app uses The Movie Database (TMDb) API for content metadata:
- Movie and TV show information
- Posters and backdrops
- Cast and crew details
- Trailers and videos
- Ratings and reviews

**Important:** You must obtain your own TMDb API key and comply with TMDb's terms of service. TMDb only provides metadata - you need proper licensing for actual streaming content.

### Get TMDb API Key
1. Create account at https://www.themoviedb.org
2. Go to Settings → API
3. Request an API key (free for personal/development use)
4. Add to `/app/backend/.env` as `TMDB_API_KEY`

---

## 🧪 Testing

The app has been thoroughly tested with:
- ✅ User registration and authentication
- ✅ Profile creation and management
- ✅ Content browsing and search
- ✅ Watchlist functionality
- ✅ Watch history tracking
- ✅ Navigation and routing
- ✅ Responsive design

---

## 🚧 Future Enhancements

### Phase 2 (Planned)
- DRM integration (Widevine, PlayReady, FairPlay)
- Subscription billing (Stripe/Adyen)
- Offline downloads
- Multi-language support
- Parental controls

### Phase 3 (Enterprise)
- Multi-region CDN deployment
- Advanced analytics dashboard
- Admin panel for content management
- TV platform SDKs (Android TV, Apple TV)
- A/B testing framework

---

## 📄 License

This is a demonstration project. Ensure proper licensing for:
- Content streaming rights
- TMDb API usage (see TMDb terms)
- Any third-party libraries and services

---

## 🙏 Acknowledgments

- **The Movie Database (TMDb)** - Content metadata API
- **shadcn/ui** - Beautiful component library
- **HLS.js** - Video streaming library
- **FastAPI** - Modern Python web framework

---

## 📞 Support

For questions or issues:
1. Check TMDb API status at https://status.themoviedb.org
2. Review MongoDB connection settings
3. Verify environment variables are set correctly
4. Check browser console for frontend errors
5. Review backend logs for API errors

---

**Built with ❤️ using React, FastAPI, and MongoDB**

*NebulaStream - Stream the future*
