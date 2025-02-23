const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

// Version types
const VERSION_TYPES = ['major', 'minor', 'patch', 'beta', 'alpha'];

// Files to update version
const FILES_TO_UPDATE = {
  packageJson: '../package.json',
  androidGradle: '../android/app/build.gradle',
  constants: '../src/config/constants.js',
};

async function updateVersion(type) {
  console.log(`${colors.bright}Starting version update process...${colors.reset}\n`);

  try {
    // Validate version type
    if (!VERSION_TYPES.includes(type)) {
      throw new Error(
        `Invalid version type. Must be one of: ${VERSION_TYPES.join(', ')}`
      );
    }

    // Step 1: Read current version from package.json
    console.log(`${colors.yellow}Reading current version...${colors.reset}`);
    const packageJsonPath = path.join(__dirname, FILES_TO_UPDATE.packageJson);
    const packageJson = require(packageJsonPath);
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Step 2: Calculate new version
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    let newVersion;
    let versionCode;

    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        versionCode = (major + 1) * 10000;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        versionCode = major * 10000 + (minor + 1) * 100;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        versionCode = major * 10000 + minor * 100 + patch + 1;
        break;
      case 'beta':
        newVersion = `${major}.${minor}.${patch}-beta.${Date.now()}`;
        versionCode = major * 10000 + minor * 100 + patch;
        break;
      case 'alpha':
        newVersion = `${major}.${minor}.${patch}-alpha.${Date.now()}`;
        versionCode = major * 10000 + minor * 100 + patch;
        break;
    }

    console.log(`New version: ${newVersion}`);
    console.log(`Version code: ${versionCode}\n`);

    // Step 3: Update package.json
    console.log(`${colors.yellow}Updating package.json...${colors.reset}`);
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}✓ package.json updated${colors.reset}\n`);

    // Step 4: Update Android build.gradle
    console.log(`${colors.yellow}Updating Android build.gradle...${colors.reset}`);
    const buildGradlePath = path.join(__dirname, FILES_TO_UPDATE.androidGradle);
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

    // Update versionCode and versionName
    buildGradle = buildGradle.replace(
      /(versionCode\s+)\d+/,
      `$1${versionCode}`
    );
    buildGradle = buildGradle.replace(
      /(versionName\s+")[^"]+"/,
      `$1${newVersion}"`
    );

    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log(`${colors.green}✓ build.gradle updated${colors.reset}\n`);

    // Step 5: Update constants.js
    console.log(`${colors.yellow}Updating constants.js...${colors.reset}`);
    const constantsPath = path.join(__dirname, FILES_TO_UPDATE.constants);
    let constants = fs.readFileSync(constantsPath, 'utf8');

    // Update APP_VERSION
    constants = constants.replace(
      /(APP_VERSION:\s*['"])[^'"]+(['"])/,
      `$1${newVersion}$2`
    );

    fs.writeFileSync(constantsPath, constants);
    console.log(`${colors.green}✓ constants.js updated${colors.reset}\n`);

    // Step 6: Create git tag and commit
    console.log(`${colors.yellow}Creating git commit and tag...${colors.reset}`);
    
    try {
      // Stage changes
      execSync('git add package.json android/app/build.gradle src/config/constants.js');
      
      // Create commit
      execSync(`git commit -m "chore: bump version to ${newVersion}"`);
      
      // Create tag
      execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`);
      
      console.log(`${colors.green}✓ Git commit and tag created${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ Git operations failed. Please commit changes manually.${colors.reset}\n`);
    }

    // Step 7: Generate changelog
    console.log(`${colors.yellow}Generating changelog...${colors.reset}`);
    const changelogPath = path.join(__dirname, '../CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    
    const changelogEntry = `
# ${newVersion} (${date})

${type === 'major' ? '## Breaking Changes\n\n' : ''}
${type === 'minor' ? '## New Features\n\n' : ''}
${type === 'patch' ? '## Bug Fixes\n\n' : ''}
${type === 'beta' || type === 'alpha' ? '## Pre-release Notes\n\n' : ''}

`;

    if (fs.existsSync(changelogPath)) {
      const existingChangelog = fs.readFileSync(changelogPath, 'utf8');
      fs.writeFileSync(changelogPath, changelogEntry + existingChangelog);
    } else {
      fs.writeFileSync(changelogPath, changelogEntry);
    }
    
    console.log(`${colors.green}✓ Changelog updated${colors.reset}\n`);

    console.log(`${colors.bright}Version update completed successfully!${colors.reset}\n`);

    // Print next steps
    console.log(`${colors.blue}Next Steps:${colors.reset}`);
    console.log('1. Update the CHANGELOG.md with detailed release notes');
    console.log('2. Push changes and tags:');
    console.log('   git push origin main --tags');
    console.log('3. Run the appropriate deployment script:');
    console.log('   npm run deploy:prod (for production)');
    console.log('   npm run deploy:staging (for staging)\n');

  } catch (error) {
    console.error(`${colors.red}Version update failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Get version type from command line argument
const versionType = process.argv[2];
if (!versionType) {
  console.error(`${colors.red}Please specify a version type:${colors.reset}`);
  console.log('node scripts/version.js <type>');
  console.log(`Available types: ${VERSION_TYPES.join(', ')}`);
  process.exit(1);
}

// Run version update
updateVersion(versionType);
