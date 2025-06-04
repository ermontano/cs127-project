# 🎓 Flashcards App

A modern, full-stack flashcards application built with Node.js, Express, and PostgreSQL. Perfect for students and learners who want to create and study with digital flashcards.

## ✨ Features

- 🔐 **User Authentication** - Secure login/signup with bcrypt password hashing
- 📚 **Course Management** - Organize your content into courses
- 📁 **Topic Organization** - Create topics within courses or as standalone
- 🃏 **Flashcard Creation** - Easy-to-use flashcard creation and editing
- 🧠 **Study Mode** - Interactive study sessions with progress tracking
- 📊 **Progress Statistics** - Track your learning progress
- 🎨 **Modern UI** - Clean, responsive design with smooth animations

## 🏗️ Project Structure

```
cs127-project/
├── src/
│   ├── backend/
│   │   ├── config/
│   │   │   └── database.js       # Database configuration
│   │   ├── middleware/
│   │   │   └── auth.js           # Authentication middleware
│   │   ├── models/
│   │   │   ├── User.js           # User model
│   │   │   ├── Course.js         # Course model
│   │   │   ├── Topic.js          # Topic model
│   │   │   └── Flashcard.js      # Flashcard model
│   │   ├── routes/
│   │   │   ├── auth.js           # Authentication routes
│   │   │   ├── courses.js        # Course CRUD routes
│   │   │   ├── topics.js         # Topic CRUD routes
│   │   │   └── flashcards.js     # Flashcard CRUD routes
│   │   ├── scripts/
│   │   │   └── setup-database.js # Database setup script
│   │   └── server.js             # Main server file
│   └── frontend/
│       ├── css/
│       │   └── styles.css        # Application styles
│       ├── js/
│       │   ├── auth.js           # Authentication handling
│       │   ├── storage.js        # API communication
│       │   ├── ui.js             # UI management
│       │   ├── flashcardsManager.js
│       │   ├── topicsManager.js
│       │   ├── coursesManager.js
│       │   ├── studyMode.js
│       │   └── animations.js     # UI animations
│       ├── index.html            # Main application page
│       └── auth.html             # Login/signup page
├── create-tables.sql             # Manual database setup
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cs127-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your PostgreSQL credentials:
   ```env
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=flashcards_db
   DB_HOST=localhost
   DB_PORT=5432
   SESSION_SECRET=your-secret-key
   ```

4. **Create PostgreSQL database**
   ```bash
   createdb flashcards_db
   ```

5. **Set up database tables**
   ```bash
   npm run setup-db
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Schema

The application uses PostgreSQL with the following tables:

- **users** - User accounts with authentication
- **session** - Session management for login persistence
- **courses** - User-created courses for organization
- **topics** - Topics that can belong to courses or be standalone
- **flashcards** - Individual flashcards within topics

All tables include proper foreign key relationships and cascade deletions for data integrity.

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run setup-db` | Set up database tables |

## 🔧 Development

### Database Management

To reset the database:
```bash
npm run setup-db
```

To manually run SQL commands:
```bash
psql -d flashcards_db -f create-tables.sql
```

### Project Organization

- **Backend** (`src/backend/`) - Express.js API server
- **Frontend** (`src/frontend/`) - Static HTML/CSS/JS files
- **Models** - Database interaction layer
- **Routes** - API endpoints
- **Middleware** - Authentication and request processing

## 🔐 Security Features

- Password hashing with bcrypt
- Session-based authentication
- CSRF protection with Helmet.js
- Rate limiting
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## 🎯 Usage

1. **Sign Up** - Create a new account
2. **Create Courses** - Organize your study materials
3. **Add Topics** - Create topics within courses or standalone
4. **Create Flashcards** - Add questions and answers
5. **Study** - Use study mode to review your flashcards
6. **Track Progress** - View your study statistics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Ensure PostgreSQL is running
- Check your `.env` file credentials
- Verify database exists

**Port Already in Use**
- Change the PORT in your `.env` file
- Kill the process using the port: `lsof -ti:3000 | xargs kill`

**Session Issues**
- Clear browser cookies
- Restart the server
- Check session table exists in database

For more detailed troubleshooting, see `TROUBLESHOOTING.md`.

---

Made with ❤️ for better learning experiences