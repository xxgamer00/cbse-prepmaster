const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    API_URL: 'http://localhost:5000',
    SOCKET_URL: 'ws://localhost:5000',
    ENV: 'development',
    DEBUG: true,
  },
  staging: {
    API_URL: 'https://staging-api.cbseprepmaster.com',
    SOCKET_URL: 'wss://staging-api.cbseprepmaster.com',
    ENV: 'staging',
    DEBUG: true,
  },
  production: {
    API_URL: 'https://api.cbseprepmaster.com',
    SOCKET_URL: 'wss://api.cbseprepmaster.com',
    ENV: 'production',
    DEBUG: false,
  },
};

// Required environment variables
const requiredVars = [
  'API_URL',
  'SOCKET_URL',
  'ENV',
  'DEBUG',
  'JWT_SECRET',
  'GOOGLE_ANALYTICS_ID',
  'SENTRY_DSN',
];

// Optional environment variables with defaults
const optionalVars = {
  CACHE_DURATION: '3600',
  MAX_UPLOAD_SIZE: '5242880',
  SESSION_TIMEOUT: '1800',
  RETRY_ATTEMPTS: '3',
};

async function manageEnv() {
  console.log(`${colors.bright}Starting environment management...${colors.reset}\n`);

  try {
    // Step 1: Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    const env = args[1];

    switch (command) {
      case 'init':
        await initializeEnv(env);
        break;
      case 'validate':
        await validateEnv(env);
        break;
      case 'encrypt':
        await encryptSecrets(env);
        break;
      case 'decrypt':
        await decryptSecrets(env);
        break;
      default:
        showHelp();
        break;
    }

  } catch (error) {
    console.error(`${colors.red}Environment management failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Initialize environment files
async function initializeEnv(env) {
  console.log(`${colors.yellow}Initializing environment files...${colors.reset}`);

  // Create base environment variables
  const baseEnv = {
    ...environments[env || 'development'],
    ...optionalVars,
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  };

  // Create .env file
  const envContent = Object.entries(baseEnv)
    .map(([key, value]) => `REACT_APP_${key}=${value}`)
    .join('\n');

  fs.writeFileSync(path.join(__dirname, '../.env'), envContent);

  // Create environment-specific files
  Object.keys(environments).forEach((environment) => {
    const envFile = path.join(__dirname, `../.env.${environment}`);
    const envVars = {
      ...environments[environment],
      ...optionalVars,
      JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    };

    const content = Object.entries(envVars)
      .map(([key, value]) => `REACT_APP_${key}=${value}`)
      .join('\n');

    fs.writeFileSync(envFile, content);
  });

  // Create .env.example
  const exampleContent = Object.entries(baseEnv)
    .map(([key, value]) => `REACT_APP_${key}=`)
    .join('\n');

  fs.writeFileSync(path.join(__dirname, '../.env.example'), exampleContent);

  console.log(`${colors.green}✓ Environment files created${colors.reset}\n`);
}

// Validate environment variables
async function validateEnv(env) {
  console.log(`${colors.yellow}Validating environment variables...${colors.reset}`);

  const envFile = env ? `.env.${env}` : '.env';
  const envPath = path.join(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file ${envFile} not found`);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = parseEnvFile(envContent);
  const issues = [];

  // Check required variables
  requiredVars.forEach((variable) => {
    const key = `REACT_APP_${variable}`;
    if (!envVars[key]) {
      issues.push(`Missing required variable: ${key}`);
    }
  });

  // Validate URL format
  if (envVars.REACT_APP_API_URL && !isValidUrl(envVars.REACT_APP_API_URL)) {
    issues.push('Invalid API_URL format');
  }

  if (envVars.REACT_APP_SOCKET_URL && !isValidUrl(envVars.REACT_APP_SOCKET_URL)) {
    issues.push('Invalid SOCKET_URL format');
  }

  // Validate environment name
  if (envVars.REACT_APP_ENV && !environments[envVars.REACT_APP_ENV]) {
    issues.push('Invalid environment name');
  }

  if (issues.length > 0) {
    console.log(`${colors.red}Found ${issues.length} issues:${colors.reset}`);
    issues.forEach((issue) => console.log(`- ${issue}`));
  } else {
    console.log(`${colors.green}✓ All environment variables are valid${colors.reset}`);
  }

  // Generate environment report
  generateEnvReport(envVars, issues);
}

// Encrypt sensitive environment variables
async function encryptSecrets(env) {
  console.log(`${colors.yellow}Encrypting sensitive variables...${colors.reset}`);

  const envFile = env ? `.env.${env}` : '.env';
  const envPath = path.join(__dirname, '..', envFile);
  const secretsPath = path.join(__dirname, '..', `${envFile}.secrets`);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file ${envFile} not found`);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = parseEnvFile(envContent);
  const secrets = {};
  const publicVars = {};

  // Separate sensitive and public variables
  Object.entries(envVars).forEach(([key, value]) => {
    if (isSensitive(key)) {
      secrets[key] = value;
    } else {
      publicVars[key] = value;
    }
  });

  // Encrypt secrets
  const encryptionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const encryptedSecrets = encryptData(JSON.stringify(secrets), encryptionKey, iv);

  // Save encrypted secrets
  fs.writeFileSync(
    secretsPath,
    JSON.stringify({
      key: encryptionKey.toString('hex'),
      iv: iv.toString('hex'),
      data: encryptedSecrets,
    })
  );

  // Update environment file with only public variables
  const publicContent = Object.entries(publicVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, publicContent);

  console.log(`${colors.green}✓ Sensitive variables encrypted${colors.reset}\n`);
}

// Decrypt sensitive environment variables
async function decryptSecrets(env) {
  console.log(`${colors.yellow}Decrypting sensitive variables...${colors.reset}`);

  const envFile = env ? `.env.${env}` : '.env';
  const envPath = path.join(__dirname, '..', envFile);
  const secretsPath = path.join(__dirname, '..', `${envFile}.secrets`);

  if (!fs.existsSync(secretsPath)) {
    throw new Error(`Secrets file ${envFile}.secrets not found`);
  }

  // Read encrypted secrets
  const secretsContent = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
  const encryptionKey = Buffer.from(secretsContent.key, 'hex');
  const iv = Buffer.from(secretsContent.iv, 'hex');

  // Decrypt secrets
  const decryptedSecrets = JSON.parse(
    decryptData(secretsContent.data, encryptionKey, iv)
  );

  // Merge with public variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const publicVars = parseEnvFile(envContent);
  const mergedVars = { ...publicVars, ...decryptedSecrets };

  // Save merged environment variables
  const mergedContent = Object.entries(mergedVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, mergedContent);

  console.log(`${colors.green}✓ Sensitive variables decrypted${colors.reset}\n`);
}

// Helper function to parse .env file
function parseEnvFile(content) {
  const vars = {};
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim();
    }
  });
  return vars;
}

// Helper function to validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Helper function to check if variable is sensitive
function isSensitive(key) {
  const sensitivePatterns = [
    /secret/i,
    /key/i,
    /password/i,
    /token/i,
    /auth/i,
    /dsn/i,
  ];
  return sensitivePatterns.some((pattern) => pattern.test(key));
}

// Helper function to encrypt data
function encryptData(data, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return (
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
  );
}

// Helper function to decrypt data
function decryptData(data, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return (
    decipher.update(data, 'hex', 'utf8') + decipher.final('utf8')
  );
}

// Generate environment report
function generateEnvReport(envVars, issues) {
  const reportPath = path.join(__dirname, '../env-report.html');
  const template = `
<!DOCTYPE html>
<html>
<head>
  <title>Environment Variables Report</title>
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
  <h1>Environment Variables Report</h1>
  
  <div class="section">
    <h2>Variables</h2>
    <table>
      <tr>
        <th>Variable</th>
        <th>Status</th>
        <th>Value</th>
      </tr>
      ${Object.entries(envVars)
        .map(
          ([key, value]) => `
        <tr>
          <td>${key}</td>
          <td class="${isSensitive(key) ? 'warning' : 'success'}">
            ${isSensitive(key) ? 'Sensitive' : 'Public'}
          </td>
          <td>${isSensitive(key) ? '********' : value}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  </div>

  ${
    issues.length > 0
      ? `
    <div class="section">
      <h2>Issues</h2>
      <ul>
        ${issues.map((issue) => `<li class="error">${issue}</li>`).join('')}
      </ul>
    </div>
  `
      : ''
  }

  <div class="section">
    <h2>Required Variables</h2>
    <ul>
      ${requiredVars.map((variable) => `<li>${variable}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Optional Variables</h2>
    <table>
      <tr>
        <th>Variable</th>
        <th>Default Value</th>
      </tr>
      ${Object.entries(optionalVars)
        .map(
          ([key, value]) => `
        <tr>
          <td>${key}</td>
          <td>${value}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  </div>

  <div class="section">
    <h2>Report Generated</h2>
    <p>${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, template);
  console.log(`\nReport generated: env-report.html`);
}

// Show help message
function showHelp() {
  console.log(`
${colors.bright}Environment Management Tool${colors.reset}

Usage: node scripts/manage-env.js <command> [environment]

Commands:
  init [env]      Initialize environment files
  validate [env]  Validate environment variables
  encrypt [env]   Encrypt sensitive variables
  decrypt [env]   Decrypt sensitive variables

Environments:
  development     Development environment
  staging        Staging environment
  production     Production environment

Examples:
  node scripts/manage-env.js init development
  node scripts/manage-env.js validate production
  node scripts/manage-env.js encrypt staging
  `);
}

// Run the script
manageEnv();
