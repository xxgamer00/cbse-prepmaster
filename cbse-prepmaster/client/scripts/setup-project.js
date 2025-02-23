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

async function setupProject() {
  console.log(`${colors.bright}Starting CBSE PrepMaster project setup...${colors.reset}\n`);

  try {
    // Step 1: Install dependencies
    console.log(`${colors.yellow}Installing project dependencies...${colors.reset}`);
    execSync('npm install', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dependencies installed${colors.reset}\n`);

    // Step 2: Set up development environment
    console.log(`${colors.yellow}Setting up development environment...${colors.reset}`);
    execSync('node scripts/setup-dev.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Development environment setup completed${colors.reset}\n`);

    // Step 3: Initialize translations
    console.log(`${colors.yellow}Initializing translations...${colors.reset}`);
    execSync('node scripts/manage-translations.js init', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Translations initialized${colors.reset}\n`);

    // Step 4: Generate and optimize assets
    console.log(`${colors.yellow}Generating and optimizing assets...${colors.reset}`);
    execSync('node scripts/generate-assets.js', { stdio: 'inherit' });
    execSync('node scripts/optimize-assets.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Assets generated and optimized${colors.reset}\n`);

    // Step 5: Initialize Android project
    console.log(`${colors.yellow}Setting up Android project...${colors.reset}`);
    execSync('node scripts/init-android.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Android project initialized${colors.reset}\n`);

    // Step 6: Run tests
    console.log(`${colors.yellow}Running tests...${colors.reset}`);
    execSync('npm test', { stdio: 'inherit' });
    execSync('node scripts/test-app.js', { stdio: 'inherit' });
    execSync('node scripts/test-pwa.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Tests completed${colors.reset}\n`);

    // Step 7: Analyze initial build
    console.log(`${colors.yellow}Analyzing initial build...${colors.reset}`);
    execSync('node scripts/analyze.js', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Analysis completed${colors.reset}\n`);

    // Step 8: Create initial development build
    console.log(`${colors.yellow}Creating development build...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Development build created${colors.reset}\n`);

    // Create setup report
    generateSetupReport();

    console.log(`${colors.bright}Project setup completed successfully!${colors.reset}\n`);

    // Print next steps
    console.log(`${colors.blue}Next Steps:${colors.reset}`);
    console.log('1. Review the setup report in setup-report.html');
    console.log('2. Configure environment variables in .env files');
    console.log('3. Start the development server:');
    console.log('   npm start');
    console.log('4. For Android development:');
    console.log('   npm run android');
    console.log('5. For production deployment:');
    console.log('   npm run deploy:prod\n');

  } catch (error) {
    console.error(`${colors.red}Setup failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Generate setup report
function generateSetupReport() {
  const reportPath = path.join(__dirname, '../setup-report.html');
  const template = `
<!DOCTYPE html>
<html>
<head>
  <title>CBSE PrepMaster Setup Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    .section { margin-bottom: 2rem; }
    .success { color: #4caf50; }
    .warning { color: #ff9800; }
    .error { color: #f44336; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>CBSE PrepMaster Setup Report</h1>
  
  <div class="section">
    <h2>Environment</h2>
    <table>
      <tr>
        <th>Component</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
      <tr>
        <td>Node.js</td>
        <td class="success">✓</td>
        <td>${process.version}</td>
      </tr>
      <tr>
        <td>npm</td>
        <td class="success">✓</td>
        <td>${execSync('npm -v').toString().trim()}</td>
      </tr>
      <tr>
        <td>Android SDK</td>
        <td class="success">✓</td>
        <td>Platform 33 (Android 13.0)</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Project Structure</h2>
    <pre>${generateProjectTree()}</pre>
  </div>

  <div class="section">
    <h2>Dependencies</h2>
    ${generateDependenciesReport()}
  </div>

  <div class="section">
    <h2>Configuration Files</h2>
    <ul>
      <li>package.json - Project configuration and scripts</li>
      <li>capacitor.config.json - Capacitor configuration</li>
      <li>.env - Environment variables</li>
      <li>android/app/build.gradle - Android build configuration</li>
    </ul>
  </div>

  <div class="section">
    <h2>Available Scripts</h2>
    <table>
      <tr>
        <th>Script</th>
        <th>Description</th>
      </tr>
      <tr>
        <td>npm start</td>
        <td>Start development server</td>
      </tr>
      <tr>
        <td>npm run android</td>
        <td>Run Android development build</td>
      </tr>
      <tr>
        <td>npm run build:android-release</td>
        <td>Create Android release build</td>
      </tr>
      <tr>
        <td>npm run deploy:prod</td>
        <td>Deploy to production</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Setup Date</h2>
    <p>${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, template);
}

// Generate project tree
function generateProjectTree() {
  function buildTree(dir, prefix = '') {
    let tree = '';
    const items = fs.readdirSync(dir);
    
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      tree += `${prefix}${isLast ? '└── ' : '├── '}${item}\n`;
      
      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        tree += buildTree(itemPath, prefix + (isLast ? '    ' : '│   '));
      }
    });
    
    return tree;
  }

  return buildTree(path.join(__dirname, '..'));
}

// Generate dependencies report
function generateDependenciesReport() {
  const packageJson = require('../package.json');
  
  let report = '<table><tr><th>Package</th><th>Version</th></tr>';
  
  // Add dependencies
  Object.entries(packageJson.dependencies).forEach(([pkg, version]) => {
    report += `<tr><td>${pkg}</td><td>${version}</td></tr>`;
  });
  
  // Add dev dependencies
  Object.entries(packageJson.devDependencies).forEach(([pkg, version]) => {
    report += `<tr><td>${pkg} (dev)</td><td>${version}</td></tr>`;
  });
  
  report += '</table>';
  return report;
}

// Run setup
setupProject();
