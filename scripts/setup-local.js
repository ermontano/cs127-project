#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local development environment...');
console.log('');

// Check if .env already exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
} else {
    try {
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ Created .env file from env.example');
        } else {
            console.log('❌ env.example file not found');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Failed to create .env file:', error.message);
        process.exit(1);
    }
}

console.log('');
console.log('📝 Next steps:');
console.log('1. Edit the .env file with your PostgreSQL credentials:');
console.log('   - DB_USER: your PostgreSQL username');
console.log('   - DB_PASSWORD: your PostgreSQL password');
console.log('   - DB_NAME: flashcards_db (or your preferred database name)');
console.log('');
console.log('2. Make sure PostgreSQL is running on your system');
console.log('');
console.log('3. Create the database if it doesn\'t exist:');
console.log('   createdb flashcards_db');
console.log('');
console.log('4. Set up the database tables:');
console.log('   npm run setup-db');
console.log('');
console.log('5. Start the application:');
console.log('   npm run dev');
console.log('');
console.log('🎉 Setup complete! Happy coding!'); 