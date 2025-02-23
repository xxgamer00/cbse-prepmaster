const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

// Required dependencies and versions
const requirements = {
  node: '16.0.0',
  npm: '8.0.0',
  java: '11.0.0',
};

// Android SDK packages to install
const androidPackages = [
  'platforms;android-33',
  'build-tools;33.0.0',
  'platform-tools',
  'tools',
  'emulator',
  'system-images;android-33;google_apis;x86_64',
];

async function setupDevelopmentEnvironment() {
  console.log(`${colors.bright}Setting up development environment...${colors.reset}\n`);

  try {
    // Step 1: Check system requirements
    console.log(`${colors.yellow}Checking system requirements...${colors.reset}`);
    
    // Check Node.js version
    const nodeVersion = execSync('node --version').toString().trim();
    if (!satisfiesVersion(nodeVersion, requirements.node)) {
      throw new Error(`Node.js ${requirements.node} or higher is required`);
    }

    // Check npm version
    const npmVersion = execSync('npm --version').toString().trim();
    if (!satisfiesVersion(npmVersion, requirements.npm)) {
      throw new Error(`npm ${requirements.npm} or higher is required`);
    }

    // Check Java version
    try {
      const javaVersion = execSync('java -version 2>&1').toString();
      if (!javaVersion.includes('version')) {
        throw new Error('Java not found');
      }
    } catch (error) {
      throw new Error('Java JDK 11 or higher is required');
    }

    console.log(`${colors.green}✓ System requirements met${colors.reset}\n`);

    // Step 2: Check Android Studio and SDK
    console.log(`${colors.yellow}Checking Android development environment...${colors.reset}`);
    
    // Determine Android SDK location
    let androidSdkPath;
    if (process.env.ANDROID_SDK_ROOT) {
      androidSdkPath = process.env.ANDROID_SDK_ROOT;
    } else {
      const homeDir = os.homedir();
      const possiblePaths = [
        path.join(homeDir, 'Library/Android/sdk'), // macOS
        path.join(homeDir, 'AppData/Local/Android/sdk'), // Windows
        path.join(homeDir, 'Android/Sdk'), // Linux
      ];
      
      androidSdkPath = possiblePaths.find(p => fs.existsSync(p));
      if (!androidSdkPath) {
        throw new Error('Android SDK not found. Please install Android Studio.');
      }
    }

    // Create local.properties file
    const localPropertiesPath = path.join(__dirname, '../android/local.properties');
    fs.writeFileSync(
      localPropertiesPath,
      `sdk.dir=${androidSdkPath.replace(/\\/g, '\\\\')}\n`
    );

    console.log(`${colors.green}✓ Android SDK configuration completed${colors.reset}\n`);

    // Step 3: Install project dependencies
    console.log(`${colors.yellow}Installing project dependencies...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dependencies installed${colors.reset}\n`);

    // Step 4: Set up environment variables
    console.log(`${colors.yellow}Setting up environment variables...${colors.reset}`);
    const envContent = `REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
REACT_APP_DEBUG=true`;

    fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
    console.log(`${colors.green}✓ Environment variables configured${colors.reset}\n`);

    // Step 5: Initialize Android project
    console.log(`${colors.yellow}Initializing Android project...${colors.reset}`);
    execSync('node scripts/init-android.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Android project initialized${colors.reset}\n`);

    // Step 6: Create development virtual device
    console.log(`${colors.yellow}Creating Android Virtual Device...${colors.reset}`);
    try {
      execSync(
        'avdmanager create avd -n test_device -k "system-images;android-33;google_apis;x86_64"',
        { stdio: 'inherit' }
      );
      console.log(`${colors.green}✓ Android Virtual Device created${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ Could not create Android Virtual Device automatically${colors.reset}\n`);
    }

    // Step 7: Set up git hooks
    console.log(`${colors.yellow}Setting up git hooks...${colors.reset}`);
    const huskyDir = path.join(__dirname, '../.husky');
    if (!fs.existsSync(huskyDir)) {
      execSync('npx husky install', { stdio: 'inherit' });
      execSync('npx husky add .husky/pre-commit "npm run lint && npm test"', {
        stdio: 'inherit',
      });
    }
    console.log(`${colors.green}✓ Git hooks configured${colors.reset}\n`);

    // Print success message and next steps
    console.log(`${colors.bright}Development environment setup completed!${colors.reset}\n`);
    
    console.log(`${colors.blue}Next Steps:${colors.reset}`);
    console.log('1. Start the backend server:');
    console.log('   cd ../server && npm run dev');
    console.log('2. Start the development server:');
    console.log('   npm start');
    console.log('3. Run the Android app:');
    console.log('   npm run android');
    console.log('\nFor testing:');
    console.log('   npm run test-app\n');

  } catch (error) {
    console.error(`${colors.red}Setup failed:${colors.reset}`, error.message);
    console.log('\nPlease fix the above error and try again.');
    process.exit(1);
  }
}

// Helper function to compare versions
function satisfiesVersion(current, required) {
  const currentParts = current.replace(/[^\d.]/g, '').split('.');
  const requiredParts = required.split('.');
  
  for (let i = 0; i < requiredParts.length; i++) {
    const currentPart = parseInt(currentParts[i] || 0);
    const requiredPart = parseInt(requiredParts[i]);
    
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  
  return true;
}

// Run setup
setupDevelopmentEnvironment();
