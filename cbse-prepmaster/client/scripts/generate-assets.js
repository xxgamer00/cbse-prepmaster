const sharp = require('sharp');
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

// Asset configurations
const iconSizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
  playStore: 512,
};

const splashSizes = {
  port: {
    mdpi: { width: 320, height: 480 },
    hdpi: { width: 480, height: 720 },
    xhdpi: { width: 720, height: 1280 },
    xxhdpi: { width: 960, height: 1600 },
    xxxhdpi: { width: 1280, height: 1920 },
  },
  land: {
    mdpi: { width: 480, height: 320 },
    hdpi: { width: 720, height: 480 },
    xhdpi: { width: 1280, height: 720 },
    xxhdpi: { width: 1600, height: 960 },
    xxxhdpi: { width: 1920, height: 1280 },
  },
};

async function generateAssets() {
  console.log(`${colors.bright}Starting asset generation...${colors.reset}\n`);

  try {
    // Create necessary directories
    const resDir = path.join(__dirname, '../android/app/src/main/res');
    const drawableDirs = [
      'drawable',
      'drawable-mdpi',
      'drawable-hdpi',
      'drawable-xhdpi',
      'drawable-xxhdpi',
      'drawable-xxxhdpi',
      'drawable-land-mdpi',
      'drawable-land-hdpi',
      'drawable-land-xhdpi',
      'drawable-land-xxhdpi',
      'drawable-land-xxxhdpi',
      'drawable-port-mdpi',
      'drawable-port-hdpi',
      'drawable-port-xhdpi',
      'drawable-port-xxhdpi',
      'drawable-port-xxxhdpi',
    ];

    drawableDirs.forEach(dir => {
      const dirPath = path.join(resDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Generate app icon
    console.log(`${colors.yellow}Generating app icons...${colors.reset}`);
    
    const iconSource = path.join(__dirname, '../src/assets/icon.png');
    if (!fs.existsSync(iconSource)) {
      throw new Error('Icon source file not found at: ' + iconSource);
    }

    for (const [density, size] of Object.entries(iconSizes)) {
      const outputPath = path.join(
        resDir,
        density === 'playStore' ? '../../../../../assets' : `drawable-${density}`,
        density === 'playStore' ? 'play_store_512.png' : 'ic_launcher.png'
      );

      await sharp(iconSource)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    }

    console.log(`${colors.green}✓ App icons generated${colors.reset}\n`);

    // Generate splash screens
    console.log(`${colors.yellow}Generating splash screens...${colors.reset}`);
    
    const splashSource = path.join(__dirname, '../src/assets/splash.png');
    if (!fs.existsSync(splashSource)) {
      throw new Error('Splash source file not found at: ' + splashSource);
    }

    // Generate portrait splash screens
    for (const [density, dimensions] of Object.entries(splashSizes.port)) {
      const outputPath = path.join(
        resDir,
        `drawable-port-${density}`,
        'splash.png'
      );

      await sharp(splashSource)
        .resize(dimensions.width, dimensions.height, {
          fit: 'contain',
          background: { r: 25, g: 118, b: 210, alpha: 1 }, // Material Blue
        })
        .png()
        .toFile(outputPath);
    }

    // Generate landscape splash screens
    for (const [density, dimensions] of Object.entries(splashSizes.land)) {
      const outputPath = path.join(
        resDir,
        `drawable-land-${density}`,
        'splash.png'
      );

      await sharp(splashSource)
        .resize(dimensions.width, dimensions.height, {
          fit: 'contain',
          background: { r: 25, g: 118, b: 210, alpha: 1 }, // Material Blue
        })
        .png()
        .toFile(outputPath);
    }

    console.log(`${colors.green}✓ Splash screens generated${colors.reset}\n`);

    // Generate notification icons
    console.log(`${colors.yellow}Generating notification icons...${colors.reset}`);
    
    for (const [density, size] of Object.entries(iconSizes)) {
      if (density === 'playStore') continue;

      const outputPath = path.join(
        resDir,
        `drawable-${density}`,
        'ic_notification.png'
      );

      await sharp(iconSource)
        .resize(Math.floor(size * 0.75), Math.floor(size * 0.75))
        .png()
        .toFile(outputPath);
    }

    console.log(`${colors.green}✓ Notification icons generated${colors.reset}\n`);

    // Generate adaptive icons (Android 8.0+)
    console.log(`${colors.yellow}Generating adaptive icons...${colors.reset}`);
    
    const adaptiveBackground = {
      width: 108,
      height: 108,
      channels: 4,
      background: { r: 25, g: 118, b: 210, alpha: 1 },
    };

    const adaptiveForeground = await sharp(iconSource)
      .resize(72, 72)
      .extend({
        top: 18,
        bottom: 18,
        left: 18,
        right: 18,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // Save background
    await sharp({
      create: adaptiveBackground,
    })
      .png()
      .toFile(path.join(resDir, 'mipmap-anydpi-v26/ic_launcher_background.png'));

    // Save foreground
    await sharp(adaptiveForeground)
      .png()
      .toFile(path.join(resDir, 'mipmap-anydpi-v26/ic_launcher_foreground.png'));

    console.log(`${colors.green}✓ Adaptive icons generated${colors.reset}\n`);

    // Create XML resources
    console.log(`${colors.yellow}Creating XML resources...${colors.reset}`);
    
    // Adaptive icon XML
    const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(
      path.join(resDir, 'mipmap-anydpi-v26/ic_launcher.xml'),
      adaptiveIconXml
    );

    // Splash screen XML
    const splashXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/ic_launcher_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash"/>
    </item>
</layer-list>`;

    fs.writeFileSync(
      path.join(resDir, 'drawable/splash.xml'),
      splashXml
    );

    console.log(`${colors.green}✓ XML resources created${colors.reset}\n`);

    console.log(`${colors.bright}Asset generation completed successfully!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Asset generation failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run asset generation
generateAssets();
