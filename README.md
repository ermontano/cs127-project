# Flashcards Maker with PostgreSQL Backend

A full-stack flashcards application with PostgreSQL database support for both local development and Google Cloud SQL production deployment. **The app now exclusively uses database storage - localStorage has been completely removed.**

## Features

- 🔗 **Database-first architecture** - All data is stored in PostgreSQL
- 🌐 **Google Cloud SQL support** for production
- 🔧 **Local PostgreSQL support** for development
- 📱 **Responsive design** with modern UI
- 🎯 **Study mode** with progress tracking
- 🔍 **Real-time search** across courses, topics, and flashcards
- ⚡ **Async operations** with proper error handling

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (required)
- **Cloud**: Google Cloud SQL (optional)
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** (local installation or Google Cloud SQL instance)
- **npm** package manager

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### For Local Development (PostgreSQL)

1. **Install PostgreSQL** on your system
2. **Create a database:**
   ```sql
   CREATE DATABASE flashcards_db;
   ```

3. **Copy environment configuration:**
   ```bash
   cp env.example .env
   ```

4. **Update `.env`** with your local database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=flashcards_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   NODE_ENV=development
   PORT=3000
   ```

5. **Set up database tables:**
   ```bash
   npm run setup-db
   ```

#### For Google Cloud SQL

1. **Create a PostgreSQL instance** in Google Cloud SQL
2. **Create a database** named `flashcards_db`
3. **Update `.env`** with your Cloud SQL credentials:
   ```env
   DB_HOST=your-cloud-sql-instance-ip
   DB_PORT=5432
   DB_NAME=flashcards_db
   DB_USER=your_cloud_sql_username
   DB_PASSWORD=your_cloud_sql_password
   NODE_ENV=production
   PORT=3000
   ```

4. **Set up database tables:**
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

The application will be available at:
- **Frontend**: `http://localhost:3000`
- **API**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/api/health`

## Database Architecture

The app uses a **database-only architecture** with the following key features:

- ✅ **No localStorage dependency** - All data persists in PostgreSQL
- 🔄 **Async operations** - All storage operations are asynchronous
- 🛡️ **Error handling** - Comprehensive error handling for database connectivity
- 🔗 **Referential integrity** - Foreign key constraints with CASCADE delete
- 📊 **Real-time updates** - Data changes reflect immediately across all views

## API Endpoints

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create a new course
- `GET /api/courses/:id` - Get a specific course
- `PUT /api/courses/:id` - Update a course
- `DELETE /api/courses/:id` - Delete a course

### Topics
- `GET /api/topics` - Get all topics
- `GET /api/topics?courseId=:id` - Get topics by course
- `POST /api/topics` - Create a new topic
- `GET /api/topics/:id` - Get a specific topic
- `PUT /api/topics/:id` - Update a topic
- `DELETE /api/topics/:id` - Delete a topic

### Flashcards
- `GET /api/flashcards` - Get all flashcards
- `GET /api/flashcards?topicId=:id` - Get flashcards by topic
- `POST /api/flashcards` - Create a new flashcard
- `GET /api/flashcards/:id` - Get a specific flashcard
- `PUT /api/flashcards/:id` - Update a flashcard
- `DELETE /api/flashcards/:id` - Delete a flashcard
- `POST /api/flashcards/:id/review` - Mark flashcard as reviewed

## Database Schema

### courses
- `id` (VARCHAR, PRIMARY KEY)
- `title` (VARCHAR, NOT NULL)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### topics
- `id` (VARCHAR, PRIMARY KEY)
- `course_id` (VARCHAR, FOREIGN KEY)
- `title` (VARCHAR, NOT NULL)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### flashcards
- `id` (VARCHAR, PRIMARY KEY)
- `topic_id` (VARCHAR, FOREIGN KEY)
- `question` (TEXT, NOT NULL)
- `answer` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_reviewed` (TIMESTAMP)
- `review_count` (INTEGER)

## Development

### File Structure
```
├── config/
│   └── database.js          # Database configuration
├── models/
│   ├── Course.js           # Course model
│   ├── Topic.js            # Topic model
│   └── Flashcard.js        # Flashcard model
├── routes/
│   ├── courses.js          # Course routes
│   ├── topics.js           # Topic routes
│   └── flashcards.js       # Flashcard routes
├── scripts/
│   └── setup-database.js   # Database setup script
├── js/
│   ├── storage.js          # Database storage manager
│   ├── coursesManager.js   # Course management (async)
│   ├── topicsManager.js    # Topic management (async)
│   ├── flashcardsManager.js # Flashcard management (async)
│   └── [other frontend files]
├── server.js               # Express server
├── package.json
└── README.md
```

### Scripts
- `npm start` - Start the server
- `npm run dev` - Start with nodemon (development)
- `npm run setup-db` - Initialize database tables

### Key Changes from localStorage Version

1. **Async Operations**: All storage operations are now asynchronous
2. **Error Handling**: Comprehensive error handling for database failures
3. **Database Connectivity**: Automatic connection testing on startup
4. **No Fallback**: Pure database architecture - no localStorage fallback

## Deployment

### Google Cloud SQL Connection

For Google Cloud SQL, you may need to:

1. **Use Cloud SQL Proxy** (recommended for development):
   ```bash
   # Download and run Cloud SQL Proxy
   ./cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:5432
   ```

2. **Whitelist your IP** in Google Cloud Console
3. **Use SSL connection** for production

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your-cloud-sql-instance-ip
DB_PORT=5432
DB_NAME=flashcards_db
DB_USER=your_cloud_sql_username
DB_PASSWORD=your_cloud_sql_password
PORT=8080
```

## Troubleshooting

### Database Connection Issues

If you see "Failed to connect to database" errors:

1. **Check your `.env` file** - Ensure all database credentials are correct
2. **Verify PostgreSQL is running** - Check if your database server is active
3. **Test connectivity** - Try connecting to the database using a tool like `psql`
4. **Check firewall settings** - Ensure the database port is accessible
5. **For Google Cloud SQL** - Verify IP whitelisting and SSL settings

### Common Error Messages

- **"Database connection error"** - Check your database credentials and connectivity
- **"Failed to load courses"** - Database connectivity issue or missing tables
- **"API call failed"** - Server may not be running or database is unreachable

## Security Features

- **Helmet.js** for security headers
- **CORS configuration** for cross-origin requests
- **Rate limiting** (100 requests per 15 minutes)
- **Input validation** and sanitization
- **SQL injection protection** (parameterized queries)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Ensure database connectivity works
4. Test all CRUD operations
5. Submit a pull request

## License

MIT License