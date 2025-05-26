# 🎓 Flashcards Maker

A modern, full-stack flashcards application with PostgreSQL database and user authentication. Create, organize, and study your flashcards with a beautiful, responsive interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue.svg)

## ✨ Features

- 🔐 **User Authentication** - Secure login and registration system
- 🗄️ **PostgreSQL Database** - Reliable data persistence with referential integrity
- 📱 **Responsive Design** - Beautiful, modern UI that works on all devices
- 🎯 **Study Mode** - Interactive flashcard studying with progress tracking
- 🔍 **Real-time Search** - Search across courses, topics, and flashcards
- ⚡ **Async Operations** - Fast, non-blocking database operations
- 🛡️ **Security Features** - Rate limiting, CORS, and SQL injection protection

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **npm** package manager (comes with Node.js)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd cs127-project

# Install dependencies
npm install
```

### 2. Database Setup

#### Create Database
```sql
-- Connect to PostgreSQL and run:
CREATE DATABASE flashcards_db;
CREATE USER flashcards_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE flashcards_db TO flashcards_user;
```

#### Environment Configuration
```bash
# Create environment file
npm run setup-local
```

#### Update Environment Variables
Edit the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flashcards_db
DB_USER=flashcards_user
DB_PASSWORD=your_secure_password
NODE_ENV=development
PORT=3000
SESSION_SECRET=your_session_secret_here
```

#### Initialize Database Tables
```bash
npm run setup-db
```

### 3. Run the Application

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

🎉 **Your app is ready!**
- **Application**: http://localhost:3000
- **Authentication**: http://localhost:3000/auth.html
- **API Health Check**: http://localhost:3000/api/health

## 🏗️ Application Structure

### Frontend Pages
- **`/auth.html`** - Login and registration page
- **`/index.html`** - Main flashcards application (requires authentication)

### Project Structure
```
cs127-project/
├── 📁 config/
│   ├── database.js              # Database connection config
│   └── session.js               # Session configuration
├── 📁 middleware/
│   └── auth.js                  # Authentication middleware
├── 📁 models/
│   ├── User.js                  # User model
│   ├── Course.js                # Course model
│   ├── Topic.js                 # Topic model
│   └── Flashcard.js             # Flashcard model
├── 📁 routes/
│   ├── auth.js                  # Authentication routes
│   ├── courses.js               # Course CRUD routes
│   ├── topics.js                # Topic CRUD routes
│   └── flashcards.js            # Flashcard CRUD routes
├── 📁 scripts/
│   ├── setup-local.js           # Environment setup
│   ├── setup-database.js        # Database initialization
│   └── test-connection.js       # Database connection test
├── 📁 js/                       # Frontend JavaScript
│   ├── auth.js                  # Authentication logic
│   ├── storage.js               # API communication
│   ├── ui.js                    # UI management
│   ├── coursesManager.js        # Course management
│   ├── topicsManager.js         # Topic management
│   ├── flashcardsManager.js     # Flashcard management
│   └── studyMode.js             # Study mode functionality
├── server.js                    # Express server
├── styles.css                   # Application styles
├── index.html                   # Main application
├── auth.html                    # Authentication page
└── package.json                 # Dependencies and scripts
```

## 🗄️ Database Schema

### Users
```sql
users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(255) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Courses
```sql
courses (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Topics
```sql
topics (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Flashcards
```sql
flashcards (
    id              SERIAL PRIMARY KEY,
    topic_id        INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    last_reviewed   TIMESTAMP,
    review_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/status` | Check authentication status |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all user courses |
| POST | `/api/courses` | Create new course |
| GET | `/api/courses/:id` | Get specific course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |

### Topics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topics` | Get all user topics |
| GET | `/api/topics?courseId=:id` | Get topics by course |
| POST | `/api/topics` | Create new topic |
| GET | `/api/topics/:id` | Get specific topic |
| PUT | `/api/topics/:id` | Update topic |
| DELETE | `/api/topics/:id` | Delete topic |

### Flashcards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flashcards` | Get all user flashcards |
| GET | `/api/flashcards?topicId=:id` | Get flashcards by topic |
| POST | `/api/flashcards` | Create new flashcard |
| GET | `/api/flashcards/:id` | Get specific flashcard |
| PUT | `/api/flashcards/:id` | Update flashcard |
| DELETE | `/api/flashcards/:id` | Delete flashcard |
| POST | `/api/flashcards/:id/review` | Mark flashcard as reviewed |

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run setup-local` | Create `.env` file template |
| `npm run setup-db` | Initialize database tables |
| `npm run test-connection` | Test database connectivity |

### Key Features

- **🔒 Authentication Required**: All main features require user login
- **⚡ Async Database Operations**: All data operations are asynchronous
- **🛡️ SQL Injection Protection**: Parameterized queries throughout
- **🔗 Referential Integrity**: Proper foreign key constraints with CASCADE deletes
- **📊 Real-time Updates**: Changes reflect immediately across all views

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```
✅ Solutions:
• Verify PostgreSQL is running
• Check .env database credentials
• Ensure database and user exist
• Test with: npm run test-connection
```

#### Authentication Issues
```
✅ Solutions:
• Clear browser cookies and session data
• Check SESSION_SECRET in .env
• Verify auth.js middleware is working
• Check network tab for API errors
```

#### Port Already in Use
```bash
# Find and kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

## 🔐 Security Features

- **🛡️ Helmet.js** - Security headers protection
- **🚦 Rate Limiting** - 100 requests per 15 minutes per IP
- **🔐 Session Management** - Secure session handling with PostgreSQL store
- **🚫 CORS Configuration** - Controlled cross-origin requests
- **💉 SQL Injection Protection** - Parameterized queries only
- **🔑 Password Hashing** - bcrypt for secure password storage

## 📋 Requirements

- **Node.js**: >= 14.0.0
- **npm**: >= 6.0.0
- **PostgreSQL**: >= 12.0.0
- **Modern Browser**: Chrome, Firefox, Safari, Edge

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes thoroughly
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Create** a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by effective learning techniques
- Designed for student success

---

**Happy Studying! 🎓**