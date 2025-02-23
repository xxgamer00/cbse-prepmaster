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

// Performance thresholds
const THRESHOLDS = {
  bundleSize: 2 * 1024 * 1024, // 2MB
  chunkSize: 500 * 1024, // 500KB
  imageSize: 200 * 1024, // 200KB
  firstPaint: 2000, // 2 seconds
  firstContentfulPaint: 2500, // 2.5 seconds
  timeToInteractive: 3500, // 3.5 seconds
};

async function analyzePerformance() {
  console.log(`${colors.bright}Starting performance analysis...${colors.reset}\n`);

  try {
    // Step 1: Analyze bundle size
    console.log(`${colors.yellow}Analyzing bundle size...${colors.reset}`);
    execSync('npm run build -- --stats', { stdio: 'inherit' });
    
    const statsFile = path.join(__dirname, '../build/bundle-stats.json');
    const stats = require(statsFile);
    
    const totalSize = stats.assets.reduce((sum, asset) => sum + asset.size, 0);
    const largeChunks = stats.assets.filter(asset => asset.size > THRESHOLDS.chunkSize);
    
    console.log(`Total bundle size: ${formatSize(totalSize)}`);
    if (largeChunks.length > 0) {
      console.log('\nLarge chunks detected:');
      largeChunks.forEach(chunk => {
        console.log(`- ${chunk.name}: ${formatSize(chunk.size)}`);
      });
    }
    console.log(`${colors.green}✓ Bundle analysis completed${colors.reset}\n`);

    // Step 2: Analyze image optimization
    console.log(`${colors.yellow}Analyzing images...${colors.reset}`);
    const imageStats = analyzeImages();
    console.log(`${colors.green}✓ Image analysis completed${colors.reset}\n`);

    // Step 3: Run Lighthouse audit
    console.log(`${colors.yellow}Running Lighthouse audit...${colors.reset}`);
    const lighthouseReport = runLighthouseAudit();
    console.log(`${colors.green}✓ Lighthouse audit completed${colors.reset}\n`);

    // Step 4: Generate performance report
    console.log(`${colors.yellow}Generating performance report...${colors.reset}`);
    generateReport({
      bundleStats: stats,
      imageStats,
      lighthouseReport,
    });
    console.log(`${colors.green}✓ Report generated${colors.reset}\n`);

    // Print optimization suggestions
    console.log(`${colors.bright}Performance Analysis Results:${colors.reset}\n`);
    
    // Bundle size suggestions
    if (totalSize > THRESHOLDS.bundleSize) {
      console.log(`${colors.red}Bundle Size Issues:${colors.reset}`);
      console.log('- Consider code splitting for large components');
      console.log('- Implement lazy loading for routes');
      console.log('- Review and remove unused dependencies');
      console.log('');
    }

    // Image optimization suggestions
    if (imageStats.largeImages.length > 0) {
      console.log(`${colors.red}Image Optimization Issues:${colors.reset}`);
      console.log('- Compress large images');
      console.log('- Consider using WebP format');
      console.log('- Implement lazy loading for images');
      console.log('');
    }

    // Performance suggestions
    if (lighthouseReport.performance < 90) {
      console.log(`${colors.red}Performance Issues:${colors.reset}`);
      console.log('- Optimize critical rendering path');
      console.log('- Minimize main thread work');
      console.log('- Reduce JavaScript execution time');
      console.log('');
    }

    // Print next steps
    console.log(`${colors.blue}Next Steps:${colors.reset}`);
    console.log('1. Review the detailed report in performance-report.html');
    console.log('2. Address critical performance issues');
    console.log('3. Run analysis again to verify improvements');
    console.log('4. Consider implementing suggested optimizations\n');

  } catch (error) {
    console.error(`${colors.red}Analysis failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Helper function to analyze images
function analyzeImages() {
  const imageStats = {
    totalImages: 0,
    totalSize: 0,
    largeImages: [],
    unoptimizedImages: [],
  };

  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const publicDir = path.join(__dirname, '../public');
  const srcDir = path.join(__dirname, '../src');

  function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
        imageStats.totalImages++;
        imageStats.totalSize += stat.size;

        if (stat.size > THRESHOLDS.imageSize) {
          imageStats.largeImages.push({
            path: filePath,
            size: stat.size,
          });
        }

        // Check if image is optimized
        if (path.extname(file) !== '.webp') {
          imageStats.unoptimizedImages.push(filePath);
        }
      }
    });
  }

  processDirectory(publicDir);
  processDirectory(srcDir);

  return imageStats;
}

// Helper function to run Lighthouse audit
function runLighthouseAudit() {
  try {
    execSync('npx serve -s build', { stdio: 'ignore' });
    const result = execSync(
      'lighthouse http://localhost:5000 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless"'
    );
    execSync('pkill -f "serve -s build"', { stdio: 'ignore' });

    const report = require('../lighthouse-report.json');
    return {
      performance: report.categories.performance.score * 100,
      firstPaint: report.audits['first-contentful-paint'].numericValue,
      timeToInteractive: report.audits.interactive.numericValue,
      totalBlockingTime: report.audits['total-blocking-time'].numericValue,
    };
  } catch (error) {
    console.log(`${colors.yellow}⚠ Lighthouse audit failed, skipping...${colors.reset}`);
    return {
      performance: 0,
      firstPaint: 0,
      timeToInteractive: 0,
      totalBlockingTime: 0,
    };
  }
}

// Helper function to generate performance report
function generateReport(data) {
  const reportPath = path.join(__dirname, '../performance-report.html');
  const template = `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    .section { margin-bottom: 2rem; }
    .warning { color: #f44336; }
    .success { color: #4caf50; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Performance Analysis Report</h1>
  <div class="section">
    <h2>Bundle Analysis</h2>
    <p>Total Size: ${formatSize(data.bundleStats.assets.reduce((sum, asset) => sum + asset.size, 0))}</p>
    <table>
      <tr>
        <th>Chunk</th>
        <th>Size</th>
        <th>Status</th>
      </tr>
      ${data.bundleStats.assets.map(asset => `
        <tr>
          <td>${asset.name}</td>
          <td>${formatSize(asset.size)}</td>
          <td class="${asset.size > THRESHOLDS.chunkSize ? 'warning' : 'success'}">
            ${asset.size > THRESHOLDS.chunkSize ? 'Needs optimization' : 'OK'}
          </td>
        </tr>
      `).join('')}
    </table>
  </div>

  <div class="section">
    <h2>Image Analysis</h2>
    <p>Total Images: ${data.imageStats.totalImages}</p>
    <p>Total Size: ${formatSize(data.imageStats.totalSize)}</p>
    ${data.imageStats.largeImages.length > 0 ? `
      <h3>Large Images</h3>
      <table>
        <tr>
          <th>Path</th>
          <th>Size</th>
        </tr>
        ${data.imageStats.largeImages.map(img => `
          <tr>
            <td>${img.path}</td>
            <td>${formatSize(img.size)}</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}
  </div>

  <div class="section">
    <h2>Lighthouse Results</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Performance Score</td>
        <td>${data.lighthouseReport.performance}%</td>
        <td class="${data.lighthouseReport.performance >= 90 ? 'success' : 'warning'}">
          ${data.lighthouseReport.performance >= 90 ? 'Good' : 'Needs improvement'}
        </td>
      </tr>
      <tr>
        <td>First Paint</td>
        <td>${(data.lighthouseReport.firstPaint / 1000).toFixed(2)}s</td>
        <td class="${data.lighthouseReport.firstPaint <= THRESHOLDS.firstPaint ? 'success' : 'warning'}">
          ${data.lighthouseReport.firstPaint <= THRESHOLDS.firstPaint ? 'Good' : 'Needs improvement'}
        </td>
      </tr>
      <tr>
        <td>Time to Interactive</td>
        <td>${(data.lighthouseReport.timeToInteractive / 1000).toFixed(2)}s</td>
        <td class="${data.lighthouseReport.timeToInteractive <= THRESHOLDS.timeToInteractive ? 'success' : 'warning'}">
          ${data.lighthouseReport.timeToInteractive <= THRESHOLDS.timeToInteractive ? 'Good' : 'Needs improvement'}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, template);
}

// Helper function to format file sizes
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Run analysis
analyzePerformance();
