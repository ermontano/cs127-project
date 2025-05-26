# 🔧 Local PostgreSQL Troubleshooting Guide

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp env.example .env
# Edit .env with your database credentials

# 3. Set up database tables
npm run setup-db

# 4. Start the application
npm start
```

## 🏠 Local PostgreSQL Setup

### Installing PostgreSQL

#### Windows (using Chocolatey)
```bash
choco install postgresql
```

#### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Creating Database and User

```bash
# Connect as postgres superuser
sudo -u postgres psql

# Create database
CREATE DATABASE flashcards_db;

# Create user with password
CREATE USER your_username WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE flashcards_db TO your_username;

# Exit psql
\q
```

### Testing Connection

```bash
# Test connection with psql
psql -h localhost -U your_username -d flashcards_db
```



## 🚨 Common Issues and Solutions

### Issue 1: "Database connection error"

**Symptoms:**
- Server fails to start
- Error: "❌ Database connection error"

**Solutions:**
1. **Check database is running:**
   ```bash
   # Local PostgreSQL
   sudo systemctl status postgresql  # Linux
   brew services list | grep postgresql  # macOS
   ```

2. **Verify credentials in `.env`:**
   - Double-check username, password, database name
   - Ensure no extra spaces or quotes

3. **Test connection manually:**
   ```bash
   psql -h localhost -U your_username -d flashcards_db
   ```

### Issue 2: "ECONNREFUSED" Error

**Symptoms:**
- Connection refused error
- Can't connect to database

**Solutions:**
1. **Check PostgreSQL is running on correct port:**
   ```bash
   sudo netstat -tlnp | grep 5432
   ```

2. **Check PostgreSQL configuration:**
   - Verify postgresql.conf settings
   - Check pg_hba.conf for authentication rules

### Issue 3: "database does not exist"

**Symptoms:**
- Error: database "flashcards_db" does not exist

**Solutions:**
1. **Create the database:**
   ```sql
   CREATE DATABASE flashcards_db;
   ```

2. **Run setup script:**
   ```bash
   npm run setup-db
   ```

### Issue 4: "password authentication failed"

**Symptoms:**
- Authentication error
- Wrong username/password

**Solutions:**
1. **Reset PostgreSQL password:**
   ```bash
   sudo -u postgres psql
   ALTER USER your_username PASSWORD 'new_password';
   ```

2. **Check PostgreSQL user permissions:**
   ```sql
   ALTER USER your_username WITH PASSWORD 'new_password';
   GRANT ALL PRIVILEGES ON DATABASE flashcards_db TO your_username;
   ```

### Issue 5: PostgreSQL Service Issues

**Symptoms:**
- PostgreSQL service not running
- Connection refused errors

**Solutions:**
1. **Start PostgreSQL service:**
   ```bash
   # Linux/Ubuntu
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   
   # macOS (with Homebrew)
   brew services start postgresql
   
   # Windows
   net start postgresql-x64-14
   ```

2. **Check PostgreSQL status:**
   ```bash
   # Linux/Ubuntu
   sudo systemctl status postgresql
   
   # macOS
   brew services list | grep postgresql
   ```

3. **Verify PostgreSQL is listening:**
   ```bash
   sudo netstat -tulnp | grep 5432
   ```

### Issue 6: "npm run setup-db" Fails

**Symptoms:**
- Table creation fails
- Permission errors

**Solutions:**
1. **Check database permissions:**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE flashcards_db TO your_username;
   GRANT CREATE ON SCHEMA public TO your_username;
   ```

2. **Run as database owner:**
   - Ensure your user has CREATE privileges
   - Or run as postgres superuser

## 🔍 Debugging Commands

### Check Environment Variables
```bash
node -e "require('dotenv').config(); console.log(process.env.DB_HOST, process.env.DB_USER)"
```

### Test Database Connection
```bash
node -e "
const { testConnection } = require('./config/database');
testConnection().then(() => console.log('✅ Connection successful')).catch(err => console.error('❌ Connection failed:', err));
"
```

### View Server Logs
```bash
# Start with verbose logging
DEBUG=* npm start
```

## 📞 Getting Help

If you're still having issues:

1. **Check the console logs** for specific error messages
2. **Verify your `.env` file** matches the examples
3. **Test database connection** outside of the app
4. **Check firewall settings** 
5. **Ensure database and tables exist**

## 🔧 Quick Fixes

### Reset Everything
```bash
# Delete .env and start over
rm .env
npm run setup-local

# Drop and recreate database (local only)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS flashcards_db;"
sudo -u postgres psql -c "CREATE DATABASE flashcards_db;"
npm run setup-db
```

### Health Check URLs
- Server: `http://localhost:3000/api/health`
- Test query: `http://localhost:3000/api/courses` (should return empty array)

Remember: Always check your database is running and accessible before starting the Node.js server! 