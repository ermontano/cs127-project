# 🔧 Database Connection Troubleshooting Guide

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (interactive)
npm run setup-env

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

## ☁️ Google Cloud SQL Setup

### Option 1: Direct Connection

1. **Create Cloud SQL Instance:**
   - Go to Google Cloud Console → SQL
   - Create PostgreSQL instance
   - Note: instance IP, username, password

2. **Configure Networking:**
   - Add your IP to "Authorized networks"
   - Or use "Allow all IPs" (0.0.0.0/0) for testing

3. **Create Database:**
   ```sql
   CREATE DATABASE flashcards_db;
   ```

4. **Environment Variables:**
   ```env
   DB_HOST=your-instance-ip
   DB_PORT=5432
   DB_NAME=flashcards_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   USE_SSL=true
   NODE_ENV=production
   ```

### Option 2: Cloud SQL Proxy (Recommended)

1. **Download Cloud SQL Proxy:**
   ```bash
   # Linux/macOS
   curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
   chmod +x cloud_sql_proxy
   
   # Windows
   # Download from: https://dl.google.com/cloudsql/cloud_sql_proxy.x64.exe
   ```

2. **Run Cloud SQL Proxy:**
   ```bash
   ./cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:5432
   ```

3. **Environment Variables:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=flashcards_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   USE_CLOUD_SQL_PROXY=true
   INSTANCE_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME
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

2. **For Cloud SQL:**
   - Verify instance IP address
   - Check firewall rules
   - Ensure Cloud SQL Proxy is running

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

2. **For Cloud SQL:**
   - Reset password in Google Cloud Console
   - Update `.env` file with new password

### Issue 5: Cloud SQL Connection Issues

**Symptoms:**
- Can't connect to Cloud SQL instance
- SSL/TLS errors

**Solutions:**
1. **Check IP whitelisting:**
   - Add your current IP to authorized networks
   - Get your IP: `curl ifconfig.me`

2. **Use Cloud SQL Proxy:**
   - More secure than direct connection
   - Handles SSL automatically

3. **Verify instance details:**
   - Check project ID, region, instance name
   - Ensure instance is running

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
4. **Check firewall settings** (especially for Cloud SQL)
5. **Ensure database and tables exist**

## 🔧 Quick Fixes

### Reset Everything
```bash
# Delete .env and start over
rm .env
npm run setup-env

# Drop and recreate database (local only)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS flashcards_db;"
sudo -u postgres psql -c "CREATE DATABASE flashcards_db;"
npm run setup-db
```

### Health Check URLs
- Server: `http://localhost:3000/api/health`
- Test query: `http://localhost:3000/api/courses` (should return empty array)

Remember: Always check your database is running and accessible before starting the Node.js server! 