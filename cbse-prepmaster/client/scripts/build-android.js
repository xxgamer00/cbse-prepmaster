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

console.log(`${colors.bright}Starting Android build process...${colors.reset}\n`);

try {
  // Step 1: Build React app
  console.log(`${colors.yellow}Building React application...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}✓ React build completed${colors.reset}\n`);

  // Step 2: Update Capacitor config
  console.log(`${colors.yellow}Syncing Capacitor configuration...${colors.reset}`);
  execSync('npx cap sync', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Capacitor sync completed${colors.reset}\n`);

  // Step 3: Update Android project
  console.log(`${colors.yellow}Updating Android project...${colors.reset}`);
  
  // Ensure android/app/src/main/res/values/strings.xml exists
  const stringsPath = path.join(__dirname, '../android/app/src/main/res/values/strings.xml');
  if (!fs.existsSync(stringsPath)) {
    const stringsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">CBSE PrepMaster</string>
    <string name="title_activity_main">CBSE PrepMaster</string>
    <string name="package_name">com.cbse.prepmaster</string>
    <string name="custom_url_scheme">com.cbse.prepmaster</string>
</resources>`;
    fs.writeFileSync(stringsPath, stringsContent);
  }

  // Update build.gradle if needed
  const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Add signing config if not present
  if (!buildGradle.includes('signingConfigs')) {
    const signingConfig = `
    signingConfigs {
        release {
            storeFile file("prepmaster.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }`;
    
    buildGradle = buildGradle.replace(
      'buildTypes {',
      `signingConfigs {
        release {
            storeFile file("prepmaster.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {`
    );
    
    buildGradle = buildGradle.replace(
      'release {',
      'release {\n            signingConfig signingConfigs.release'
    );
    
    fs.writeFileSync(buildGradlePath, buildGradle);
  }

  console.log(`${colors.green}✓ Android project updated${colors.reset}\n`);

  // Step 4: Build Android APK
  console.log(`${colors.yellow}Building Android APK...${colors.reset}`);
  process.chdir(path.join(__dirname, '../android'));
  execSync('./gradlew assembleDebug', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Android build completed${colors.reset}\n`);

  // Step 5: Copy APK to convenient location
  const apkSource = path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
  const apkDest = path.join(__dirname, '../build/cbse-prepmaster.apk');
  
  if (!fs.existsSync(path.join(__dirname, '../build'))) {
    fs.mkdirSync(path.join(__dirname, '../build'));
  }
  
  fs.copyFileSync(apkSource, apkDest);
  
  console.log(`${colors.bright}Build completed successfully!${colors.reset}`);
  console.log(`${colors.green}APK location: ${apkDest}${colors.reset}\n`);

  // Step 6: Print next steps
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  console.log('1. Install the APK on your Android device');
  console.log('2. For release build, set up the following environment variables:');
  console.log('   - KEYSTORE_PASSWORD');
  console.log('   - KEY_ALIAS');
  console.log('   - KEY_PASSWORD');
  console.log('3. Run with release configuration:');
  console.log('   npm run build:android-release\n');

} catch (error) {
  console.error(`${colors.red}Build failed:${colors.reset}`, error);
  process.exit(1);
}
