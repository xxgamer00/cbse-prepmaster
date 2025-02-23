const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}Starting app testing process...${colors.reset}\n`);

// Test data for quick testing
const testData = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
  },
  student: {
    email: 'student@test.com',
    password: 'student123',
    name: 'Test Student',
    role: 'student',
    class: 8,
  },
  test: {
    title: 'Sample Math Test',
    subject: 'Maths',
    class: 8,
    duration: 30,
    totalMarks: 20,
    questions: [
      {
        text: 'What is 2 + 2?',
        type: 'MCQ',
        options: [
          { id: 'a', text: '3', isCorrect: false },
          { id: 'b', text: '4', isCorrect: true },
          { id: 'c', text: '5', isCorrect: false },
          { id: 'd', text: '6', isCorrect: false },
        ],
        correctAnswer: 'b',
        marks: 2,
        difficulty: 'easy',
        subject: 'Maths',
        class: 8,
        topic: 'Basic Arithmetic',
      },
    ],
  },
};

async function runTests() {
  try {
    // Step 1: Check if server is running
    console.log(`${colors.yellow}Checking server status...${colors.reset}`);
    
    try {
      await new Promise((resolve, reject) => {
        http.get('http://localhost:5000/api/health', (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error('Server not responding correctly'));
          }
        }).on('error', () => {
          reject(new Error('Server not running'));
        });
      });
      console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
    } catch (error) {
      throw new Error('Please start the server first (cd server && npm run dev)');
    }

    // Step 2: Build the app
    console.log(`${colors.yellow}Building the application...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Build completed${colors.reset}\n`);

    // Step 3: Sync with Capacitor
    console.log(`${colors.yellow}Syncing with Capacitor...${colors.reset}`);
    execSync('npx cap sync', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Sync completed${colors.reset}\n`);

    // Step 4: Create test data file
    console.log(`${colors.yellow}Creating test data...${colors.reset}`);
    const testDataPath = path.join(__dirname, '../src/testData.json');
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    console.log(`${colors.green}✓ Test data created${colors.reset}\n`);

    // Step 5: Run development server
    console.log(`${colors.yellow}Starting development server...${colors.reset}`);
    console.log('The app will be available at http://localhost:3000');
    console.log('\nTest Credentials:');
    console.log('Admin - Email: admin@test.com, Password: admin123');
    console.log('Student - Email: student@test.com, Password: student123\n');
    
    console.log(`${colors.bright}Testing Instructions:${colors.reset}`);
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Test both admin and student flows');
    console.log('3. Verify offline functionality by disabling network');
    console.log('4. Test responsive design using browser dev tools');
    console.log('5. Press Ctrl+C to stop the server when done\n');

    execSync('npm start', { stdio: 'inherit' });

  } catch (error) {
    console.error(`${colors.red}Testing failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Add cleanup handler
process.on('SIGINT', () => {
  console.log(`\n${colors.bright}Cleaning up...${colors.reset}`);
  
  // Remove test data file
  const testDataPath = path.join(__dirname, '../src/testData.json');
  if (fs.existsSync(testDataPath)) {
    fs.unlinkSync(testDataPath);
  }
  
  console.log(`${colors.green}✓ Cleanup completed${colors.reset}`);
  process.exit(0);
});

// Run the tests
runTests();
