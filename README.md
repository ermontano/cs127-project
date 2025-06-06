# 🎓 MemoFlash - Advanced Flashcards Application

A modern, full-stack flashcards application built with Node.js, Express, and PostgreSQL. Perfect for students and learners who want to create, organize, and study with digital flashcards while managing their study schedules effectively.

## ✨ Key Features

### 🔐 **User Management**
- Secure user authentication with bcrypt password hashing
- Profile management with modal-based editing
- Session-based authentication with PostgreSQL session store
- Password change and account deletion functionality

### 📚 **Content Organization**
- **Course Management** - Organize study materials into courses with custom colors
- **Topic Organization** - Create topics within courses or as standalone units
- **Flashcard Creation** - Easy-to-use flashcard creation with rich text support
- **Search Functionality** - Quick search across courses, topics, and flashcards

### 🧠 **Study Features**
- **Interactive Study Mode** - Card-based study sessions with flip animations

### 📅 **Schedule Management**
- **Course Scheduling** - Set study schedules for courses with custom time slots
- **Calendar View** - Visual calendar interface for managing study sessions
- **Multiple Time Slots** - Support for multiple study periods per day
- **Weekly Schedule** - Organize study sessions by days of the week

### 🎨 **Modern Interface**
- Clean, responsive design that works on all devices
- Smooth animations and transitions
- Dark/Light theme support
- Modal-based interactions for better UX
- Toast notifications and in-context error messages

## 🛠️ **Tech Stack**

### **Frontend:**
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with CSS variables, flexbox, and grid
- **Vanilla JavaScript (ES6+)** - Modular client-side functionality

### **Backend:**
- **Node.js** (>=14.0.0) - Server runtime
- **Express.js** - Web application framework
- **RESTful API** - Clean API architecture

### **Database:**
- **PostgreSQL** - Primary database with full ACID compliance
- **pg** - PostgreSQL client for Node.js

### **Security & Authentication:**
- **bcrypt** - Password hashing and salt generation
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting protection

## 🏗️ **Project Architecture**

```
cs127-project/
├── src/
│   ├── backend/
│   │   ├── config/
│   │   │   └── database.js          # Database configuration
│   │   ├── middleware/
│   │   │   └── auth.js              # Authentication middleware
│   │   ├── models/
│   │   │   ├── User.js              # User model with profile management
│   │   │   ├── Course.js            # Course model with color support
│   │   │   ├── Topic.js             # Topic model
│   │   │   ├── Flashcard.js         # Flashcard model
│   │   │   └── CourseSchedule.js    # Schedule management model
│   │   ├── routes/
│   │   │   ├── auth.js              # Authentication & profile routes
│   │   │   ├── courses.js           # Course CRUD operations
│   │   │   ├── topics.js            # Topic management routes
│   │   │   ├── flashcards.js        # Flashcard operations
│   │   │   └── schedules.js         # Schedule management routes
│   │   ├── scripts/
│   │   │   └── setup-database.js    # Automated database setup
│   │   └── server.js                # Main Express server
│   └── frontend/
│       ├── css/
│       │   └── styles.css           # Comprehensive styling system
│       ├── js/
│       │   ├── auth.js              # Authentication & user management
│       │   ├── storage.js           # API communication layer
│       │   ├── ui.js                # UI state management
│       │   ├── flashcardsManager.js # Flashcard operations
│       │   ├── topicsManager.js     # Topic management
│       │   ├── coursesManager.js    # Course operations
│       │   ├── scheduleManager.js   # Schedule management system
│       │   ├── studyMode.js         # Interactive study sessions
│       │   ├── models.js            # Client-side data models
│       │   └── animations.js        # UI animations and transitions
│       ├── images/
│       │   └── logo.png             # Application branding
│       ├── index.html               # Main application interface
│       └── auth.html                # Authentication page
├── create-tables.sql                # Manual database schema
├── add-color-column-migration.sql   # Database migration scripts
├── package.json                     # Dependencies and scripts
├── .env.example                     # Environment configuration template
└── README.md                        # Project documentation
```

## 🚀 **Quick Start Guide**

### **Prerequisites**
- Node.js v14.0.0 or higher
- PostgreSQL v12 or higher
- npm v6.0.0 or higher

### **Installation Steps**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ermontano/cs127-project.git
   cd cs127-project
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database Configuration
   DB_USER=your_postgresql_username
   DB_PASSWORD=your_postgresql_password
   DB_NAME=flashcards_db
   DB_HOST=localhost
   DB_PORT=5432
   
   # Server Configuration
   PORT=3000
   SESSION_SECRET=your-super-secure-secret-key-here
   
   # Environment
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Create the database
   createdb flashcards_db
   
   # Set up tables and schema
   npm run setup-db
   ```

5. **Launch Application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Or production mode
   npm start
   ```

6. **Access Application**
   Open your browser and navigate to `http://localhost:3000`

## 🗄️ **Database Schema**

### **Core Tables**
- **users** - User accounts with authentication and profile data
- **session** - Session management for persistent login
- **courses** - User-created courses with color coding and metadata
- **topics** - Topics linked to courses or standalone
- **flashcards** - Individual flashcards with questions and answers
- **course_schedules** - Study schedule management with time slots

### **Key Relationships**
- Users → Courses (1:N)
- Courses → Topics (1:N)
- Topics → Flashcards (1:N)
- Courses → Course Schedules (1:N)

All foreign key constraints include CASCADE DELETE for proper data cleanup.

## 📝 **Available Scripts**

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run setup-db` | Initialize database schema |

## 🎯 **Application Features in Detail**

### **Dashboard**
- Welcome screen with study statistics
- Quick access to recent courses and topics
- Progress overview and study streaks

### **Course Management**
- Create courses with custom colors
- Edit course details and descriptions
- Delete courses with confirmation
- Schedule study sessions for courses

### **Study Sessions**
- Interactive flashcard study mode
- Progress tracking during sessions
- Card shuffling and review options
- Study completion statistics

### **Schedule System**
- Visual calendar interface
- Drag-and-drop schedule management
- Multiple time slots per day
- Weekly view with color-coded courses

## 🔐 **Security Implementation**

- **Password Security**: bcrypt with salt rounds for secure hashing
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Prevention**: Parameterized queries throughout
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Helmet.js security headers
- **Authentication Middleware**: Route-level access control

## 🎨 **UI/UX Features**

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: CSS transitions and JavaScript animations
- **Modal Interactions**: Context-aware modal dialogs
- **Error Handling**: User-friendly error messages in appropriate contexts
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: Non-intrusive success/error notifications

## 🚀 **Deployment Considerations**

### **Environment Variables for Production**
```env
NODE_ENV=production
PORT=3000
DB_HOST=your_production_db_host
DB_SSL=true
SESSION_SECRET=very-long-random-secret-for-production
```

### **Database Migration**
The application includes migration scripts for schema updates:
```bash
psql -d flashcards_db -f add-color-column-migration.sql
```

## 🐛 **Troubleshooting**

### **Common Issues**

**Database Connection Failed**
```bash
# Check PostgreSQL service
sudo service postgresql status

# Verify database exists
psql -l | grep flashcards_db

# Test connection
psql -d flashcards_db -c "SELECT version();"
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

**Session Issues**
```bash
# Clear session data
psql -d flashcards_db -c "DELETE FROM session;"

# Restart server
npm run dev
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 **Authors**

- **Development Team** - Initial work and ongoing development

## 🙏 **Acknowledgments**

- Built as part of CMSC 127 (Database Systems) coursework
- Utilizes modern web development best practices
- Designed with user experience and accessibility in mind

---

**📞 Support**: For issues or questions, please open an issue on GitHub or contact the development team.

**🔄 Version**: 1.0.0 - Full-featured flashcard application with scheduling system