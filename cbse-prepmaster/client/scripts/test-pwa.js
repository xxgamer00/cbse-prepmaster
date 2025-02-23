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
  blue: '\x1b[34m',
};

// PWA features to test
const pwaFeatures = {
  manifest: {
    required: [
      'name',
      'short_name',
      'start_url',
      'display',
      'background_color',
      'theme_color',
      'icons',
    ],
    recommended: ['description', 'orientation', 'scope', 'categories'],
  },
  serviceWorker: {
    features: [
      'offline-support',
      'cache-first-strategy',
      'network-first-strategy',
      'background-sync',
      'push-notifications',
    ],
  },
  caching: {
    resources: [
      'static-assets',
      'api-responses',
      'images',
      'fonts',
    ],
  },
};

async function testPWA() {
  console.log(`${colors.bright}Starting PWA testing...${colors.reset}\n`);

  try {
    // Step 1: Build the app
    console.log(`${colors.yellow}Building the application...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Build completed${colors.reset}\n`);

    // Step 2: Validate manifest.json
    console.log(`${colors.yellow}Validating manifest.json...${colors.reset}`);
    const manifestPath = path.join(__dirname, '../build/manifest.json');
    const manifest = require(manifestPath);

    const manifestIssues = validateManifest(manifest);
    if (manifestIssues.length > 0) {
      console.log(`${colors.red}Manifest issues found:${colors.reset}`);
      manifestIssues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log(`${colors.green}✓ Manifest validation passed${colors.reset}`);
    }
    console.log('');

    // Step 3: Validate service worker
    console.log(`${colors.yellow}Validating service worker...${colors.reset}`);
    const swPath = path.join(__dirname, '../build/service-worker.js');
    const swContent = fs.readFileSync(swPath, 'utf8');

    const swIssues = validateServiceWorker(swContent);
    if (swIssues.length > 0) {
      console.log(`${colors.red}Service Worker issues found:${colors.reset}`);
      swIssues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log(`${colors.green}✓ Service Worker validation passed${colors.reset}`);
    }
    console.log('');

    // Step 4: Test offline functionality
    console.log(`${colors.yellow}Testing offline functionality...${colors.reset}`);
    const offlineResults = await testOfflineSupport();
    console.log(`${colors.green}✓ Offline testing completed${colors.reset}\n`);

    // Step 5: Test caching strategies
    console.log(`${colors.yellow}Testing caching strategies...${colors.reset}`);
    const cacheResults = await testCaching();
    console.log(`${colors.green}✓ Cache testing completed${colors.reset}\n`);

    // Generate report
    generateReport({
      manifest: {
        issues: manifestIssues,
        score: (100 - (manifestIssues.length * 10)),
      },
      serviceWorker: {
        issues: swIssues,
        score: (100 - (swIssues.length * 10)),
      },
      offline: offlineResults,
      caching: cacheResults,
    });

    console.log(`${colors.bright}PWA Testing completed!${colors.reset}\n`);

    // Print recommendations
    console.log(`${colors.blue}Recommendations:${colors.reset}`);
    if (manifestIssues.length > 0) {
      console.log('1. Update manifest.json to fix identified issues');
    }
    if (swIssues.length > 0) {
      console.log('2. Enhance service worker implementation');
    }
    if (!offlineResults.fullSupport) {
      console.log('3. Improve offline functionality');
    }
    if (!cacheResults.allStrategiesImplemented) {
      console.log('4. Implement missing caching strategies');
    }
    console.log('\nSee pwa-report.html for detailed results\n');

  } catch (error) {
    console.error(`${colors.red}Testing failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Helper function to validate manifest
function validateManifest(manifest) {
  const issues = [];

  // Check required fields
  pwaFeatures.manifest.required.forEach(field => {
    if (!manifest[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  });

  // Validate icons
  if (manifest.icons) {
    const sizes = manifest.icons.map(icon => icon.sizes);
    const requiredSizes = ['192x192', '512x512'];
    requiredSizes.forEach(size => {
      if (!sizes.includes(size)) {
        issues.push(`Missing icon size: ${size}`);
      }
    });
  }

  // Check recommended fields
  pwaFeatures.manifest.recommended.forEach(field => {
    if (!manifest[field]) {
      issues.push(`Missing recommended field: ${field}`);
    }
  });

  return issues;
}

// Helper function to validate service worker
function validateServiceWorker(content) {
  const issues = [];

  // Check for required features
  pwaFeatures.serviceWorker.features.forEach(feature => {
    const patterns = {
      'offline-support': /workbox\.routing|workbox\.strategies/,
      'cache-first-strategy': /CacheFirst|cacheFirst/,
      'network-first-strategy': /NetworkFirst|networkFirst/,
      'background-sync': /workbox\.backgroundSync|BackgroundSyncPlugin/,
      'push-notifications': /self\.addEventListener\(['"]push['"]|push\.subscribe/,
    };

    if (!patterns[feature].test(content)) {
      issues.push(`Missing feature: ${feature}`);
    }
  });

  return issues;
}

// Helper function to test offline support
async function testOfflineSupport() {
  const results = {
    fullSupport: false,
    testedFeatures: [],
  };

  // Start local server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  });

  server.listen(3000);

  try {
    // Test offline page
    const offlinePage = path.join(__dirname, '../build/offline.html');
    results.testedFeatures.push({
      name: 'Offline Page',
      status: fs.existsSync(offlinePage) ? 'pass' : 'fail',
    });

    // Test cache storage
    const swContent = fs.readFileSync(
      path.join(__dirname, '../build/service-worker.js'),
      'utf8'
    );
    results.testedFeatures.push({
      name: 'Cache Storage',
      status: /workbox\.precaching/.test(swContent) ? 'pass' : 'fail',
    });

    results.fullSupport = results.testedFeatures.every(f => f.status === 'pass');
  } finally {
    server.close();
  }

  return results;
}

// Helper function to test caching
async function testCaching() {
  const results = {
    allStrategiesImplemented: false,
    strategies: [],
  };

  const swContent = fs.readFileSync(
    path.join(__dirname, '../build/service-worker.js'),
    'utf8'
  );

  // Test different caching strategies
  const strategies = {
    'Cache First': /CacheFirst|cacheFirst/,
    'Network First': /NetworkFirst|networkFirst/,
    'Stale While Revalidate': /StaleWhileRevalidate|staleWhileRevalidate/,
    'Cache Only': /CacheOnly|cacheOnly/,
    'Network Only': /NetworkOnly|networkOnly/,
  };

  Object.entries(strategies).forEach(([name, pattern]) => {
    results.strategies.push({
      name,
      implemented: pattern.test(swContent),
    });
  });

  results.allStrategiesImplemented = results.strategies.every(s => s.implemented);

  return results;
}

// Helper function to generate report
function generateReport(data) {
  const reportPath = path.join(__dirname, '../pwa-report.html');
  const template = `
<!DOCTYPE html>
<html>
<head>
  <title>PWA Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    .section { margin-bottom: 2rem; }
    .score { font-size: 2rem; font-weight: bold; }
    .pass { color: #4caf50; }
    .fail { color: #f44336; }
    .warning { color: #ff9800; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>PWA Test Report</h1>
  
  <div class="section">
    <h2>Manifest Score: <span class="score ${data.manifest.score >= 90 ? 'pass' : 'fail'}">${data.manifest.score}%</span></h2>
    ${data.manifest.issues.length > 0 ? `
      <h3>Issues:</h3>
      <ul>
        ${data.manifest.issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
    ` : '<p>No issues found</p>'}
  </div>

  <div class="section">
    <h2>Service Worker Score: <span class="score ${data.serviceWorker.score >= 90 ? 'pass' : 'fail'}">${data.serviceWorker.score}%</span></h2>
    ${data.serviceWorker.issues.length > 0 ? `
      <h3>Issues:</h3>
      <ul>
        ${data.serviceWorker.issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
    ` : '<p>No issues found</p>'}
  </div>

  <div class="section">
    <h2>Offline Support</h2>
    <table>
      <tr>
        <th>Feature</th>
        <th>Status</th>
      </tr>
      ${data.offline.testedFeatures.map(feature => `
        <tr>
          <td>${feature.name}</td>
          <td class="${feature.status === 'pass' ? 'pass' : 'fail'}">${feature.status}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="section">
    <h2>Caching Strategies</h2>
    <table>
      <tr>
        <th>Strategy</th>
        <th>Status</th>
      </tr>
      ${data.caching.strategies.map(strategy => `
        <tr>
          <td>${strategy.name}</td>
          <td class="${strategy.implemented ? 'pass' : 'fail'}">${strategy.implemented ? 'Implemented' : 'Missing'}</td>
        </tr>
      `).join('')}
    </table>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, template);
}

// Run tests
testPWA();
