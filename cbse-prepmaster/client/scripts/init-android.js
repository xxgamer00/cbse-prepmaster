const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}Initializing Android project...${colors.reset}\n`);

try {
  // Step 1: Install dependencies
  console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Dependencies installed${colors.reset}\n`);

  // Step 2: Create assets directory
  console.log(`${colors.yellow}Creating assets directory...${colors.reset}`);
  const assetsDir = path.join(__dirname, '../src/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create placeholder icon and splash images
  const iconContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#1976d2"/>
    <text x="256" y="256" font-family="Arial" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle">
      CBSE
    </text>
  </svg>`;

  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconContent);
  fs.copyFileSync(path.join(assetsDir, 'icon.svg'), path.join(assetsDir, 'splash.svg'));
  
  console.log(`${colors.green}✓ Assets directory created${colors.reset}\n`);

  // Step 3: Initialize Capacitor
  console.log(`${colors.yellow}Initializing Capacitor...${colors.reset}`);
  execSync('npx cap init CBSE\\ PrepMaster com.cbse.prepmaster --web-dir build', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Capacitor initialized${colors.reset}\n`);

  // Step 4: Add Android platform
  console.log(`${colors.yellow}Adding Android platform...${colors.reset}`);
  execSync('npx cap add android', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Android platform added${colors.reset}\n`);

  // Step 5: Generate resources
  console.log(`${colors.yellow}Generating app resources...${colors.reset}`);
  execSync('npm run resources', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Resources generated${colors.reset}\n`);

  // Step 6: Update Android configuration
  console.log(`${colors.yellow}Updating Android configuration...${colors.reset}`);
  
  // Update AndroidManifest.xml
  const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  // Add permissions
  if (!manifest.includes('android.permission.INTERNET')) {
    const permissions = `
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />`;
    
    manifest = manifest.replace(
      '<manifest',
      `<manifest${permissions}`
    );
    
    fs.writeFileSync(manifestPath, manifest);
  }

  // Create keystore directory
  const keystoreDir = path.join(__dirname, '../android/app/keystore');
  if (!fs.existsSync(keystoreDir)) {
    fs.mkdirSync(keystoreDir, { recursive: true });
  }

  console.log(`${colors.green}✓ Android configuration updated${colors.reset}\n`);

  // Step 7: Create environment files
  console.log(`${colors.yellow}Creating environment files...${colors.reset}`);
  
  const envContent = `REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development`;

  const envProdContent = `REACT_APP_API_URL=https://api.cbseprepmaster.com
REACT_APP_ENV=production`;

  fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
  fs.writeFileSync(path.join(__dirname, '../.env.production'), envProdContent);
  
  console.log(`${colors.green}✓ Environment files created${colors.reset}\n`);

  console.log(`${colors.bright}Android project initialization completed!${colors.reset}\n`);
  
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  console.log('1. Update the environment files with your API URLs');
  console.log('2. Generate a keystore for signing the release APK:');
  console.log('   keytool -genkey -v -keystore android/app/keystore/release.keystore -alias prepmaster -keyalg RSA -keysize 2048 -validity 10000');
  console.log('3. Set up environment variables for the keystore:');
  console.log('   KEYSTORE_PASSWORD');
  console.log('   KEY_ALIAS');
  console.log('   KEY_PASSWORD');
  console.log('4. Run development build:');
  console.log('   npm run android');
  console.log('5. For production build:');
  console.log('   npm run build:android-release\n');

} catch (error) {
  console.error(`${colors.red}Initialization failed:${colors.reset}`, error);
  process.exit(1);
}
