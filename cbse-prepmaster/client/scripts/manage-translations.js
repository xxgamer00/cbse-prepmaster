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

// Supported languages
const LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  gu: 'Gujarati',
  mr: 'Marathi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  bn: 'Bengali',
};

// Translation categories
const CATEGORIES = [
  'common',
  'auth',
  'dashboard',
  'tests',
  'results',
  'admin',
  'errors',
  'subjects',
];

async function manageTranslations() {
  console.log(`${colors.bright}Starting translation management...${colors.reset}\n`);

  try {
    // Step 1: Create translations directory if it doesn't exist
    const translationsDir = path.join(__dirname, '../src/translations');
    if (!fs.existsSync(translationsDir)) {
      fs.mkdirSync(translationsDir);
    }

    // Step 2: Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'init':
        await initializeTranslations();
        break;
      case 'extract':
        await extractTranslations();
        break;
      case 'validate':
        await validateTranslations();
        break;
      case 'sync':
        await syncTranslations();
        break;
      case 'add-language':
        const lang = args[1];
        if (!lang) {
          throw new Error('Language code is required');
        }
        await addLanguage(lang);
        break;
      default:
        showHelp();
        break;
    }

  } catch (error) {
    console.error(`${colors.red}Translation management failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Initialize translations for all supported languages
async function initializeTranslations() {
  console.log(`${colors.yellow}Initializing translations...${colors.reset}`);

  const baseTranslations = {};
  CATEGORIES.forEach(category => {
    baseTranslations[category] = {
      title: `${category.charAt(0).toUpperCase()}${category.slice(1)}`,
      description: `Translation strings for ${category}`,
      strings: {},
    };
  });

  // Create translation files for each language
  for (const [langCode, langName] of Object.entries(LANGUAGES)) {
    const langFile = path.join(__dirname, `../src/translations/${langCode}.json`);
    if (!fs.existsSync(langFile)) {
      fs.writeFileSync(langFile, JSON.stringify(baseTranslations, null, 2));
      console.log(`${colors.green}✓ Created ${langName} (${langCode}) translations${colors.reset}`);
    }
  }

  // Create index file
  const indexContent = `// Auto-generated file - DO NOT EDIT
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

${Object.entries(LANGUAGES)
  .map(([code]) => `import ${code} from './${code}.json';`)
  .join('\n')}

const resources = {
  ${Object.entries(LANGUAGES)
    .map(([code]) => `${code}: { translation: ${code} },`)
    .join('\n  ')}
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
`;

  fs.writeFileSync(
    path.join(__dirname, '../src/translations/index.js'),
    indexContent
  );

  console.log(`${colors.green}✓ Created translations index file${colors.reset}\n`);
}

// Extract translatable strings from source code
async function extractTranslations() {
  console.log(`${colors.yellow}Extracting translatable strings...${colors.reset}`);

  const sourceDir = path.join(__dirname, '../src');
  const translations = {};

  // Find all translatable strings in source files
  function extractFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [
      ...content.matchAll(/(?:t|i18next)\(['"]([^'"]+)['"]/g),
      ...content.matchAll(/Trans[^>]*>([^<]+)</g),
    ];

    matches.forEach(match => {
      const key = match[1];
      const category = determineCategory(filePath);
      if (!translations[category]) {
        translations[category] = new Set();
      }
      translations[category].add(key);
    });
  }

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walkDir(filePath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        extractFromFile(filePath);
      }
    });
  }

  walkDir(sourceDir);

  // Update English translations with new strings
  const enTranslations = require('../src/translations/en.json');
  
  Object.entries(translations).forEach(([category, strings]) => {
    if (!enTranslations[category]) {
      enTranslations[category] = { strings: {} };
    }
    strings.forEach(key => {
      if (!enTranslations[category].strings[key]) {
        enTranslations[category].strings[key] = key;
      }
    });
  });

  fs.writeFileSync(
    path.join(__dirname, '../src/translations/en.json'),
    JSON.stringify(enTranslations, null, 2)
  );

  console.log(`${colors.green}✓ Updated English translations${colors.reset}\n`);
}

// Validate translations for all languages
async function validateTranslations() {
  console.log(`${colors.yellow}Validating translations...${colors.reset}`);

  const enTranslations = require('../src/translations/en.json');
  const issues = [];

  // Check each language
  for (const [langCode, langName] of Object.entries(LANGUAGES)) {
    if (langCode === 'en') continue;

    console.log(`\nChecking ${langName} translations...`);
    const langFile = path.join(__dirname, `../src/translations/${langCode}.json`);
    
    if (!fs.existsSync(langFile)) {
      issues.push(`Missing translation file for ${langName}`);
      continue;
    }

    const langTranslations = require(langFile);

    // Check categories
    Object.keys(enTranslations).forEach(category => {
      if (!langTranslations[category]) {
        issues.push(`Missing category '${category}' in ${langName} translations`);
        return;
      }

      // Check strings
      Object.keys(enTranslations[category].strings).forEach(key => {
        if (!langTranslations[category].strings[key]) {
          issues.push(`Missing translation for '${key}' in ${langName} (${category})`);
        }
      });
    });
  }

  if (issues.length > 0) {
    console.log(`\n${colors.red}Found ${issues.length} issues:${colors.reset}`);
    issues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log(`${colors.green}✓ All translations are valid${colors.reset}`);
  }
  console.log('');
}

// Sync translations across all languages
async function syncTranslations() {
  console.log(`${colors.yellow}Syncing translations...${colors.reset}`);

  const enTranslations = require('../src/translations/en.json');
  let changes = 0;

  // Update each language
  for (const [langCode, langName] of Object.entries(LANGUAGES)) {
    if (langCode === 'en') continue;

    const langFile = path.join(__dirname, `../src/translations/${langCode}.json`);
    if (!fs.existsSync(langFile)) continue;

    const langTranslations = require(langFile);
    let langChanges = 0;

    // Sync categories and strings
    Object.keys(enTranslations).forEach(category => {
      if (!langTranslations[category]) {
        langTranslations[category] = {
          title: enTranslations[category].title,
          description: enTranslations[category].description,
          strings: {},
        };
        langChanges++;
      }

      Object.keys(enTranslations[category].strings).forEach(key => {
        if (!langTranslations[category].strings[key]) {
          langTranslations[category].strings[key] = `[${langCode}] ${key}`;
          langChanges++;
        }
      });
    });

    if (langChanges > 0) {
      fs.writeFileSync(langFile, JSON.stringify(langTranslations, null, 2));
      console.log(`${colors.green}✓ Updated ${langName} with ${langChanges} changes${colors.reset}`);
      changes += langChanges;
    }
  }

  console.log(`\n${colors.green}✓ Sync completed with ${changes} total changes${colors.reset}\n`);
}

// Add a new language
async function addLanguage(langCode) {
  console.log(`${colors.yellow}Adding new language: ${langCode}...${colors.reset}`);

  if (LANGUAGES[langCode]) {
    throw new Error(`Language ${langCode} already exists`);
  }

  // Copy English translations as template
  const enFile = path.join(__dirname, '../src/translations/en.json');
  const newLangFile = path.join(__dirname, `../src/translations/${langCode}.json`);

  const enTranslations = require(enFile);
  const newTranslations = JSON.parse(JSON.stringify(enTranslations));

  // Reset all strings to untranslated state
  Object.keys(newTranslations).forEach(category => {
    Object.keys(newTranslations[category].strings).forEach(key => {
      newTranslations[category].strings[key] = `[${langCode}] ${key}`;
    });
  });

  fs.writeFileSync(newLangFile, JSON.stringify(newTranslations, null, 2));

  // Update languages list
  const configFile = path.join(__dirname, '../src/config/constants.js');
  let configContent = fs.readFileSync(configFile, 'utf8');
  
  const langEntry = `  ${langCode}: '${langCode.toUpperCase()}',`;
  configContent = configContent.replace(
    /export const LANGUAGES = {/,
    `export const LANGUAGES = {\n${langEntry}`
  );

  fs.writeFileSync(configFile, configContent);

  console.log(`${colors.green}✓ Added new language: ${langCode}${colors.reset}\n`);
}

// Helper function to determine category from file path
function determineCategory(filePath) {
  const relativePath = path.relative(path.join(__dirname, '../src'), filePath);
  for (const category of CATEGORIES) {
    if (relativePath.includes(category)) {
      return category;
    }
  }
  return 'common';
}

// Show help message
function showHelp() {
  console.log(`
${colors.bright}Translation Management Tool${colors.reset}

Usage: node scripts/manage-translations.js <command>

Commands:
  init           Initialize translation files for all supported languages
  extract        Extract translatable strings from source code
  validate       Validate translations for all languages
  sync           Sync translations across all languages
  add-language   Add a new language (e.g., node scripts/manage-translations.js add-language fr)

Supported Languages:
${Object.entries(LANGUAGES)
  .map(([code, name]) => `  ${code}: ${name}`)
  .join('\n')}
`);
}

// Run the script
manageTranslations();
