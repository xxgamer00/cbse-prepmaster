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
  blue: '\x1b[34m',
};

// Environment configurations
const environments = {
  development: {
    apiUrl: 'http://localhost:5000/api',
    enableDebug: true,
  },
  staging: {
    apiUrl: 'https://staging-api.cbseprepmaster.com',
    enableDebug: true,
  },
  production: {
    apiUrl: 'https://api.cbseprepmaster.com',
    enableDebug: false,
  },
};

// Deployment steps
async function deploy(environment) {
  console.log(`${colors.bright}Starting deployment to ${environment}...${colors.reset}\n`);

  try {
    // Step 1: Validate environment
    if (!environments[environment]) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    // Step 2: Create environment-specific configuration
    console.log(`${colors.yellow}Creating environment configuration...${colors.reset}`);
    const envConfig = environments[environment];
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `REACT_APP_${key.toUpperCase()}=${value}`)
      .join('\n');

    fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
    console.log(`${colors.green}✓ Environment configuration created${colors.reset}\n`);

    // Step 3: Install dependencies
    console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dependencies installed${colors.reset}\n`);

    // Step 4: Build the application
    console.log(`${colors.yellow}Building the application...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Build completed${colors.reset}\n`);

    // Step 5: Update version numbers
    console.log(`${colors.yellow}Updating version numbers...${colors.reset}`);
    
    // Update version in package.json
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = require(packagePath);
    const [major, minor, patch] = packageJson.version.split('.');
    packageJson.version = `${major}.${minor}.${parseInt(patch) + 1}`;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

    // Update version in Android build.gradle
    const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    const versionCodeRegex = /(versionCode\s+)(\d+)/;
    const versionNameRegex = /(versionName\s+")([^"]+)(")/;
    
    const currentVersionCode = parseInt(buildGradle.match(versionCodeRegex)[2]);
    buildGradle = buildGradle.replace(
      versionCodeRegex,
      `$1${currentVersionCode + 1}`
    );
    buildGradle = buildGradle.replace(
      versionNameRegex,
      `$1${packageJson.version}$3`
    );
    
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log(`${colors.green}✓ Version numbers updated${colors.reset}\n`);

    // Step 6: Build Android APK
    if (environment === 'production') {
      console.log(`${colors.yellow}Building release APK...${colors.reset}`);
      execSync('npm run build:android-release', { stdio: 'inherit' });
      console.log(`${colors.green}✓ Release APK built${colors.reset}\n`);

      // Step 7: Sign APK
      console.log(`${colors.yellow}Signing APK...${colors.reset}`);
      const keystorePath = path.join(__dirname, '../android/app/keystore/release.keystore');
      if (!fs.existsSync(keystorePath)) {
        throw new Error('Release keystore not found. Please run keytool command first.');
      }
      
      execSync(
        'jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 ' +
        '-keystore android/app/keystore/release.keystore ' +
        '-storepass $KEYSTORE_PASSWORD ' +
        '-keypass $KEY_PASSWORD ' +
        'android/app/build/outputs/apk/release/app-release-unsigned.apk ' +
        '$KEY_ALIAS',
        { stdio: 'inherit' }
      );
      console.log(`${colors.green}✓ APK signed${colors.reset}\n`);
    }

    // Step 8: Generate deployment report
    console.log(`${colors.yellow}Generating deployment report...${colors.reset}`);
    const reportContent = `
Deployment Report
----------------
Environment: ${environment}
Version: ${packageJson.version}
Date: ${new Date().toISOString()}
Build Size: ${getFolderSize(path.join(__dirname, '../build'))} MB
API URL: ${envConfig.apiUrl}
Debug Enabled: ${envConfig.enableDebug}
    `;

    fs.writeFileSync(
      path.join(__dirname, `../deploy-report-${environment}.txt`),
      reportContent.trim()
    );
    console.log(`${colors.green}✓ Deployment report generated${colors.reset}\n`);

    console.log(`${colors.bright}Deployment completed successfully!${colors.reset}\n`);
    
    // Print next steps
    console.log(`${colors.blue}Next Steps:${colors.reset}`);
    if (environment === 'production') {
      console.log('1. Upload APK to Google Play Console');
      console.log('2. Submit for review');
      console.log('3. Monitor release rollout');
    } else {
      console.log('1. Test the deployment thoroughly');
      console.log('2. Share the build with QA team');
      console.log('3. Report any issues in the issue tracker');
    }
    console.log('\n');

  } catch (error) {
    console.error(`${colors.red}Deployment failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Helper function to get folder size in MB
function getFolderSize(folderPath) {
  const { execSync } = require('child_process');
  const size = execSync(`du -sk "${folderPath}"`)
    .toString()
    .split('\t')[0];
  return (parseInt(size) / 1024).toFixed(2);
}

// Get environment from command line argument
const environment = process.argv[2];
if (!environment) {
  console.error(`${colors.red}Please specify an environment:${colors.reset}`);
  console.log('node scripts/deploy.js <environment>');
  console.log('Available environments: development, staging, production');
  process.exit(1);
}

// Run deployment
deploy(environment);
